import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [userTypeFilter, setUserTypeFilter] = useState('');
    const [actionTypeFilter, setActionTypeFilter] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ page, limit: 20 });
            if (userTypeFilter) query.append('userType', userTypeFilter);
            if (actionTypeFilter) query.append('actionType', actionTypeFilter);

            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/logs/list?${query.toString()}`, { withCredentials: true });

            if (res.data.success) {
                setLogs(res.data.logs);
                setTotalPages(res.data.totalPages);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load activity logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, userTypeFilter, actionTypeFilter]);

    const formatDetails = (details) => {
        if (!details) return '-';
        if (typeof details === 'string') return details;
        try {
            return JSON.stringify(details).substring(0, 100) + (JSON.stringify(details).length > 100 ? '...' : '');
        } catch (e) {
            return 'Complex Data';
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Activity Logs</h1>
            <p className="text-sm text-gray-500 mb-4">Track system events, syncs, admin changes, and customer orders.</p>

            <div className="flex gap-4 mb-4">
                <select
                    className="border px-3 py-2 rounded-md"
                    value={userTypeFilter}
                    onChange={e => { setUserTypeFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All Users</option>
                    <option value="Admin">Admins</option>
                    <option value="Customer">Customers</option>
                    <option value="System">System</option>
                </select>

                <select
                    className="border px-3 py-2 rounded-md"
                    value={actionTypeFilter}
                    onChange={e => { setActionTypeFilter(e.target.value); setPage(1); }}
                >
                    <option value="">All Actions</option>
                    <option value="ORDER_PLACE">Order Placed (COD)</option>
                    <option value="ORDER_PLACE_CLOVER">Order Placed (Clover)</option>
                    <option value="ORDER_STATUS_UPDATE">Order Status Updated</option>
                    <option value="ORDER_CANCEL">Order Cancelled</option>
                    <option value="PRODUCT_ADD">Product Added</option>
                    <option value="PRODUCT_UPDATE">Product Updated</option>
                    <option value="PRODUCT_DELETE">Product Deleted</option>
                    <option value="CLOVER_SYNC">Clover Sync</option>
                </select>
            </div>

            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Date</th>
                            <th className="px-6 py-3 font-semibold">Actor</th>
                            <th className="px-6 py-3 font-semibold">Action</th>
                            <th className="px-6 py-3 font-semibold">Target Entity</th>
                            <th className="px-6 py-3 font-semibold">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No logs found matching criteria.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                        {new Date(log.date).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${log.userType === 'Admin' ? 'bg-purple-100 text-purple-700' : log.userType === 'Customer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-800'}`}>
                                            {log.userType}
                                        </span>
                                        <div className="mt-1 text-xs text-gray-500">
                                            {log.adminId?.email || log.userId?.name || log.userId?.email || ''}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{log.actionType}</td>
                                    <td className="px-6 py-4">{log.entityName || log.entityId || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs truncate text-xs font-mono text-gray-500 bg-gray-50 p-1 rounded">
                                            {formatDetails(log.details)}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1 bg-gray-100 rounded">
                        {page} of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default Logs;
