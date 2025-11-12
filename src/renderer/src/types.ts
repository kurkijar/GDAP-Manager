export interface UnifiedRole {
    id: string;
    displayName: string;
    description: string;
}

// This represents the payload for the Microsoft Graph API
export interface GraphApiGDAPRequest {
    displayName: string;
    duration: string; // ISO 8601 duration format, e.g., "P730D"
    autoExtendDuration?: string; // ISO 8601 duration format, e.g., "P180D" or "PT0S"
    customer: {
        tenantId: string;
    };
    accessDetails: {
        unifiedRoles: {
            roleDefinitionId: string;
        }[];
    };
}

export interface DelegatedAdminRelationship {
    id: string;
    displayName: string;
    duration: string;
    customer: {
        tenantId: string;
        displayName: string;
    };
    status: 'pending' | 'active' | 'terminating' | 'terminated' | 'expired' | 'approvalPending' | 'approved';
    createdDateTime: string;
    lastModifiedDateTime: string;
    endDateTime: string;
}

export interface DelegatedAdminAccessAssignment {
    '@odata.etag'?: string;
    id: string;
    status: 'pending' | 'active' | 'deleting' | 'deleted' | 'error';
    accessContainer: {
        accessContainerId: string;
        accessContainerType: 'securityGroup';
        displayName?: string;
    };
    accessDetails: {
        unifiedRoles: {
            roleDefinitionId: string;
        }[];
    };
    createdDateTime: string;
    lastModifiedDateTime: string;
}