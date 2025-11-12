import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
// FIX: Add imports for Node.js functionality in an ES module context.
import { fileURLToPath } from 'url';
import { platform } from 'process';
import {
  PublicClientApplication,
  LogLevel,
  Configuration,
  AuthenticationResult,
  AccountInfo,
} from '@azure/msal-node';
import { is } from '@electron-toolkit/utils';
// FIX: Added DataProtectionScope for explicit configuration.
import {
  PersistenceCachePlugin,
  PersistenceCreator,
  DataProtectionScope,
} from '@azure/msal-node-extensions';

// FIX: Define __dirname for an ES module context.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =========================================================
//  Azure AD App Configuration (replace placeholders)
// =========================================================
const AAD_APP_CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; // Change this!
const AAD_APP_TENANT_ID = 'YOUR_TENANT_ID_HERE'; // Change this!

// =========================================================
let mainWindow: BrowserWindow | null = null;
// Note: keep it possibly undefined, and gate access via getMsal()
let pca: PublicClientApplication | undefined;

// Include OIDC scopes for robust silent refresh + your Graph scopes
const scopes = [
  'openid',
  'profile',
  'offline_access',
  'User.Read',
  'DelegatedAdminRelationship.ReadWrite.All',
  'Group.Read.All', // For managing security group assignments
];

// =========================================================
//  Window
// =========================================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, // Increased width for the new layout
    height: 800, // Increased height for the new layout
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show();
  });

  // HMR for renderer base on electron-vite cli renderer builds
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Open DevTools only in development
  if (is.dev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// =========================================================
//  MSAL Setup
// =========================================================
function validateConfig() {
  if (!AAD_APP_CLIENT_ID || AAD_APP_CLIENT_ID.includes('YOUR_CLIENT_ID_HERE')) {
    throw new Error('MSAL config error: Set AAD_APP_CLIENT_ID in src/main/index.ts');
  }
  if (!AAD_APP_TENANT_ID || AAD_APP_TENANT_ID.includes('YOUR_TENANT_ID_HERE')) {
    throw new Error('MSAL config error: Set AAD_APP_TENANT_ID in src/main/index.ts');
  }
}

/** Return a non-null PCA or throw if not initialized yet */
function getMsal(): PublicClientApplication {
  if (!pca) {
    throw new Error('MSAL not initialized yet. Try again in a moment.');
  }
  return pca;
}

async function setupMsal() {
  validateConfig();

  const cachePath = path.join(app.getPath('userData'), 'msal.cache');

  const persistence = await PersistenceCreator.createPersistence({
    cachePath,
    // FIX: Explicitly set the scope for Windows DPAPI for robust cross-platform support.
    dataProtectionScope: DataProtectionScope.CurrentUser,
    // These are used by Keychain on macOS and libsecret on Linux for secure storage
    serviceName: 'com.netox.gdapcreator',
    accountName: 'msal-cache',
  });

  const cachePlugin = new PersistenceCachePlugin(persistence);

  const msalConfig: Configuration = {
    auth: {
      clientId: AAD_APP_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${AAD_APP_TENANT_ID}`,
    },
    cache: {
      cachePlugin,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
          if (!containsPii) console.log(`MSAL: ${message}`);
        },
        piiLoggingEnabled: false,
        logLevel: LogLevel.Info,
      },
    },
  };

  pca = new PublicClientApplication(msalConfig);
}

// Helper: pick the first account (customize to show UI if you support multiple)
async function getFirstAccount(msal: PublicClientApplication): Promise<AccountInfo | null> {
  const accounts = await msal.getTokenCache().getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

// =========================================================
//  App Lifecycle
// =========================================================
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      await setupMsal();
      createWindow();
        } catch (error: any) {
          console.error('Application startup failed:', error.message);
          dialog.showErrorBox(
          'Configuration Error',
          `${error.message}\n\nPlease add your App IDs to src/main/index.ts and restart the application.`
        );
        app.quit();
        }
 });
}

app.on('window-all-closed', () => {
  // FIX: Use imported `platform` instead of `process.platform` to satisfy TypeScript.
  if (platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// =========================================================
//  IPC Authentication Handlers
// =========================================================
ipcMain.handle('login', async () => {
  try {
    const msal = getMsal();
    const result = await msal.acquireTokenInteractive({
      scopes,
      openBrowser: async (url: string) => {
        await shell.openExternal(url);
      },
    });
    return result;
  } catch (error: any) {
    if (error?.errorCode === 'authentication_canceled') {
      console.log('User canceled login.');
      return null;
    }
    console.error('Login failed:', error);
    dialog.showErrorBox('Login Error', error?.message || 'Login failed.');
    return null;
  }
});

ipcMain.handle('logout', async () => {
  try {
    const msal = getMsal();
    const accounts = await msal.getTokenCache().getAllAccounts();
    for (const acc of accounts) {
      await msal.getTokenCache().removeAccount(acc);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error?.message };
  }
});

ipcMain.handle('get-token', async (): Promise<{ accessToken: string } | null> => {
  try {
    const msal = getMsal();

    let account = await getFirstAccount(msal);
    if (!account) {
      // If not signed in, do an interactive login here to keep renderer simple
      const interactive = await msal.acquireTokenInteractive({
        scopes,
        openBrowser: async (url: string) => {
          await shell.openExternal(url);
        },
      });
      account = interactive.account ?? null;
      if (!account) {
        dialog.showErrorBox('Token Error', 'No account returned from interactive login.');
        return null;
      }
    }

    // Try silent first
    let authResult: AuthenticationResult | null = null;
    try {
      authResult = await msal.acquireTokenSilent({ account, scopes });
    } catch {
      console.log('Silent token acquisition failed, trying interactive.');
      authResult = await msal.acquireTokenInteractive({
        scopes,
        openBrowser: async (url: string) => {
          await shell.openExternal(url);
        },
      });
    }

    if (authResult?.accessToken) {
      return { accessToken: authResult.accessToken };
    }

    dialog.showErrorBox('Token Error', 'No access token was returned.');
    return null;
  } catch (err: any) {
    dialog.showErrorBox('Token Error', err?.message || 'Unable to acquire token.');
    return null;
  }
});

ipcMain.handle('get-account', async () => {
  try {
    const msal = getMsal();
    const acc = await getFirstAccount(msal);
    return acc
      ? {
          homeAccountId: acc.homeAccountId,
          username: acc.username,
          environment: acc.environment,
          tenantId: acc.tenantId,
          name: acc.name, // FIX: Pass the display name to the renderer
        }
      : null;
  } catch {
    return null;
  }
});

// =========================================================
//  IPC: User Default Roles
// =========================================================
const defaultsFilePath = path.join(app.getPath('userData'), 'user-default-roles.json');

ipcMain.handle('load-default-roles', async () => {
  try {
    if (fs.existsSync(defaultsFilePath)) {
      const data = fs.readFileSync(defaultsFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading default roles:', error);
  }
  return null;
});

ipcMain.handle('save-default-roles', async (_event, roleIds: string[]) => {
  try {
    fs.writeFileSync(defaultsFilePath, JSON.stringify(roleIds, null, 2));
    return { success: true };
  } catch (error: any) {
    console.error('Error saving default roles:', error);
    return { success: false, error: error?.message };
  }
});

ipcMain.handle('reset-default-roles', async () => {
  try {
    if (fs.existsSync(defaultsFilePath)) {
      fs.unlinkSync(defaultsFilePath);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error resetting default roles:', error);
    return { success: false, error: error?.message };
  }
});
