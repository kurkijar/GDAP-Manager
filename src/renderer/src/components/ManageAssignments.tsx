import React, { useState, useEffect, useCallback } from 'react';
import { DelegatedAdminRelationship } from '../types';
import { getGDAPRelationships } from '../services/graphService';
import RelationshipList from './RelationshipList';
import AssignmentEditor from './AssignmentEditor';
import SpinnerIcon from './icons/SpinnerIcon';

const ManageAssignments: React.FC = () => {
    const [relationships, setRelationships] = useState<DelegatedAdminRelationship[]>([]);
    const [selectedRelationship, setSelectedRelationship] = useState<DelegatedAdminRelationship | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getAccessToken = useCallback(async () => {
        const response = await window.electronAPI.getToken();
        if (!response?.accessToken) {
            throw new Error('Failed to get access token.');
        }
        return response.accessToken;
    }, []);

    const fetchRelationships = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await getAccessToken();
            const data = await getGDAPRelationships(token);
            setRelationships(data);
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching relationships.');
        } finally {
            setIsLoading(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        fetchRelationships();
    }, [fetchRelationships]);

    const handleRefresh = () => {
        setSelectedRelationship(null);
        fetchRelationships();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <SpinnerIcon className="h-8 w-8 animate-spin text-indigo-600" />
                <span className="ml-2 text-gray-600">Loading relationships...</span>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">Failed to load data</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button 
                    onClick={fetchRelationships} 
                    className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 bg-white shadow-lg rounded-lg p-4 md:p-6 min-h-[600px]">
            <div className="md:col-span-1 lg:col-span-1 border-r border-gray-200 pr-4">
                <RelationshipList 
                    relationships={relationships}
                    selectedRelationshipId={selectedRelationship?.id || null}
                    onSelectRelationship={setSelectedRelationship}
                    onRefresh={handleRefresh}
                />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
                <AssignmentEditor 
                    key={selectedRelationship?.id} // Force re-mount on selection change
                    relationship={selectedRelationship} 
                    getAccessToken={getAccessToken} 
                />
            </div>
        </div>
    );
};

export default ManageAssignments;
