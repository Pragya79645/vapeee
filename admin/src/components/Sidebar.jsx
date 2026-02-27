import React from "react";
import { NavLink } from "react-router";
import { assets } from "../assets/admin_assets/assets";
import { useSync } from '../context/SyncContext';

const Sidebar = () => {
    const { syncStatus, syncMessage, runSyncFromClover } = useSync();

    const items = [
        { to: '/add', icon: assets.add_icon, label: 'Add Items' },
        { to: '/list', icon: assets.order_icon, label: 'List Items' },
        { to: '/settings', icon: assets.add_icon, label: 'Settings' },
        { to: '/orders', icon: assets.order_icon, label: 'Orders' },
        { to: '/categories', icon: assets.order_icon, label: 'Categories' },
        { to: '/variants', icon: assets.order_icon, label: 'Variants' },
        { to: '/discount-codes', icon: assets.add_icon, label: 'Discount Codes' },
        { to: '/logs', icon: assets.order_icon, label: 'Activity Logs' },
    ];

    return (
        <aside className="w-64 min-h-screen admin-sidebar p-4">
            <div className="flex items-center gap-3 mb-6">
                <img src={assets.add_icon} alt="logo" className="w-8 h-8" />
                <div>
                    <h2 className="text-lg font-bold text-[#FFB81C]">Admin</h2>
                    <p className="text-xs text-gray-500">Dashboard</p>
                </div>
            </div>

            <div className="mb-4 px-2">
                <button
                    onClick={runSyncFromClover}
                    disabled={syncStatus === 'working'}
                    className="w-full flex items-center justify-center gap-2 bg-[#FFB81C] text-white py-2 rounded-md text-sm hover:opacity-95 disabled:opacity-60 mb-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>{syncStatus === 'working' ? 'Syncing...' : 'Sync from Clover'}</span>
                </button>
                <div className="text-xs text-center mt-2">
                    {syncStatus === 'working' && <span className="text-blue-600 font-medium animate-pulse">{syncMessage || 'Pulling data from Clover...'}</span>}
                    {syncStatus === 'success' && <span className="text-green-600">Sync complete ✓</span>}
                    {syncStatus === 'error' && <span className="text-red-600">Sync failed — <a href="/logs" className="underline hover:text-red-800">Check Logs</a></span>}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                    Clover is the source of truth. Changes to products are auto-synced when saved.
                </p>
            </div>

            <nav className="flex flex-col gap-2">
                {items.map(({ to, icon, label }) => (
                    <NavLink key={to} to={to} className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-[#FFB81C]/10 border-l-4 border-[#FFB81C] text-[#111827]' : 'text-gray-700 hover:bg-gray-50'}`
                    }>
                        <img src={icon} alt={label} className="w-5 h-5" />
                        <span className="hidden md:inline">{label}</span>
                    </NavLink>
                ))}

                <hr className="my-2 border-gray-200" />

                {/* How To Use Link */}
                <NavLink to="/how-to-use" className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-800' : 'text-blue-600 hover:bg-blue-50'}`
                }>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span className="hidden md:inline font-medium">How To Use</span>
                </NavLink>
            </nav>

            <div className="mt-auto pt-6">
                <div className="text-xs text-gray-500">Logged in as</div>
                <div className="text-sm font-medium mt-1">Admin User</div>
            </div>
        </aside>
    );
};

export default Sidebar;