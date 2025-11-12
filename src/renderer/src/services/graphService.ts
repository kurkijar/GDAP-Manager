import { GraphApiGDAPRequest, DelegatedAdminRelationship, DelegatedAdminAccessAssignment } from '../types';
import { graphEndpoints } from '../auth/authConfig';
import { DEFAULT_ROLE_IDS } from '../constants';

/**
 * Generic Graph fetch wrapper that:
 *  - Preserves Authorization when merging headers
 *  - Parses Graph error payloads and logs diagnostics
 */
export const callGraphApi = async (
  accessToken: string,
  endpoint: string,
  options?: RequestInit
): Promise<any> => {
  if (!accessToken) {
    throw new Error('Access token is empty.');
  }

  // Base headers
  const baseHeaders = new Headers({
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  });

  // Merge caller-provided headers WITHOUT losing Authorization
  let finalHeaders = baseHeaders;
  if (options?.headers) {
    const incoming = new Headers(options.headers as any);
    incoming.forEach((value, key) => {
      finalHeaders.set(key, value);
    });
  }

  const finalOptions: RequestInit = {
    method: options?.method || 'GET',
    ...options,
    headers: finalHeaders,
  };

  const response = await fetch(endpoint, finalOptions);

  if (!response.ok) {
    const requestId = response.headers.get('request-id') || response.headers.get('x-ms-request-id');
    const date = response.headers.get('Date');

    let message = `Request failed with status ${response.status}`;
    let errorDetails: any = null;
    try {
      const error = await response.json();
      message = error?.error?.message || message;
      errorDetails = error;
      console.error('Graph error details:', JSON.stringify(error, null, 2));
    } catch {
      try {
        const text = await response.text();
        if (text) {
          message = `${message}: ${text}`;
          console.error('Graph error text:', text);
        }
      } catch {
        // ignore
      }
    }

    if (requestId || date) {
      console.error(`Graph diagnostics: request-id=${requestId ?? 'n/a'}, date=${date ?? 'n/a'}`);
    }

    const customError: any = new Error(message);
    customError.details = errorDetails;
    throw customError;
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
};

/** OData-safe single-quote escaping */
function escapeODataString(value: string) {
  return value.replace(/'/g, "''");
}

/** Normalize durations to Graph-accepted day periods like "P180D" */
function normalizeDurationDaysOnly(input: string): string {
  if (!input) throw new Error('duration is required');
  // Already correct: P{n}D
  if (/^P\d+D$/i.test(input)) return input.toUpperCase();
  // Common "none" values → P0D
  if (/^PT0S$/i.test(input) || /^P0D$/i.test(input)) return 'P0D';
  // Coerce "180" or "180d" to P180D
  const m = input.match(/^(\d+)\s*d?$/i);
  if (m) return `P${m[1]}D`;
  throw new Error(`Invalid duration "${input}". Use an ISO-8601 days period like "P180D".`);
}

/** Small sleep helper for polling */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Accept BOTH possible shapes:
 *  A) Graph-shaped:
 *     {
 *       displayName: string;
 *       duration: string;                      // P{n}D
 *       customer: { tenantId: string };
 *       accessDetails: { unifiedRoles: { roleDefinitionId: string }[] };
 *       autoExtendDuration?: string;           // for PATCH later
 *     }
 *
 *  B) Flat:
 *     {
 *       displayName: string;
 *       duration: string;                      // P{n}D or number-like to coerce
 *       customerTenantId: string;
 *       roleDefinitionIds: string[];
 *       autoExtendDuration?: string;
 *     }
 */
function buildCreatePayload(req: GraphApiGDAPRequest): {
  displayName: string;
  duration: string;
  customer: { tenantId: string };
  accessDetails: { unifiedRoles: Array<{ roleDefinitionId: string }> };
} {
  const r: any = req as any;

  const displayName: string = r.displayName;
  if (!displayName) throw new Error('displayName is required');

  const duration: string = normalizeDurationDaysOnly(
    r.duration ?? r.relationshipDuration ?? r.validityPeriod
  );

  const customerTenantId: string =
    r.customer?.tenantId ??
    r.customerTenantId ??
    r.customerTenantID ??
    r.tenantId ??
    '';

  if (!customerTenantId) {
    throw new Error('customer tenant id is required (customer.tenantId or customerTenantId)');
  }

  // Determine roles
  let unifiedRoles: Array<{ roleDefinitionId: string }> = [];

  if (Array.isArray(r.accessDetails?.unifiedRoles)) {
    unifiedRoles = r.accessDetails.unifiedRoles
      .filter((u: any) => typeof u?.roleDefinitionId === 'string' && u.roleDefinitionId.length > 0)
      .map((u: any) => ({ roleDefinitionId: u.roleDefinitionId }));
  }

  if (unifiedRoles.length === 0 && Array.isArray(r.roleDefinitionIds)) {
    unifiedRoles = r.roleDefinitionIds
      .filter((id: any) => typeof id === 'string' && id.length > 0)
      .map((id: string) => ({ roleDefinitionId: id }));
  }

  if (unifiedRoles.length === 0 && Array.isArray(r.roleIds)) {
    unifiedRoles = r.roleIds
      .filter((id: any) => typeof id === 'string' && id.length > 0)
      .map((id: string) => ({ roleDefinitionId: id }));
  }

  // ✅ Fallback to default roles if none provided
  if (unifiedRoles.length === 0) {
    unifiedRoles = DEFAULT_ROLE_IDS.map((id) => ({ roleDefinitionId: id }));
  }

  return {
    displayName,
    duration,
    customer: { tenantId: customerTenantId },
    accessDetails: { unifiedRoles },
  };
}

/**
 * Check if a GDAP relationship name is available.
 * True => available; False => taken (or on error, fail-safe to False).
 */
export const checkNameAvailability = async (
  name: string,
  accessToken: string
): Promise<boolean> => {
  try {
    const filter = `displayName eq '${escapeODataString(name)}'`;
    const endpoint =
      `${graphEndpoints.graphApi}` +
      `?$filter=${encodeURIComponent(filter)}` +
      `&$count=true&$top=1`;

    // Needed for $count=true
    const headers = new Headers({ 'ConsistencyLevel': 'eventual' });

    const response = await callGraphApi(accessToken, endpoint, { headers });

    return !!response && response['@odata.count'] === 0;
  } catch (error) {
    console.error('Error checking name availability:', error);
    return false;
  }
};

/** Get @odata.etag for a relationship */
async function getRelationshipEtag(accessToken: string, relationshipId: string): Promise<string | undefined> {
  const url = `${graphEndpoints.graphApi}/${relationshipId}`;
  const entity = await callGraphApi(accessToken, url);
  return entity?.['@odata.etag'] as string | undefined;
}

/** POST action request to lock the relationship for approval */
async function lockGdapForApproval(accessToken: string, relationshipId: string, notes?: string): Promise<void> {
  const url = `${graphEndpoints.graphApi}/${relationshipId}/requests`;
  const body = { action: 'lockForApproval', ...(notes ? { notes } : {}) };

  await callGraphApi(accessToken, url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Poll until relationship status equals a target value (e.g., "approvalPending") */
async function waitForStatus(
  accessToken: string,
  relationshipId: string,
  targetStatuses: string[] = ['approvalPending'],
  { timeoutMs = 120_000, intervalMs = 3_000 } = {}
): Promise<{ status?: string }> {
  const start = Date.now();
  const url = `${graphEndpoints.graphApi}/${relationshipId}?$select=status`;

  while (Date.now() - start < timeoutMs) {
    const entity = await callGraphApi(accessToken, url);
    const status: string | undefined = entity?.status;

    if (status && targetStatuses.includes(status)) {
      return { status };
    }
    await delay(intervalMs);
  }
  return { status: undefined };
}

/**
 * Create a GDAP relationship, optionally set autoExtendDuration, then lock for approval.
 * NOTE: This implementation DOES NOT return invitationUrl. It only returns once
 * the relationship reaches "approvalPending" (or times out if it doesn't within the window).
 */
export const createGDAPRequest = async (
  request: GraphApiGDAPRequest,
  accessToken: string
): Promise<{ success: boolean; message: string; data?: any; status?: string }> => {
  try {
    // Map to Graph's POST payload regardless of incoming shape
    const payload = buildCreatePayload(request);

    // 1) POST create (ask Graph to return the entity so we get @odata.etag if available)
    const createHeaders = new Headers({ Prefer: 'return=representation' });

    const created = await callGraphApi(accessToken, graphEndpoints.graphApi, {
      method: 'POST',
      headers: createHeaders,
      body: JSON.stringify(payload),
    });

    // Ensure we have an id; otherwise fallback to find-by-name
    let relationship = created;
    if (!relationship?.id) {
      const filter = `displayName eq '${escapeODataString(payload.displayName)}'`;
      const endpoint = `${graphEndpoints.graphApi}?$filter=${encodeURIComponent(filter)}&$top=1`;
      const fetched = await callGraphApi(accessToken, endpoint);
      relationship = fetched?.value?.[0];
      if (!relationship?.id) {
        throw new Error('Created relationship did not return an id and could not be resolved.');
      }
    }

    // 2) Optionally PATCH autoExtendDuration if provided (and not "none")
    const r: any = request as any;
    const auto = r.autoExtendDuration;
    if (auto && auto !== 'PT0S' && auto !== 'P0D') {
      const normalizedAuto = normalizeDurationDaysOnly(auto);
      const updateEndpoint = `${graphEndpoints.graphApi}/${relationship.id}`;

      // Get ETag (from create or fresh)
      let etag: string | undefined = relationship?.['@odata.etag'];
      if (!etag) {
        etag = await getRelationshipEtag(accessToken, relationship.id);
      }

      // PATCH with optimistic concurrency
      const patchHeaders = new Headers({
        'If-Match': etag ?? '*',
        'Prefer': 'return=representation',
      });

      await callGraphApi(accessToken, updateEndpoint, {
        method: 'PATCH',
        headers: patchHeaders,
        body: JSON.stringify({ autoExtendDuration: normalizedAuto }),
      });

      // Refresh relationship after PATCH
      relationship = await callGraphApi(accessToken, updateEndpoint);
    }

    // 3) Lock for approval to make the request visible in customer's admin portal
    await lockGdapForApproval(accessToken, relationship.id, 'Finalize GDAP draft');

    // 4) Poll until the relationship is in "approvalPending" (customer can now approve)
    const { status } = await waitForStatus(accessToken, relationship.id, ['approvalPending']);

    // Fetch latest entity for return payload (optional but nice for UI)
    const latest = await callGraphApi(accessToken, `${graphEndpoints.graphApi}/${relationship.id}`);

    if (status === 'approvalPending') {
      return {
        success: true,
        message: `GDAP "${payload.displayName}" has been submitted and is now awaiting customer approval in their admin portal.`,
        data: latest ?? relationship,
        status,
      };
    }

    // If we timed out waiting, still succeed but inform the user to check later / refresh
    return {
      success: true,
      message: `GDAP "${payload.displayName}" finalized (locked for approval). The request is being prepared; please refresh shortly to see "approvalPending".`,
      data: latest ?? relationship,
      status: latest?.status,
    };
  } catch (error: any) {
    console.error('Error creating GDAP request:', error);

    // Check for the specific innerError code from the detailed error object
    const innerErrorCode = error?.details?.error?.innerError?.code;
    if (innerErrorCode === 'autoExtendOfRelationshipWithGlobalAdmin') {
      return { 
        success: false, 
        message: 'Creation failed: The "Global Administrator" role cannot be used with auto-extend. Please disable auto-extend or remove this role from the selection.' 
      };
    }
    
    return { success: false, message: error?.message || 'An unknown error occurred.' };
  }
};

/**
 * Fetches all delegated admin relationships.
 */
export const getGDAPRelationships = async (accessToken: string): Promise<DelegatedAdminRelationship[]> => {
    const response = await callGraphApi(accessToken, graphEndpoints.graphApi);
    return response.value || [];
};


/**
 * Fetches active access assignments for a specific delegated admin relationship.
 */
export const getGDAPRelationshipAccessAssignments = async (relationshipId: string, accessToken: string): Promise<DelegatedAdminAccessAssignment[]> => {
    const endpoint = `${graphEndpoints.graphApi}/${relationshipId}/accessAssignments`;
    
    const response = await callGraphApi(accessToken, endpoint);
    const assignments = response.value || [];

    // Client-side filtering to avoid showing deleted or deleting items.
    // This is more robust as the API's $filter on 'status' was causing 500 server errors.
    return assignments.filter(
        (assignment: DelegatedAdminAccessAssignment) => 
            assignment.status !== 'deleted' && assignment.status !== 'deleting'
    );
};

/**
 * Fetches assignments and enriches them with security group display names using a batch request.
 */
export const getGDAPAssignmentsWithGroupDisplayNames = async (
    relationshipId: string,
    accessToken: string
): Promise<DelegatedAdminAccessAssignment[]> => {
    const assignments = await getGDAPRelationshipAccessAssignments(relationshipId, accessToken);
    if (!assignments || assignments.length === 0) {
        return [];
    }

    const groupIds = [...new Set(assignments.map(a => a.accessContainer.accessContainerId))];

    const batchRequest = {
        requests: groupIds.map((id, index) => ({
            id: `${index + 1}`,
            method: 'GET',
            url: `/groups/${id}?$select=id,displayName`,
        })),
    };

    const batchEndpoint = 'https://graph.microsoft.com/v1.0/$batch';
    const batchResponse = await callGraphApi(accessToken, batchEndpoint, {
        method: 'POST',
        body: JSON.stringify(batchRequest),
    });
    
    const groupNameMap = new Map<string, string>();
    if (batchResponse && batchResponse.responses) {
        for (const response of batchResponse.responses) {
            if (response.status === 200 && response.body?.id && response.body?.displayName) {
                groupNameMap.set(response.body.id, response.body.displayName);
            }
        }
    }

    return assignments.map(assignment => ({
        ...assignment,
        accessContainer: {
            ...assignment.accessContainer,
            displayName: groupNameMap.get(assignment.accessContainer.accessContainerId) || 'Name not found',
        },
    }));
};

/**
 * Creates a new access assignment for a delegated admin relationship.
 */
export const createGDAPAccessAssignment = async (
  relationshipId: string,
  securityGroupId: string,
  roleIds: string[],
  accessToken: string
) => {
  const endpoint = `${graphEndpoints.graphApi}/${relationshipId}/accessAssignments`;

  // Minimal, spec-compliant body – no @odata.type
  const payload = {
    accessContainer: {
      accessContainerId: securityGroupId,
      accessContainerType: 'securityGroup',
    },
    accessDetails: {
      unifiedRoles: roleIds.map((id) => ({ roleDefinitionId: id })),
    },
  };

  return await callGraphApi(accessToken, endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Updates an existing access assignment for a delegated admin relationship.
 */
export const updateGDAPAccessAssignment = async (
    relationshipId: string,
    assignmentId: string,
    roleIds: string[],
    etag: string,
    accessToken: string
): Promise<DelegatedAdminAccessAssignment> => {
    const endpoint = `${graphEndpoints.graphApi}/${relationshipId}/accessAssignments/${assignmentId}`;
    const payload = {
        accessDetails: {
            unifiedRoles: roleIds.map(id => ({ roleDefinitionId: id })),
        },
    };
    
    const headers = new Headers({
        'If-Match': etag,
    });

    // Note: Graph API for this endpoint doesn't return the updated object on PATCH.
    // A 204 No Content is a success.
    await callGraphApi(accessToken, endpoint, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(payload),
    });

    // To provide feedback, we can fetch the updated assignment.
    const updatedAssignment = await callGraphApi(accessToken, endpoint);
    return updatedAssignment;
};

/**
 * Deletes an access assignment from a delegated admin relationship.
 */
export const deleteGDAPAccessAssignment = async (
    relationshipId: string,
    assignmentId: string,
    etag: string,
    accessToken: string
): Promise<void> => {
    const endpoint = `${graphEndpoints.graphApi}/${relationshipId}/accessAssignments/${assignmentId}`;
    const headers = new Headers({
        'If-Match': etag,
    });
    await callGraphApi(accessToken, endpoint, {
        method: 'DELETE',
        headers: headers,
    });
};