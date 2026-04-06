import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faBookOpen, faCog, faSignOutAlt, faHome, faCommentAlt, faFileAlt, faNewspaper, faImage, faBars, faUser, faShoppingBag, faBox, faTicketAlt, faCrown, faShieldAlt, faChartLine, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useTributeContext } from '../../context/TributeContext';

const LayoutAdmin = () => {
    const { settings } = useTributeContext();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const isActive = (path) => location.pathname === path;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.is_super_admin === true || user.role === 'superadmin';
    const isAdmin = user.role === 'admin' || isSuperAdmin || user.username === 'admin' || user.email?.includes('admin');
    const isSupport = user.role === 'support';

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    // hasPerm: true if user has legacy flat perm OR at least read (:r) for the section
    const hasPerm = (p) => isSuperAdmin || permissions.includes(p) || permissions.includes(`${p}:r`) || permissions.includes(`${p}:c`) || permissions.includes(`${p}:u`) || permissions.includes(`${p}:d`);
    // hasWritePerm: true if user can create or update
    const hasWritePerm = (p) => isSuperAdmin || permissions.includes(p) || permissions.includes(`${p}:c`) || permissions.includes(`${p}:u`);
    const hasDeletePerm = (p) => isSuperAdmin || permissions.includes(p) || permissions.includes(`${p}:d`);

    // nav item visibility flags:
    //   adminOnly  — hidden from regular users and support
    //   superOnly  — hidden from everyone except superadmin
    //   supportShow — visible to support (in addition to admins)
    //   supportReadOnly — support can see it but gets a read-only badge
    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: faTachometerAlt, section: 'Main', perm: 'dashboard', adminOnly: true, supportShow: true },
        { label: 'My Account', path: '/admin/my-account', icon: faChartLine, section: 'Main', alwaysShow: true },

        { label: 'Memorials', path: '/admin/memorials', icon: faBookOpen, section: 'Content', perm: 'memorials', alwaysShow: true },
        { label: 'Media Library', path: '/admin/media', icon: faImage, section: 'Content', perm: 'media', supportShow: true },
        { label: 'Pages', path: '/admin/pages', icon: faFileAlt, section: 'Content', perm: 'pages', supportShow: true, supportReadOnly: true },
        { label: 'Blogs', path: '/admin/posts', icon: faNewspaper, section: 'Content', perm: 'posts', supportShow: true, supportReadOnly: true },

        { label: 'Products', path: '/admin/products', icon: faShoppingBag, section: 'Shop', perm: 'products', supportShow: true, supportReadOnly: true },
        { label: 'Orders', path: '/admin/orders', icon: faBox, section: 'Shop', perm: 'orders', supportShow: true, supportReadOnly: true },
        { label: 'Voucher Templates', path: '/admin/voucher-templates', icon: faTicketAlt, section: 'Shop', perm: 'products', supportShow: true, supportReadOnly: true },
        { label: 'Subscriptions', path: '/admin/subscriptions', icon: faCrown, section: 'Shop', perm: 'subscriptions', supportShow: true, supportReadOnly: true },

        { label: 'Menus', path: '/admin/menus', icon: faBars, section: 'Design', perm: 'menus', supportShow: true, supportReadOnly: true },
        { label: 'Condolence Book', path: '/admin/condolences', icon: faCommentAlt, section: 'Design', perm: 'condolences', supportShow: true },

        { label: 'User Management', path: '/admin/users', icon: faShieldAlt, section: 'System', perm: 'users', adminOnly: true, supportShow: true },
        { label: 'Email Templates', path: '/admin/email-templates', icon: faEnvelope, section: 'System', perm: 'settings', superOnly: true },
        { label: 'Email Logs', path: '/admin/email-logs', icon: faFileAlt, section: 'System', perm: 'settings', superOnly: true },
        { label: 'System Settings', path: '/admin/settings', icon: faCog, section: 'System', perm: 'settings', superOnly: true },
    ];

    const sections = ['Main', 'Content', 'Shop', 'Design', 'System'];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <div className={`bg-[#1d2327] text-gray-300 w-64 flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-64 absolute z-50 h-full'}`}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-4 bg-[#2c3338] shadow-sm">
                    <Link to="/admin" className="text-white font-bold text-lg flex items-center gap-2">
                        {settings.logo ? (
                            <img src={settings.logo} alt="Logo" className="max-h-12 w-auto" />
                        ) : (
                            <>
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-dark text-sm font-serif font-bold">T</div>
                                <span>Tributoo {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : isSupport ? 'Support' : 'Portal'}</span>
                            </>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4">
                    {sections.map(section => {
                        const items = navItems.filter(i => {
                            if (i.section !== section) return false;
                            // superOnly items: only superadmin can see (not even support)
                            if (i.superOnly && !isSuperAdmin) return false;
                            // adminOnly items: admin + support can see (if support has the permission)
                            if (i.adminOnly && !isAdmin) return false;
                            if (i.alwaysShow) return true;
                            // Support: respect Quick Assign permissions (hasPerm) but only for supportShow items
                            if (isSupport) return i.supportShow && hasPerm(i.perm);
                            return hasPerm(i.perm);
                        });

                        if (items.length === 0) return null;

                        return (
                            <div key={section} className="mb-6">
                                <div className="px-3 mb-2 text-xs uppercase text-gray-500 font-semibold tracking-wider">{section}</div>
                                <ul className="space-y-1">
                                    {items.map(item => (
                                        <li key={item.path}>
                                            <Link
                                                to={item.path}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive(item.path) ? 'bg-primary text-white' : 'hover:bg-[#2c3338] hover:text-white'}`}
                                            >
                                                <div className="w-5 flex justify-center">
                                                    <FontAwesomeIcon icon={item.icon} className="text-sm" />
                                                </div>
                                                <span className="text-sm flex-1">{item.label}</span>
                                                {isSupport && item.supportReadOnly && (
                                                    <span className="text-[8px] font-bold uppercase tracking-wide bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded">read</span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}

                    <div className="px-3 mt-6 mb-2 text-xs uppercase text-gray-500 font-semibold tracking-wider">Account</div>
                    <ul className="space-y-1">
                        <li>
                            <Link to="/admin/subscription" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/subscription') ? 'bg-primary text-white' : 'hover:bg-[#2c3338] hover:text-white'}`}>
                                <FontAwesomeIcon icon={faCrown} className="w-4" />
                                <span>Subscription</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/account" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/account') ? 'bg-primary text-white' : 'hover:bg-[#2c3338] hover:text-white'}`}>
                                <FontAwesomeIcon icon={faUser} className="w-4" />
                                <span>My Settings</span>
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Footer User */}
                <div className="p-4 bg-[#2c3338] border-t border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold uppercase">
                            {user.username ? user.username.charAt(0) : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.username || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email || ''}</p>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                window.location.href = '/login';
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Sign Out"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Header */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-dark md:hidden">
                            <span className="sr-only">Toggle Sidebar</span>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <h1 className="text-lg font-semibold text-gray-800">
                            {location.pathname === '/admin' && 'Dashboard'}
                            {location.pathname === '/admin/my-account' && 'Memorial Analytics'}
                            {location.pathname === '/admin/memorials' && 'Manage Memorials'}
                            {location.pathname === '/admin/memorials/new' && 'Add New Memorial'}
                            {location.pathname === '/admin/media' && 'Media Library'}
                            {location.pathname === '/admin/menus' && 'Menüs'}
                            {location.pathname.startsWith('/admin/products') && 'E-Commerce / Products'}
                            {location.pathname.startsWith('/admin/settings') && 'Settings'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-sm text-gray-600 hover:text-primary flex items-center gap-2">
                            <FontAwesomeIcon icon={faHome} /> Visit Site
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-gray-100 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default LayoutAdmin;
