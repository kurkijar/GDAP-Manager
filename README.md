# GDAP Manager (Electron-Vite Version)

This is a desktop application built with Electron, React, and Vite to create Microsoft 365 Partner Center GDAP requests and to manage role assigments to the relationships.
This app runs with delegated user permissions and needs that the user has Admin Agent-role set in Partner portal. This is not Entra admin role, it can only be found in Partner portal roles.

PLEASE NOTE: This app is only tested on Windows, but should run and build package on Mac and Linux too, but Mac and Linux has not been tested!

## IMPORTANT: Azure App Registration Setup

Before you can run this application, you **MUST** configure your Azure AD App Registration correctly.

### 1. Configure Platform

1.  Navigate to the [Entra portal] (https://entra.microsoft.com/) and select App Registration under Entra ID.
2.  Click new registration.
3.  Give it a name and choose who can use the application, usually it's single tenant only.
4.  Select *Redirect URI* and choose **"Public client/native (mobile & desktop)"**, add http://localhost, click register.
5.  Take note of Application (client) ID and Directory (tenant) ID.
6.  Click Authentication and under Advanced Settings, *Allow public client flows* set *Enable the following mobile and desktop flows* to yes.

### 2. Configure API Permissions

This is a critical step. The application needs permission to read and create GDAP relationships and manage their assignments.

1.  In your App Registration, go to the **API permissions** blade.
2.  Click **"Add a permission"**.
3.  Select **"Microsoft Graph"**.
4.  Select **"Delegated permissions"**.
5.  In the search box, type `DelegatedAdminRelationship` and select **`DelegatedAdminRelationship.ReadWrite.All`**.
6.  Search for and select **`Group.Read.All`**. This is required for managing security group assignments to GDAP relationships.
7.  Click **"Add permissions"**.
8.  After adding the permissions, you must grant consent. Click the **"Grant admin consent for [Your Tenant Name]"** button and accept the prompt. The status for the permissions should change to "Granted".

### 3. Add App IDs to Code

1.  Open `src/main/index.ts` in your code editor and add Application (client) ID into the `AAD_APP_CLIENT_ID` and Directory (tenant) ID `AAD_APP_TENANT_ID` constants (Rows 28 and 29).

### 4. Add group IDs to Code

1. Create three different security groups in entra or admin portal for templates, ie. basic, advanced, expert. You can name them in any way you like. Take note of their groupId.
2. Open `src/renderer/src/constants.ts and find row 99.
3. Change the name in this row to the same your created security group for basic roles: ie.    name: 'Production Basic',
4. Change the groupid to the one you created for basic roles: ie. groupId: 'f7c2d8a1-4b3e-4e9a-9d6f-2a8f4b7c1e35',
5. Repeat steps 3. and 4. to advanced and expert groups in rows 108-109 and 126-127.
6. The templates are called in the app with their tag, basic, advanced and expert that are in rows 98, 107 and 125. Do not change these unless you also change them in src/renderer/src/components/AssignmentEditor.tsx.

## How to Run the Application

### Prerequisites

You need to have [Node.js](https://nodejs.org/) installed on your computer.

### Step 1: Install Dependencies

Open your terminal or command prompt, navigate to the project's root directory (where `package.json` is located), and run:

```bash
npm install
```

This will download Electron and all other necessary packages, that are listed below with their version number (same as in package.json)

**azure/msal-node": "3.8.1"** - Basic MSAL authentication library

**azure/msal-node-extensions": "1.5.24"** - Advanced MSAL authentication library, used for encrypting the token. DPAPI on Windows, Keychain on macOS, and libsecret on Linux.

**electron-toolkit/utils": "4.0.0"** - Electron-app packaging.

**types/react": "18.3.3"** - The main library for building user interface.

**types/react-dom": "18.3.0"** - The "renderer" for React. It's the bridge that connects React components to the actual browser environment.

### Step 2: Run in Development Mode

To start the application for development with hot-reloading, run:

```bash
npm run dev
```

This command will launch the Electron application window. The developer tools will open automatically.

### Step 3: Build the Executable

To package the application into a runnable `.exe` installer for Windows, run:

```bash
npm run package:win
```

This command will create an `release` folder in your project directory containing the installer (`GDAP Request Creator Setup X.X.X.exe`) and portable .exe to subfolder win-unpacked. You can distribute these files to other users.
Portable .exe needs the whole contents of win-unpacked to run.

For MacOS, the command is:
**npm run package:mac**
and for linux:
**npm run package:linux**

Please note, you need to run these on their corresponding OS. ie. only build Win version on Win computer, Linux on Linux and MacOS on MacOS.
