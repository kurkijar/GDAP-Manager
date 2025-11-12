import React, { useState, useEffect } from 'react';

const SignInButton: React.FC = () => {
    const handleLogin = () => {
        window.electronAPI.login().catch((e: Error) => console.error(e));
    };
    return (
        <button
            onClick={handleLogin}
            className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
        >
            Sign In with Microsoft
        </button>
    );
};

const SignOutButton: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => {
    const handleLogout = () => {
        window.electronAPI.logout().then(onSignOut).catch((e: Error) => console.error(e));
    };
    return (
        <button
            onClick={handleLogout}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
            Sign Out
        </button>
    );
};

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [account, setAccount] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        // On component mount, check if there's an active account
        const checkAccount = async () => {
            try {
                const currentAccount = await window.electronAPI.getAccount();
                setAccount(currentAccount);
            } catch (error) {
                console.error("Error getting account:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAccount();

        // Re-check when login or logout happens (e.g., window focus)
        // This is a simple way to sync state after the MSAL interactive flow
        const handleFocus = () => checkAccount();
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const handleSignOut = () => {
        setAccount(null);
    };

    if (isLoading) {
        return (
             <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        )
    }

    const isAuthenticated = !!account;
    const name = account?.name; // Now correctly uses the `name` property

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center justify-center p-4">
            {isAuthenticated && (
                <header className="w-full max-w-4xl flex justify-end items-center pb-4">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">{name}</p>
                        <SignOutButton onSignOut={handleSignOut} />
                    </div>
                </header>
            )}

            {isAuthenticated ? children : (
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to GDAP Creator</h1>
                    <p className="text-gray-600 mb-8">Please sign in to continue.</p>
                    <SignInButton />
                </div>
            )}
        </div>
    );
};

export default AuthLayout;
