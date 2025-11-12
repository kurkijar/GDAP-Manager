import React, { useState } from 'react';
import GDAPRequestForm from '@/components/GDAPRequestForm';
import AuthLayout from '@/components/AuthLayout';
import ManageAssignments from '@/components/ManageAssignments';

type View = 'create' | 'manage';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('create');

    const renderView = () => {
        switch (activeView) {
            case 'manage':
                return <ManageAssignments />;
            case 'create':
            default:
                return <GDAPRequestForm />;
        }
    };
    
    const getHeader = () => {
        switch (activeView) {
            case 'manage':
                return {
                    title: 'Manage GDAP Assignments',
                    subtitle: 'View existing relationships and assign security groups to roles.'
                };
            case 'create':
            default:
                return {
                    title: 'GDAP Request Creator',
                    subtitle: 'Create a new Granular Delegated Admin Privileges request for a customer.'
                };
        }
    };
    
    const headerContent = getHeader();

    return (
        <AuthLayout>
            <div className="w-full max-w-6xl">
                <header className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{headerContent.title}</h1>
                    <p className="text-md text-gray-600 mt-2">{headerContent.subtitle}</p>
                </header>
                
                <nav className="mb-8 flex justify-center border-b border-gray-200">
                    <button
                        onClick={() => setActiveView('create')}
                        className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 ${activeView === 'create' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Create Request
                    </button>
                    <button
                        onClick={() => setActiveView('manage')}
                        className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 ${activeView === 'manage' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Manage Assignments
                    </button>
                </nav>

                <main>
                    {renderView()}
                </main>
                 <footer className="text-center mt-8 text-sm text-gray-500">
                    <p>Powered by Microsoft Graph API</p>
                </footer>
            </div>
        </AuthLayout>
    );
};

export default App;