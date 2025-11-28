import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContex';
import { useNavigate } from 'react-router';
import { initSocket, getSocket } from '../socket';

const Notifications = () => {
    const { user } = useAuth();
    const { backendUrl } = useShop();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/api/user/notifications`, { withCredentials: true });
            if (res.data?.success) {
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Failed to load notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [user]);

    // Listen for incoming realtime notifications and prepend to list
    useEffect(() => {
        if (!backendUrl) return;
        if (!user) return;
        const s = initSocket(backendUrl, user._id);

        const onNotification = (payload) => {
            try {
                setNotifications(prev => [payload, ...(prev || [])]);
                setUnreadCount(prev => (typeof prev === 'number' ? prev + 1 : 1));
            } catch (e) {
                console.error('Notification handler error', e);
            }
        };

        const onNotificationsUpdated = (payload) => {
            try {
                if (!payload) return;
                if (typeof payload.unreadCount === 'number') setUnreadCount(payload.unreadCount);
                if (Array.isArray(payload.notifications)) setNotifications(payload.notifications);
            } catch (e) { console.error('notificationsUpdated handler error', e); }
        };

        if (s) s.on('notification', onNotification);
        if (s) s.on('notificationsUpdated', onNotificationsUpdated);

        return () => {
            try { if (s) s.off('notification', onNotification); } catch (e) { }
            try { if (s) s.off('notificationsUpdated', onNotificationsUpdated); } catch (e) { }
        };
    }, [user, backendUrl]);

    const markReadAndOpen = async (n) => {
        try {
            await axios.post(`${backendUrl}/api/user/notifications/${n._id}/read`, {}, { withCredentials: true });
            navigate(`/product/${n.productId}`);
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const deleteOne = async (id) => {
        try {
            await axios.delete(`${backendUrl}/api/user/notifications/${id}`, { withCredentials: true });
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) { console.error(err); }
    };

    // Clear read removed per request

    const clearAll = async () => {
        try {
            await axios.delete(`${backendUrl}/api/user/notifications`, { withCredentials: true });
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) { console.error(err); }
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        const t = new Date(ts).getTime();
        if (isNaN(t)) return '';
        const diff = Date.now() - t;
        const mins = Math.floor(diff / (1000 * 60));
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    if (!user) return (
        <div className='max-w-4xl mx-auto py-10 text-center'>
            <p className='text-lg'>Please sign in to view notifications.</p>
        </div>
    );

    return (
        <div className='w-full mx-0 py-8 px-4'>
            <div className='flex items-center justify-between mb-6'>
                <h2 className='text-2xl font-semibold'>Notifications</h2>
                <div className='flex gap-3 items-center'>
                    <span className='text-sm text-gray-600'>{unreadCount} unread</span>
                    <button onClick={clearAll} className='text-sm text-gray-600 px-3 py-1 rounded hover:bg-gray-100'>Clear all</button>
                </div>
            </div>

            <div className='space-y-3 w-full'>
                {loading && (<div className='p-6 text-center'>Loading...</div>)}
                {!loading && notifications.length === 0 && (
                    <div className='p-6 text-center text-gray-600 border rounded-lg'>No notifications</div>
                )}
                {!loading && notifications.map(n => (
                    <div key={n._id} className={`flex items-start gap-4 p-4 rounded-lg shadow-sm transition hover:shadow-md w-full ${n.read ? 'bg-white' : 'bg-[#fffaf0]'}`}>
                        {n.product?.thumbnail ? (
                            <img src={n.product.thumbnail} alt={n.product?.name} className='w-24 h-24 object-cover rounded-md border' />
                        ) : (
                            <div className='w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500 border'>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="#e2e8f0" strokeWidth="1.5" fill="#f8fafc"/>
                                    <path d="M7 14l2.5-3 2 2.5L15 9l4 6H7z" fill="#cbd5e1" />
                                </svg>
                            </div>
                        )}
                        <div className='flex-1 min-w-0'>
                            <div className='flex items-start justify-between gap-3'>
                                <div className='min-w-0'>
                                    <div className='font-semibold text-gray-800 truncate'>{n.product?.name || n.message}</div>
                                    <div className='text-sm text-gray-600 mt-1 line-clamp-2'>{n.message}</div>
                                </div>
                                <div className='text-xs text-gray-400'>{formatTime(n.createdAt)}</div>
                            </div>
                            <div className='mt-4 flex gap-2'>
                                <button onClick={() => markReadAndOpen(n)} className='text-sm px-4 py-2 bg-[#FFB81C] rounded-md text-black font-medium shadow-sm hover:opacity-95'>Open</button>
                                <button onClick={() => deleteOne(n._id)} className='text-sm px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50'>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notifications;
