import React, { useState, useMemo } from 'react';
import { DelegatedAdminRelationship } from '../types';
import SearchIcon from './icons/SearchIcon';

interface RelationshipListProps {
    relationships: DelegatedAdminRelationship[];
    selectedRelationshipId: string | null;
    onSelectRelationship: (relationship: DelegatedAdminRelationship) => void;
    onRefresh: () => void;
}

const RelationshipList: React.FC<RelationshipListProps> = ({ relationships, selectedRelationshipId, onSelectRelationship, onRefresh }) => {
    const [filter, setFilter] = useState('');

    const filteredRelationships = useMemo(() => {
        if (!filter) return relationships;
        return relationships.filter(
            (r) =>
                r.displayName.toLowerCase().includes(filter.toLowerCase()) ||
                r.customer.tenantId.toLowerCase().includes(filter.toLowerCase())
        );
    }, [relationships, filter]);

    const getStatusColor = (status: DelegatedAdminRelationship['status']) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'approvalPending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-blue-100 text-blue-800';
            case 'terminated':
            case 'expired':
                return 'bg-gray-100 text-gray-800';
            default: return 'bg-purple-100 text-purple-800';
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-semibold text-gray-800">Relationships</h2>
                 <button onClick={onRefresh} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Refresh</button>
            </div>
            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Filter by name or tenant ID..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <div className="flex-grow overflow-y-auto -mr-4 pr-2">
                {filteredRelationships.length > 0 ? (
                    <ul className="space-y-2">
                        {filteredRelationships.map((r) => (
                            <li key={r.id}>
                                <button
                                    onClick={() => onSelectRelationship(r)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedRelationshipId === r.id ? 'bg-indigo-100 shadow' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-gray-900 truncate">{r.displayName}</p>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(r.status)}`}>
                                            {r.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{r.customer.tenantId}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500">No relationships found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelationshipList;
