import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    LayoutDashboard,
    BookOpen,
    MapPin,
    Utensils,
    Calendar,
    CreditCard,
    Settings,
    LogOut,
    GraduationCap
} from 'lucide-react';

export default function Sidebar({ user, collapsed, setCollapsed, onLogout }) {
    const router = useRouter();

    const isActive = (path) => router.pathname === path;

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['all'] },
        { icon: BookOpen, label: 'Courses', href: '/courses', roles: ['all'] },
        { icon: MapPin, label: 'Attendance', href: '/attendance', roles: ['student'] },
        { icon: MapPin, label: 'Open Session', href: '/attendance-open', roles: ['faculty'] },
        { icon: Utensils, label: 'Meals', href: '/meals', roles: ['all'] },
        { icon: Calendar, label: 'Events', href: '/events', roles: ['all'] },
        { icon: BookOpen, label: 'Grades', href: '/grades', roles: ['student'] },
        { icon: CreditCard, label: 'Wallet', href: '/wallet', roles: ['all'] },
    ];

    const adminItems = [
        { icon: Settings, label: 'Admin Console', href: '/admin', roles: ['admin'] },
    ];

    const filterItems = (items) => {
        return items.filter(item =>
            item.roles.includes('all') || (user && item.roles.includes(user.role))
        );
    };

    return (
        <aside
            className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col fixed h-full z-30 shadow-xl`}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-center border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <GraduationCap className="h-8 w-8 text-blue-400" />
                    {!collapsed && (
                        <span className="font-bold text-lg tracking-tight whitespace-nowrap">
                            Smart Campus
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">

                {/* Main Menu */}
                {!collapsed && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Menu</p>}
                {filterItems(menuItems).map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${active
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                            {collapsed && active && (
                                <div className="absolute left-20 bg-slate-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}

                {/* Admin Menu */}
                {user?.role === 'admin' && (
                    <>
                        <div className="my-4 border-t border-slate-800"></div>
                        {!collapsed && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Admin</p>}
                        {adminItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive(item.href)
                                        ? 'bg-red-900/50 text-red-200'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                            </Link>
                        ))}
                    </>
                )}
            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-slate-800">
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user?.first_name ? user.first_name[0] : user?.email?.[0]?.toUpperCase()}
                    </div>

                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.first_name || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {user?.role?.toUpperCase()}
                            </p>
                        </div>
                    )}

                    {!collapsed && (
                        <button
                            onClick={onLogout}
                            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
