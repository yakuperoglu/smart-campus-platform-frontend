import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function DashboardLayout({ children, user, onLogout }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar
                user={user}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                onLogout={onLogout}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-64'}`}>
                <TopNavbar
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    user={user}
                    onLogout={onLogout}
                />

                <main className="flex-1 mt-16 p-6 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
