import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DelegatedAdminRelationship, DelegatedAdminAccessAssignment, UnifiedRole } from '../types';
import {
    getGDAPAssignmentsWithGroupDisplayNames,
    createGDAPAccessAssignment,
    updateGDAPAccessAssignment,
    deleteGDAPAccessAssignment
} from '../services/graphService';
import { AZURE_AD_ROLES, GROUP_TEMPLATES } from '../constants';
import RoleSelector from './RoleSelector';
import SpinnerIcon from './icons/SpinnerIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import ClipboardCheckIcon from './icons/ClipboardCheckIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import TrashIcon from './icons/TrashIcon';

interface AssignmentEditorProps {
    relationship: DelegatedAdminRelationship | null;
    getAccessToken: () => Promise<string>;
}

// A small component to copy text to clipboard
const CopyToClipboard: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="ml-2 text-gray-400 hover:text-gray-600">
            {copied ? <ClipboardCheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
        </button>
    );
};


const AssignmentForm: React.FC<{
    relationshipId: string;
    existingAssignment?: DelegatedAdminAccessAssignment | null;
    onSave: () => void;
    onCancel: () => void;
    getAccessToken: () => Promise<string>;
}> = ({ relationshipId, existingAssignment, onSave, onCancel, getAccessToken }) => {
    const [securityGroupId, setSecurityGroupId] = useState(existingAssignment?.accessContainer.accessContainerId || '');
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(existingAssignment?.accessDetails.unifiedRoles.map(r => r.roleDefinitionId) || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!securityGroupId.trim() || selectedRoleIds.length === 0) {
            setError('Security Group ID and at least one role are required.');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const token = await getAccessToken();
            if (existingAssignment) {
                const etag = existingAssignment['@odata.etag'];
                if (!etag) {
                    setError('The assignment data is stale. Please cancel and edit the assignment again to refresh its state.');
                    setIsSubmitting(false);
                    return;
                }
                await updateGDAPAccessAssignment(relationshipId, existingAssignment.id, selectedRoleIds, etag, token);
            } else {
                await createGDAPAccessAssignment(relationshipId, securityGroupId, selectedRoleIds, token);
            }
            onSave();
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const applyTemplate = (template: 'basic' | 'advanced' | 'expert') => {
        const selectedTemplate = GROUP_TEMPLATES[template];
        setSecurityGroupId(selectedTemplate.groupId);
        setSelectedRoleIds(selectedTemplate.roleIds);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{existingAssignment ? 'Edit Assignment' : 'New Assignment'}</h3>
            <div>
                 <label htmlFor="securityGroupId" className="block text-sm font-medium text-gray-700">
                    Security Group ID
                </label>
                <input
                    type="text"
                    id="securityGroupId"
                    value={securityGroupId}
                    onChange={(e) => setSecurityGroupId(e.target.value)}
                    disabled={!!existingAssignment}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                    placeholder="Enter Azure AD Security Group Object ID"
                    required
                />
            </div>

            <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Apply Template:</span>
                <button type="button" onClick={() => applyTemplate('basic')} className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full hover:bg-blue-600">Basic</button>
                <button type="button" onClick={() => applyTemplate('advanced')} className="px-2 py-1 text-xs font-semibold text-white bg-purple-500 rounded-full hover:bg-purple-600">Advanced</button>
                <button type="button" onClick={() => applyTemplate('expert')} className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full hover:bg-red-600">Expert</button>
            </div>

            <div>
                 <h4 className="text-md font-medium text-gray-800 mb-2">Assign Roles</h4>
                 <RoleSelector
                    selectedRoleIds={selectedRoleIds}
                    onSelectedRoleIdsChange={setSelectedRoleIds}
                    userDefaultRoles={null}
                    onSaveDefaults={async () => {}}
                    onResetDefaults={async () => {}}
                />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end space-x-3">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400"
                >
                    {isSubmitting ? <SpinnerIcon className="animate-spin h-5 w-5" /> : 'Save Assignment'}
                </button>
            </div>
        </form>
    );
};


const AssignmentEditor: React.FC<AssignmentEditorProps> = ({ relationship, getAccessToken }) => {
    const [assignments, setAssignments] = useState<DelegatedAdminAccessAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [editingAssignment, setEditingAssignment] = useState<DelegatedAdminAccessAssignment | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
    const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

    const roleMap = useMemo(() => new Map<string, UnifiedRole>(AZURE_AD_ROLES.map(role => [role.id, role])), []);

    const fetchAssignments = useCallback(async () => {
        if (!relationship) return;
        setIsLoading(true);
        setError(null);
        setFeedbackMessage(null); // Clear messages on fetch
        setEditingAssignment(null);
        setIsCreating(false);
        setIsProcessingId(null);
        try {
            const token = await getAccessToken();
            const data = await getGDAPAssignmentsWithGroupDisplayNames(relationship.id, token);
            setAssignments(data);
        } catch (err: any) {
            setError(err.message || 'An error occurred fetching assignments.');
        } finally {
            setIsLoading(false);
        }
    }, [relationship, getAccessToken]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const handleRemoveAssignment = async (assignment: DelegatedAdminAccessAssignment) => {
        const groupName = assignment.accessContainer.displayName || assignment.accessContainer.accessContainerId;
        if (!window.confirm(`Are you sure you want to remove the assignment for "${groupName}"? This action cannot be undone.`)) {
            return;
        }
        
        const etag = assignment['@odata.etag'];
        if (!etag) {
            setError('The assignment data is stale and missing a required ETag. Please refresh the assignments list and try again.');
            return;
        }

        setIsProcessingId(assignment.id);
        setError(null);
        setFeedbackMessage(null);
        
        try {
            const token = await getAccessToken();
            await deleteGDAPAccessAssignment(relationship!.id, assignment.id, etag, token);
            
            // Optimistic UI Update: Remove the item from local state immediately for instant feedback.
            setAssignments(prevAssignments => prevAssignments.filter(a => a.id !== assignment.id));

            // Set a success message that clears itself.
            setFeedbackMessage(`Successfully removed assignment for "${groupName}".`);
            setTimeout(() => setFeedbackMessage(null), 6000);

        } catch (err: any) {
            setError(err.message || 'Failed to remove assignment.');
        } finally {
            // Always reset the processing state for this item, regardless of outcome.
            setIsProcessingId(null);
        }
    };
    
    if (!relationship) {
        return (
            <div className="flex items-center justify-center h-full text-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-700">Select a Relationship</h2>
                    <p className="mt-2 text-gray-500">Choose a GDAP relationship from the list to view and manage its role assignments.</p>
                </div>
            </div>
        );
    }

    const { displayName, customer } = relationship;
    const canHaveAssignments = relationship.status === 'active';

    const handleSave = () => {
        setEditingAssignment(null);
        setIsCreating(false);
        setFeedbackMessage("Assignment saved successfully. The list will refresh shortly to reflect changes from the server.");
        setTimeout(() => {
            fetchAssignments(); // This will clear the feedback message upon starting.
        }, 6500); // Keep delay for API replication
    };

    const handleCancel = () => {
        setEditingAssignment(null);
        setIsCreating(false);
    };

    const handleToggleExpand = (assignmentId: string) => {
        setExpandedAssignmentId(prevId => (prevId === assignmentId ? null : assignmentId));
    };

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-xl font-bold text-gray-900 truncate" title={displayName}>{displayName}</h2>
                <p className="text-sm text-gray-500">Customer Tenant ID: {customer.tenantId}</p>
            </header>

            {feedbackMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium">{feedbackMessage}</p>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-semibold">An error occurred</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center p-4">
                    <SpinnerIcon className="h-6 w-6 animate-spin text-indigo-600" />
                    <span className="ml-2 text-gray-600">Loading assignments...</span>
                </div>
            )}

            {!isLoading && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-800">Security Group Assignments</h3>
                        <div className="flex items-center space-x-2">
                             <button
                                onClick={fetchAssignments}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                title="Refresh Assignments"
                                disabled={isLoading}
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4a14.95 14.95 0 0113.433 4.805M20 20a14.95 14.95 0 01-13.433-4.805" />
                                </svg>
                            </button>
                            {canHaveAssignments && (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    disabled={isCreating || !!editingAssignment}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                                >
                                    New Assignment
                                </button>
                            )}
                        </div>
                    </div>

                    {!canHaveAssignments && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                             Assignments can only be managed for relationships with an 'active' status.
                        </div>
                    )}

                    {isCreating && (
                        <AssignmentForm
                            relationshipId={relationship.id}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            getAccessToken={getAccessToken}
                        />
                    )}

                    {assignments.length > 0 ? (
                        <ul className="space-y-3">
                            {assignments.map(assignment => (
                                editingAssignment?.id === assignment.id ? (
                                    <li key={assignment.id}>
                                        <AssignmentForm
                                            relationshipId={relationship.id}
                                            existingAssignment={assignment}
                                            onSave={handleSave}
                                            onCancel={handleCancel}
                                            getAccessToken={getAccessToken}
                                        />
                                    </li>
                                ) : (
                                    <li key={assignment.id} className="border border-gray-200 rounded-lg bg-white">
                                        <div className="p-4 flex justify-between items-center">
                                            <div>
                                                <div className="font-semibold text-gray-800 flex items-center">
                                                    <span className="truncate" title={assignment.accessContainer.accessContainerId}>
                                                        {assignment.accessContainer.displayName || assignment.accessContainer.accessContainerId}
                                                    </span>
                                                    <CopyToClipboard text={assignment.accessContainer.accessContainerId} />
                                                </div>
                                            </div>
                                            {canHaveAssignments && (
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => setEditingAssignment(assignment)}
                                                        disabled={isCreating || !!editingAssignment || !!isProcessingId}
                                                        className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:opacity-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveAssignment(assignment)}
                                                        disabled={isCreating || !!editingAssignment || !!isProcessingId}
                                                        className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50 flex items-center"
                                                    >
                                                        {isProcessingId === assignment.id ? (
                                                            <SpinnerIcon className="animate-spin h-4 w-4" />
                                                        ) : (
                                                            <TrashIcon className="h-4 w-4" />
                                                        )}
                                                        <span className="ml-1.5">Remove</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-200">
                                            <button onClick={() => handleToggleExpand(assignment.id)} className="w-full p-4 flex justify-between items-center text-left hover:bg-gray-50 focus:outline-none">
                                                <p className="text-sm font-medium text-gray-600">Assigned Roles ({assignment.accessDetails.unifiedRoles.length})</p>
                                                <ChevronDownIcon
                                                    className={`h-5 w-5 text-gray-400 transition-transform transform ${
                                                        expandedAssignmentId === assignment.id ? 'rotate-180' : ''
                                                    }`}
                                                />
                                            </button>
                                            {expandedAssignmentId === assignment.id && (
                                                <div className="px-4 pb-4 flex flex-wrap gap-2">
                                                    {assignment.accessDetails.unifiedRoles.map(role => (
                                                        <span key={role.roleDefinitionId} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                            {roleMap.get(role.roleDefinitionId)?.displayName || role.roleDefinitionId}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                )
                            ))}
                        </ul>
                    ) : (
                        !isCreating && <p className="text-gray-500 text-sm">No assignments found for this relationship.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AssignmentEditor;