import React, { useState, useMemo, useEffect } from 'react';
import { AZURE_AD_ROLES, DEFAULT_ROLE_IDS } from '../constants';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckIcon from './icons/CheckIcon';

interface RoleSelectorProps {
    selectedRoleIds: string[];
    onSelectedRoleIdsChange: (ids: string[]) => void;
    userDefaultRoles: string[] | null;
    onSaveDefaults: (ids: string[]) => Promise<void>;
    onResetDefaults: () => Promise<void>;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ 
    selectedRoleIds, 
    onSelectedRoleIdsChange, 
    userDefaultRoles, 
    onSaveDefaults, 
    onResetDefaults 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [useDefault, setUseDefault] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    
    const currentDefaults = userDefaultRoles || DEFAULT_ROLE_IDS;
    const defaultLabel = userDefaultRoles ? 'Use My Saved Defaults' : 'Use Default Roles (Recommended)';
    
    // Sync the useDefault state if the selected roles match the current defaults
    useEffect(() => {
        const sortedSelected = [...selectedRoleIds].sort();
        const sortedDefaults = [...currentDefaults].sort();
        if (JSON.stringify(sortedSelected) === JSON.stringify(sortedDefaults)) {
            setUseDefault(true);
        }
    }, [selectedRoleIds, currentDefaults]);

    const handleRoleToggle = (roleId: string) => {
        const newSelectedIds = selectedRoleIds.includes(roleId)
            ? selectedRoleIds.filter(id => id !== roleId)
            : [...selectedRoleIds, roleId];
        onSelectedRoleIdsChange(newSelectedIds);
    };
    
    const handleModeChange = (newModeIsDefault: boolean) => {
        setUseDefault(newModeIsDefault);
        if (newModeIsDefault) {
            onSelectedRoleIdsChange(currentDefaults);
        } else {
            // When switching to customize, we can either clear the selection or keep the current one.
            // Keeping it is often a better UX. If they want to start fresh, they can 'Deselect All'.
            // onSelectedRoleIdsChange([]);
        }
    };
    
    const handleSaveDefaultsClick = async () => {
        setSaveStatus('saving');
        await onSaveDefaults(selectedRoleIds);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
    };

    const filteredRoles = useMemo(() => {
        return AZURE_AD_ROLES.filter(role =>
            role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const selectAll = () => onSelectedRoleIdsChange(AZURE_AD_ROLES.map(r => r.id));
    const deselectAll = () => onSelectedRoleIdsChange([]);
    
    const renderSaveButtonContent = () => {
        switch (saveStatus) {
            case 'saving':
                return <><SpinnerIcon className="animate-spin -ml-1 mr-2 h-5 w-5" /> Saving...</>;
            case 'saved':
                return <><CheckIcon className="-ml-1 mr-2 h-5 w-5" /> Saved!</>;
            default:
                return 'Save as Default';
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between">
                <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="role-mode"
                            checked={useDefault}
                            onChange={() => handleModeChange(true)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="font-medium text-gray-700">{defaultLabel}</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="role-mode"
                            checked={!useDefault}
                            onChange={() => handleModeChange(false)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="font-medium text-gray-700">Customize Roles</span>
                    </label>
                </div>
                {userDefaultRoles && (
                     <button type="button" onClick={onResetDefaults} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        Reset to Recommended
                    </button>
                )}
            </div>
            
            {!useDefault && (
                 <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                         <input
                            type="text"
                            placeholder="Search roles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <div className="flex items-center space-x-2">
                             <button type="button" onClick={selectAll} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Select All</button>
                             <span className="text-gray-300">|</span>
                             <button type="button" onClick={deselectAll} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Deselect All</button>
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                        {filteredRoles.map(role => (
                            <div key={role.id} className="relative flex items-start p-3 rounded-md hover:bg-gray-50 transition-colors">
                                <div className="flex items-center h-5">
                                    <input
                                        id={`role-${role.id}`}
                                        name={`role-${role.id}`}
                                        type="checkbox"
                                        checked={selectedRoleIds.includes(role.id)}
                                        onChange={() => handleRoleToggle(role.id)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor={`role-${role.id}`} className="font-medium text-gray-900 cursor-pointer">{role.displayName}</label>
                                    <p className="text-gray-500">{role.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                        <button 
                            type="button" 
                            onClick={handleSaveDefaultsClick}
                            disabled={saveStatus !== 'idle'}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        >
                            {renderSaveButtonContent()}
                        </button>
                    </div>
                </div>
            )}

            <p className="text-sm text-gray-600 mt-2">
                Selected {selectedRoleIds.length} out of {AZURE_AD_ROLES.length} roles.
            </p>
        </div>
    );
};

export default RoleSelector;
