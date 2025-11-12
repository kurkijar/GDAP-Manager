// This file provides TypeScript types for the API exposed by the preload script.
// It is referenced in tsconfig.json to make these types globally available
// in your React components.

declare global {
    interface Window {
        electronAPI: {
            login: () => Promise<any>;
            logout: () => Promise<void>;
            getToken: () => Promise<{ accessToken: string } | null>;
            // FIX: Aligned the type with the other preload.d.ts to resolve conflicting global types.
            getAccount: () => Promise<{ name: string; tenantId: string; } | null>;
            loadDefaultRoles: () => Promise<string[] | null>;
            saveDefaultRoles: (roleIds: string[]) => Promise<{ success: boolean; error?: string }>;
            resetDefaultRoles: () => Promise<{ success: boolean; error?: string }>;
        }
    }
}

// Adding this empty export statement turns this file into a module, which is required
// for declaring globals in a way that TypeScript understands across the project.
export {};
