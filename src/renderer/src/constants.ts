import { UnifiedRole } from './types';

/**
 * Set of Microsoft Entra built-in roles
 * with unified role definition IDs from Microsoft Learn.
 * Source: https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference
 */
export const AZURE_AD_ROLES: UnifiedRole[] = [
  { id: '9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3', displayName: 'Application Administrator', description: 'Can create and manage all aspects of app registrations and enterprise apps.' },
  { id: 'cf1c38e5-3621-4004-a7cb-879624dced7c', displayName: 'Application Developer', description: 'Can create application registrations independent of the tenant setting.' },
  { id: '9c6df0f2-1e7c-4dc3-b195-66dfbd24aa8f', displayName: 'Attack Payload Author', description: 'Create and manage attack payloads that an administrator can initiate.' },
  { id: 'c430b396-e693-46cc-96f3-db01bf8bb62a', displayName: 'Attack Simulation Administrator', description: 'Create and manage all aspects of attack simulation campaigns.' },
  { id: 'c4e39bd9-1100-46d3-8c65-fb160da0071f', displayName: 'Authentication Administrator', description: 'Can view, set, and reset authentication method information for non-admin users.' },
  { id: 'e3973bdf-4987-49ae-837a-ba8e231c7286', displayName: 'Azure DevOps Administrator', description: 'Manage Azure DevOps policies and settings.' },
  { id: '7495fdc4-34c4-4d15-a289-98788ce399fd', displayName: 'Azure Information Protection Administrator', description: 'Manage all aspects of Azure Information Protection.' },
  { id: 'b0f54661-2d74-4c50-afa3-1ec803f12efe', displayName: 'Billing Administrator', description: 'Manage subscriptions, purchases, and invoices.' },
  { id: '158c047a-c907-4556-b7ef-446551a6b5f7', displayName: 'Cloud Application Administrator', description: 'Manage app registrations and enterprise apps except App Proxy.' },
  { id: '7698a772-787b-4ac8-901f-60d6b08affd2', displayName: 'Cloud Device Administrator', description: 'Manage devices in Microsoft Entra ID.' },
  { id: '17315797-102d-40b4-93e0-432062caca18', displayName: 'Compliance Administrator', description: 'Read and manage compliance configuration and reports.' },
  { id: 'b1be1c3e-b65d-4f19-8427-f6fa0d97feb9', displayName: 'Conditional Access Administrator', description: 'Create and manage Conditional Access policies.' },
  { id: '38a96431-2bdf-4b4c-8b6e-5d3d8abac1a4', displayName: 'Desktop Analytics Administrator', description: 'Access and manage Desktop management tools and services.' },
  { id: '88d8e3e3-8f55-4a1e-953a-9b9898b8876b', displayName: 'Directory Readers', description: 'Read basic directory information.' },
  { id: 'd29b2b05-8046-44ba-8758-1e26182fcf32', displayName: 'Directory Synchronization Accounts', description: 'Used by Microsoft Entra Connect service.' },
  { id: '9360feb5-f418-4baa-8175-e2a00bac4301', displayName: 'Directory Writers', description: 'Read and write basic directory information (for apps).' },
  { id: '8329153b-31d0-4727-b945-745eb3bc5f31', displayName: 'Domain Name Administrator', description: 'Manage domain names.' },
  { id: '44367163-eba1-44c3-98af-f5787879f96a', displayName: 'Dynamics 365 Administrator', description: 'Manage all aspects of the Dynamics 365 product.' },
  { id: '29232cdf-9323-42fd-ade2-1d097af3e4de', displayName: 'Exchange Administrator', description: 'Manage all aspects of Exchange Online.' },
  { id: '31392ffb-586c-42d1-9346-e59415a2cc4e', displayName: 'Exchange Recipient Administrator', description: 'Manage Exchange Online recipients.' },
  { id: 'be2f45a1-457d-42af-a067-6ec1fa63bc45', displayName: 'External Identity Provider Administrator', description: 'Configure identity providers for direct federation.' },
  { id: '62e90394-69f5-4237-9190-012177145e10', displayName: 'Global Administrator', description: 'Full access to Microsoft Entra ID and services (avoid for GDAP).' },
  { id: 'f2ef992c-3afb-46b9-b7cf-a126ee74c451', displayName: 'Global Reader', description: 'Read-only access equivalent to Global Administrator.' },
  { id: 'fdd7a751-b60b-444a-984c-02652fe8fa1c', displayName: 'Groups Administrator', description: 'Create and manage groups and group settings.' },
  { id: '95e79109-95c0-4d8e-aee3-d01accf2d47b', displayName: 'Guest Inviter', description: 'Invite guest users to the organisation.' },
  { id: '729827e3-9c14-49f7-bb1b-9608f156bbb8', displayName: 'Helpdesk Administrator', description: 'Reset passwords for non-admins and Helpdesk administrators.' },
  { id: '8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2', displayName: 'Hybrid Identity Administrator', description: 'Manage Entra Connect, PTA, PHS, federation, and SSO.' },
  { id: 'eb1f4a8d-243a-41f0-9fbd-c7cdf6c5ef7c', displayName: 'Insights Administrator', description: 'Admin access in Microsoft 365 Insights app.' },
  { id: '3a2c62db-5318-420d-8d74-23affee5d9d5', displayName: 'Intune Administrator', description: 'Manage all aspects of Intune.' },
  { id: '59d46f88-662b-457b-bceb-5c3809e5908f', displayName: 'Lifecycle Workflows Administrator', description: 'Create and manage lifecycle workflows.' },
  { id: '4d6ac14f-3453-41d0-bef9-a3e0c569773a', displayName: 'License Administrator', description: 'Manage product licences on users and groups.' },
  { id: 'ac16e43d-7b2d-40e0-ac05-243ff356ab5b', displayName: 'Message Center Privacy Reader', description: 'Read privacy-sensitive messages in Message Center.' },
  { id: '790c1fb9-7f7d-4f88-86a1-ef1f95c05c1b', displayName: 'Message Center Reader', description: 'Read messages and updates in Message Center.' },
  { id: '9f06204d-73c1-4d4c-880a-6edb90606fd8', displayName: 'Microsoft Entra Joined Device Local Administrator', description: 'Local admin on Entra-joined devices.' },
  { id: 'd37c8bed-0711-4417-ba38-b4abe66ce4c2', displayName: 'Network Administrator', description: 'Manage network locations and related insights.' },
  { id: '2b745bdf-0803-4d80-aa65-822c4493daac', displayName: 'Office Apps Administrator', description: 'Manage Office apps cloud services and settings.' },
  { id: '966707d0-3269-4727-9be2-8c3a10f19b9d', displayName: 'Password Administrator', description: 'Reset passwords for non-admins and Password Administrators.' },
  { id: 'a9ea8996-122f-4c74-9520-8edcd192826c', displayName: 'Fabric Administrator', description: 'Manage all aspects of Microsoft Fabric and Power BI.' },
  { id: '11648597-926c-4cf3-9c36-bcebb0ba8dcc', displayName: 'Power Platform Administrator', description: 'Manage Dynamics 365, Power Apps and Power Automate.' },
  { id: '644ef478-e28f-4e28-b9dc-3fdde9aa0b1f', displayName: 'Printer Administrator', description: 'Manage printers and printer connectors.' },
  { id: 'e8cef6f1-e4bd-4ea8-bc07-4b8d950f4477', displayName: 'Printer Technician', description: 'Register/unregister printers and update printer status.' },
  { id: '7be44c8a-adaf-4e2a-84d6-ab2649e08a13', displayName: 'Privileged Authentication Administrator', description: 'Manage authentication methods for any user.' },
  { id: 'e8611ab8-c189-46e8-94e1-60213ab1f814', displayName: 'Privileged Role Administrator', description: 'Manage role assignments and PIM.' },
  { id: '4a5d8f65-41da-4de4-8968-e035b65339cf', displayName: 'Reports Reader', description: 'Read usage reporting data and dashboards.' },
  { id: '0964bb5e-9bdb-4d7b-ac29-58e794862a40', displayName: 'Search Administrator', description: 'Manage Microsoft Search settings.' },
  { id: '8835291a-918c-4fd7-a9ce-faa49f0cf7d9', displayName: 'Search Editor', description: 'Manage editorial content for Microsoft Search.' },
  { id: '194ae4cb-b126-40b2-bd5b-6091b380977d', displayName: 'Security Administrator', description: 'Manage security configuration and read security data.' },
  { id: '5d6b6bb7-de71-4623-b4af-96380a352509', displayName: 'Security Reader', description: 'Read security information and reports.' },
  { id: 'f023fd81-a637-4b56-95fd-791ac0226033', displayName: 'Service Support Administrator', description: 'Read service health and manage support tickets.' },
  { id: 'f28a1f50-f6e7-4571-818b-6a12f2af6b6c', displayName: 'SharePoint Administrator', description: 'Manage all aspects of SharePoint/OneDrive.' },
  { id: '75941009-915a-4869-abe7-691bff18279e', displayName: 'Skype for Business Administrator', description: 'Manage Skype for Business service.' },
  { id: '69091246-20e8-4a56-aa4d-066075b2a7a8', displayName: 'Teams Administrator', description: 'Manage Microsoft Teams service.' },
  { id: 'baf37b3a-610e-45da-9e62-d9d1e5e8914b', displayName: 'Teams Communications Administrator', description: 'Manage calling and meetings features.' },
  { id: 'f70938a0-fc10-4177-9e90-2178f8765737', displayName: 'Teams Communications Support Engineer', description: 'Troubleshoot Teams comms issues (advanced).' },
  { id: 'fcf91098-03e3-41a9-b5ba-6f0ec8188a12', displayName: 'Teams Communications Support Specialist', description: 'Troubleshoot Teams comms issues (basic).' },
  { id: '3d762c5a-1b6c-493f-843e-55a3b42923d4', displayName: 'Teams Devices Administrator', description: 'Manage Teams-certified devices.' },
  { id: 'fe930be7-5e62-47db-91af-98c3a49a38b1', displayName: 'User Administrator', description: 'Manage users and groups; reset passwords for limited admins.' },
  { id: '11451d60-acb2-45eb-a7d6-43d0f0125c13', displayName: 'Windows 365 Administrator', description: 'Provision and manage Cloud PCs.' },
];

/**
 * Default roles to apply if user doesn’t customise selection.
 */
export const DEFAULT_ROLE_IDS: string[] = [
      'fdd7a751-b60b-444a-984c-02652fe8fa1c', // Groups Administrator
      'fe930be7-5e62-47db-91af-98c3a49a38b1', // User Administrator
      'f2ef992c-3afb-46b9-b7cf-a126ee74c451', // Global Reader
      '9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3', // Application Administrator
      'c4e39bd9-1100-46d3-8c65-fb160da0071f', // Authentication Administrator
      '8329153b-31d0-4727-b945-745eb3bc5f31', // Domain Name Administrator
      '29232cdf-9323-42fd-ade2-1d097af3e4de', // Exchange Administrator
      '3a2c62db-5318-420d-8d74-23affee5d9d5', // Intune Administrator
      '9f06204d-73c1-4d4c-880a-6edb90606fd8', // Microsoft Entra Joined Device Local Administrator
      '644ef478-e28f-4e28-b9dc-3fdde9aa0b1f', // Printer Administrator
      'f28a1f50-f6e7-4571-818b-6a12f2af6b6c', // SharePoint Administrator
      '69091246-20e8-4a56-aa4d-066075b2a7a8', // Teams Administrator
      'a9ea8996-122f-4c74-9520-8edcd192826c', // Fabric Administrator
      '8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2', // Hybrid Identity Administrator
      'eb1f4a8d-243a-41f0-9fbd-c7cdf6c5ef7c', // Insights Administrator
      '59d46f88-662b-457b-bceb-5c3809e5908f', // Lifecycle Workflows Administrator
      '11648597-926c-4cf3-9c36-bcebb0ba8dcc', // Power Platform Administrator
      '7be44c8a-adaf-4e2a-84d6-ab2649e08a13', // Privileged Authentication Administrator
      'e8611ab8-c189-46e8-94e1-60213ab1f814', // Privileged Role Administrator
      '194ae4cb-b126-40b2-bd5b-6091b380977d', // Security Administrator
];

/** Predefined group templates for role assignments */
export const GROUP_TEMPLATES = {
  basic: {
    name: 'Production Basic',
    groupId: 'f7c2d8a1-4b3e-4e9a-9d6f-2a8f4b7c1e35', // CHANGE THIS!
    roleIds: [
      'fdd7a751-b60b-444a-984c-02652fe8fa1c', // Groups Administrator
      'fe930be7-5e62-47db-91af-98c3a49a38b1', // User Administrator
      'f2ef992c-3afb-46b9-b7cf-a126ee74c451', // Global Reader
    ],
  },
  advanced: {
    name: 'Production Advanced',
    groupId: 'f7c2d8a1-4b3e-4e9a-9d6f-2a8f4b7c1e35', // CHANGE THIS!
    roleIds: [
      'fdd7a751-b60b-444a-984c-02652fe8fa1c', // Groups Administrator
      'fe930be7-5e62-47db-91af-98c3a49a38b1', // User Administrator
      'f2ef992c-3afb-46b9-b7cf-a126ee74c451', // Global Reader
      '9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3', // Application Administrator
      'c4e39bd9-1100-46d3-8c65-fb160da0071f', // Authentication Administrator
      '8329153b-31d0-4727-b945-745eb3bc5f31', // Domain Name Administrator
      '29232cdf-9323-42fd-ade2-1d097af3e4de', // Exchange Administrator
      '3a2c62db-5318-420d-8d74-23affee5d9d5', // Intune Administrator
      '9f06204d-73c1-4d4c-880a-6edb90606fd8', // Microsoft Entra Joined Device Local Administrator
      '644ef478-e28f-4e28-b9dc-3fdde9aa0b1f', // Printer Administrator
      'f28a1f50-f6e7-4571-818b-6a12f2af6b6c', // SharePoint Administrator
      '69091246-20e8-4a56-aa4d-066075b2a7a8', // Teams Administrator
    ],
  },
  expert: {
    name: 'Production Expert',
    groupId: 'f7c2d8a1-4b3e-4e9a-9d6f-2a8f4b7c1e35', // CHANGE THIS!!
    roleIds: [
      'fdd7a751-b60b-444a-984c-02652fe8fa1c', // Groups Administrator
      'fe930be7-5e62-47db-91af-98c3a49a38b1', // User Administrator
      'f2ef992c-3afb-46b9-b7cf-a126ee74c451', // Global Reader
      '9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3', // Application Administrator
      'c4e39bd9-1100-46d3-8c65-fb160da0071f', // Authentication Administrator
      '8329153b-31d0-4727-b945-745eb3bc5f31', // Domain Name Administrator
      '29232cdf-9323-42fd-ade2-1d097af3e4de', // Exchange Administrator
      '3a2c62db-5318-420d-8d74-23affee5d9d5', // Intune Administrator
      '9f06204d-73c1-4d4c-880a-6edb90606fd8', // Microsoft Entra Joined Device Local Administrator
      '644ef478-e28f-4e28-b9dc-3fdde9aa0b1f', // Printer Administrator
      'f28a1f50-f6e7-4571-818b-6a12f2af6b6c', // SharePoint Administrator
      '69091246-20e8-4a56-aa4d-066075b2a7a8', // Teams Administrator
      'a9ea8996-122f-4c74-9520-8edcd192826c', // Fabric Administrator
      '8ac3fc64-6eca-42ea-9e69-59f4c7b60eb2', // Hybrid Identity Administrator
      'eb1f4a8d-243a-41f0-9fbd-c7cdf6c5ef7c', // Insights Administrator
      '59d46f88-662b-457b-bceb-5c3809e5908f', // Lifecycle Workflows Administrator
      '11648597-926c-4cf3-9c36-bcebb0ba8dcc', // Power Platform Administrator
      '7be44c8a-adaf-4e2a-84d6-ab2649e08a13', // Privileged Authentication Administrator
      'e8611ab8-c189-46e8-94e1-60213ab1f814', // Privileged Role Administrator
      '194ae4cb-b126-40b2-bd5b-6091b380977d', // Security Administrator
    ],
  }
};


/** Helper to turn any GUID array into Graph payload shape */
export function toUnifiedRoles(roleIds: string[]) {
  return roleIds.map((id) => ({ roleDefinitionId: id }));
}

/** Convenience for defaults */
export function toUnifiedRolesFromDefaults() {
  return toUnifiedRoles(DEFAULT_ROLE_IDS);
}
