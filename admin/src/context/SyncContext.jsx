import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { initSocket } from '../socket';

const SyncContext = createContext();

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
    const [syncStatus, setSyncStatus] = useState('idle'); // idle | working | success | error
    const [lastReport, setLastReport] = useState(null);
    const [syncMessage, setSyncMessage] = useState('');

    useEffect(() => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (!backendUrl) return;

        const socket = initSocket(backendUrl);
        if (!socket) return;

        const onProgress = (data) => {
            if (data && data.message) setSyncMessage(data.message);
        };

        socket.on('syncProgress', onProgress);
        return () => {
            try { socket.off('syncProgress', onProgress); } catch (e) { }
        };
    }, []);

    // Single sync function — pull from Clover (the source of truth)
    const runSyncFromClover = useCallback(async () => {
        try {
            setSyncStatus('working');
            setSyncMessage('Starting sync process...');
            const base = import.meta.env.VITE_BACKEND_URL || '';
            const url = `${base.replace(/\/$/, '')}/api/admin/sync/clover`;
            const token = localStorage.getItem('admin_token');
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ mode: 'pull' })
            });
            if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
            const json = await res.json();
            console.log('Clover sync result', json);
            setLastReport(json.report || null);
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 4000);
            return json;
        } catch (err) {
            console.error('Sync error', err);
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 5000);
            throw err;
        }
    }, []);

    return (
        <SyncContext.Provider value={{ syncStatus, lastReport, syncMessage, runSyncFromClover }}>
            {children}
        </SyncContext.Provider>
    );
};

export default SyncContext;
