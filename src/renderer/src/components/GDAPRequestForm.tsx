import React, { useState, useEffect, useCallback } from 'react';
import { GraphApiGDAPRequest } from '../types';
import { DEFAULT_ROLE_IDS } from '../constants';
import { checkNameAvailability, createGDAPRequest } from '../services/graphService';
import { useDebounce } from '../hooks/useDebounce';
import RoleSelector from './RoleSelector';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';

enum NameStatus {
  IDLE,
  CHECKING,
  AVAILABLE,
  UNAVAILABLE,
}

const GDAPRequestForm: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [durationDays, setDurationDays] = useState(730);
  const [autoExtend, setAutoExtend] = useState(true);

  // Saved user defaults (from disk via Electron), if any
  const [userDefaultRoles, setUserDefaultRoles] = useState<string[] | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(DEFAULT_ROLE_IDS);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);

  const [nameStatus, setNameStatus] = useState<NameStatus>(NameStatus.IDLE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ success: boolean; message: string } | null>(null);

  const debouncedDisplayName = useDebounce(displayName, 2000);
  const GLOBAL_ADMIN_ROLE_ID = '62e90394-69f5-4237-9190-012177145e10';

  // Load custom defaults when the component mounts
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const loadedRoles = await window.electronAPI.loadDefaultRoles();
        if (loadedRoles && loadedRoles.length > 0) {
          setUserDefaultRoles(loadedRoles);
          setSelectedRoleIds(loadedRoles); // Start with user defaults selected
        }
      } catch (error) {
        console.error('Failed to load user default roles:', error);
      } finally {
        setDefaultsLoaded(true);
      }
    };
    loadDefaults();
  }, []);

  const getAccessToken = useCallback(async () => {
    try {
      const response = await window.electronAPI.getToken();
      if (!response || !response.accessToken) {
        throw new Error('Access token could not be retrieved. The response was empty.');
      }
      return response.accessToken;
    } catch (error) {
      console.error('Could not acquire access token:', error);
      throw new Error('Authentication failed. Please sign out and sign in again.');
    }
  }, []);

  const handleFormChange = () => {
    if (submissionStatus) {
      setSubmissionStatus(null);
    }
  };

  const checkName = useCallback(
    async (name: string) => {
      if (!name.trim()) {
        setNameStatus(NameStatus.IDLE);
        return;
      }
      try {
        setNameStatus(NameStatus.CHECKING);
        const accessToken = await getAccessToken();
        const isAvailable = await checkNameAvailability(name, accessToken);
        setNameStatus(isAvailable ? NameStatus.AVAILABLE : NameStatus.UNAVAILABLE);
      } catch (error: any) {
        console.error(error.message || 'An error occurred during name check.');
        setNameStatus(NameStatus.IDLE); // Reset on error
      }
    },
    [getAccessToken]
  );

  useEffect(() => {
    checkName(debouncedDisplayName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDisplayName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      nameStatus === NameStatus.UNAVAILABLE ||
      !displayName.trim() ||
      !tenantId.trim() ||
      selectedRoleIds.length === 0
    ) {
      setSubmissionStatus({ success: false, message: 'Please fix the errors before submitting.' });
      return;
    }
    
    // Proactive check for Global Admin + auto-extend combination
    if (autoExtend && selectedRoleIds.includes(GLOBAL_ADMIN_ROLE_ID)) {
      setSubmissionStatus({
        success: false,
        message: 'The Global Administrator role cannot be used with auto-extend. Please disable auto-extend or remove this role.'
      });
      return; // Stop submission
    }

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      const accessToken = await getAccessToken();
      const request: GraphApiGDAPRequest = {
        displayName,
        duration: `P${durationDays}D`,
        autoExtendDuration: autoExtend ? 'P180D' : 'PT0S',
        customer: {
          tenantId,
        },
        accessDetails: {
          unifiedRoles: selectedRoleIds.map((id) => ({ roleDefinitionId: id })),
        },
      };

      // createGDAPRequest now: create → (optional PATCH) → lockForApproval → wait for approvalPending
      const result = await createGDAPRequest(request, accessToken);

      if (result.success) {
        // Show the message from the service (e.g., “awaiting customer approval in their admin portal.”)
        setSubmissionStatus({ success: true, message: result.message });

        // Reset form on success
        setDisplayName('');
        setTenantId('');
        setDurationDays(730);
        setAutoExtend(true);
        setSelectedRoleIds(userDefaultRoles || DEFAULT_ROLE_IDS);
        setNameStatus(NameStatus.IDLE);
      } else {
        setSubmissionStatus(result);
      }
    } catch (error: any) {
      setSubmissionStatus({ success: false, message: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDefaults = async (roleIds: string[]) => {
    await window.electronAPI.saveDefaultRoles(roleIds);
    setUserDefaultRoles(roleIds);
  };

  const handleResetDefaults = async () => {
    await window.electronAPI.resetDefaultRoles();
    setUserDefaultRoles(null);
    setSelectedRoleIds(DEFAULT_ROLE_IDS);
  };

  const renderNameStatus = () => {
    switch (nameStatus) {
      case NameStatus.CHECKING:
        return <SpinnerIcon className="h-5 w-5 text-gray-400 animate-spin" />;
      case NameStatus.AVAILABLE:
        return <CheckIcon className="h-6 w-6 text-green-500" />;
      case NameStatus.UNAVAILABLE:
        return <XIcon className="h-6 w-6 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 md:p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Basic Info */}
        <div className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              Relationship Name
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  handleFormChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{renderNameStatus()}</div>
            </div>
            {nameStatus === NameStatus.UNAVAILABLE && (
              <p className="mt-2 text-sm text-red-600">This name is already in use.</p>
            )}
          </div>
          <div>
            <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700">
              Customer Tenant ID
            </label>
            <input
              type="text"
              id="tenantId"
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                handleFormChange();
              }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>

        {/* Section 2: Configuration */}
        <div className="space-y-6">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Duration (in days)
            </label>
            <input
              type="number"
              id="duration"
              value={durationDays}
              onChange={(e) => setDurationDays(Math.max(1, Math.min(730, Number(e.target.value))))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              min={1}
              max={730}
              required
            />
            <p className="mt-2 text-sm text-gray-500">Max duration is 2 years (730 days).</p>
          </div>
          <div>
            <label htmlFor="autoExtend" className="block text-sm font-medium text-gray-700">
              Auto-extend
            </label>
            <div className="mt-2 flex items-center">
              <input
                id="autoExtend"
                name="autoExtend"
                type="checkbox"
                checked={autoExtend}
                onChange={(e) => setAutoExtend(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="autoExtend" className="ml-2 block text-sm text-gray-900">
                Automatically extend by 180 days
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              If checked, relationship will auto-renew before expiration.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Roles */}
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Permissions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Select the Microsoft Entra roles to be included in this relationship.
        </p>
        <div className="mt-4">
          {defaultsLoaded && (
            <RoleSelector
              selectedRoleIds={selectedRoleIds}
              onSelectedRoleIdsChange={setSelectedRoleIds}
              userDefaultRoles={userDefaultRoles}
              onSaveDefaults={handleSaveDefaults}
              onResetDefaults={handleResetDefaults}
            />
          )}
        </div>
      </div>

      {/* Section 4: Submission */}
      <div className="pt-5 border-t border-gray-200">
        <div className="flex justify-end items-center">
          {submissionStatus && (
            <p
              className={`mr-4 text-sm ${
                submissionStatus.success ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {submissionStatus.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || nameStatus === NameStatus.UNAVAILABLE}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Creating...
              </>
            ) : (
              'Create GDAP Request'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default GDAPRequestForm;