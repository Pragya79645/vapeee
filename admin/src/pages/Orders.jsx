import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../assets/admin_assets/assets.js";

const Orders = () => {
    const currency = "$";
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all orders for admin
    const fetchAllOrders = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/order/list`, {
                withCredentials: true,
            });
            if (res.data.success) {
                setOrders(res.data.orders);
            } else {
                toast.error(res.data.message || "Failed to fetch orders.");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    // Handle order status update
    const statusHandler = async (newStatus, orderId) => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/order/status`,
                { orderId, status: newStatus },
                { withCredentials: true }
            );

            if (res.data.success) {
                // Update order status in state
                setOrders((prev) =>
                    prev.map((order) =>
                        order._id === orderId ? { ...order, status: newStatus } : order
                    )
                );
                toast.success("Order status updated successfully.");
            } else {
                toast.error(res.data.message || "Failed to update order status.");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Something went wrong while updating the order status.");
        }
    };

    // Handle individual order item status update
    const itemStatusHandler = async (newStatus, orderId, itemId) => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/order/status`,
                { orderId, itemId, status: newStatus },
                { withCredentials: true }
            );

            if (res.data.success) {
                // Update the specific item status in state
                setOrders(prev => prev.map(order => {
                    if (order._id !== orderId) return order;
                    return {
                        ...order,
                        items: order.items.map(item => item._id === itemId ? { ...item, status: newStatus } : item)
                    };
                }));
                toast.success('Order item status updated successfully.');
            } else {
                toast.error(res.data.message || 'Failed to update item status.');
            }
        } catch (error) {
            console.error('Error updating item status:', error);
            toast.error('Something went wrong while updating the item status.');
        }
    };

    useEffect(() => {
        fetchAllOrders();
    }, []);

    if (loading) return <p className="p-4 text-center text-gray-500">Loading orders...</p>;
    if (!orders.length) return <p className="p-4 text-center text-gray-500">No orders found.</p>;

    return (
        <div className="p-4">
            <h3 className="text-2xl font-semibold mb-4">Orders</h3>
            <div className="space-y-4">
                {orders.map((order) => (
                    <article
                        key={order._id}
                        className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 md:p-6 rounded-lg grid grid-cols-1 sm:grid-cols-[48px_1fr_180px] lg:grid-cols-[48px_1fr_220px_120px] gap-4 items-start text-base text-gray-800"
                    >
                        <div className="flex items-start">
                            <img className="w-12 h-12" src={assets.parcel_icon} alt="Parcel Icon" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11zM6 20a6 6 0 0112 0"/></svg>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-base font-semibold truncate">{order.userId?.name || 'Guest'}</p>
                                            <p className="text-sm text-gray-500 truncate">Order #{String(order._id).slice(-6)} • {new Date(order.createdAt).toLocaleDateString()}</p>

                                            <div className="mt-2 text-sm text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">Phone:</span>
                                                    <a className="text-blue-600 hover:underline" href={`tel:${order.phone}`}>{order.phone || '—'}</a>
                                                </div>

                                                <div className="mt-2">
                                                    <span className="text-gray-400">Address:</span>
                                                    <address className="not-italic mt-1 text-gray-700">
                                                        <div>{order.address?.street || '-'}</div>
                                                        <div>{[order.address?.city, order.address?.state].filter(Boolean).join(', ')} {order.address?.zip || ''}</div>
                                                        <div>{order.address?.country || ''}</div>
                                                    </address>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <p className={`px-2 py-0.5 rounded-full text-sm ${order.payment ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{order.payment ? 'Paid' : 'Pending'}</p>
                                    <p className="text-sm text-gray-500">{order.phone}</p>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                {order.items.map((item, index) => (
                                    <div className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0" key={item._id || index}>
                                        <div className="min-w-0">
                                            <p className="text-base truncate">{item.name} <span className="text-sm text-gray-500">x {item.quantity}</span></p>
                                            <p className="text-sm text-gray-500">{item.variantSize || item.size || ''}</p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <select
                                                value={item.status || "Pending"}
                                                onChange={(e) => itemStatusHandler(e.target.value, order._id, item._id)}
                                                className="p-2 border border-gray-200 rounded-md bg-white text-sm"
                                            >
                                                {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <p className={`text-sm px-2 py-0.5 rounded-full ${item.status === 'Delivered' ? 'bg-green-50 text-green-700' : item.status === 'Cancelled' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{item.status || 'Pending'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="hidden lg:block">
                            <p className="text-base">Items: <span className="font-medium">{order.items.length}</span></p>
                            <p className="mt-2 text-base">Method: <span className="font-medium">{order.paymentMethod}</span></p>
                            <p className="mt-2 text-base">Date: <span className="text-gray-500">{new Date(order.createdAt).toLocaleString()}</span></p>
                        </div>

                        <div className="flex flex-col items-end justify-between">
                            <div className="text-right">
                                <p className="text-base text-gray-500">Total</p>
                                <p className="text-2xl font-bold">{currency} {order.amount}</p>
                            </div>
                        </div>

                    </article>
                ))}
            </div>
        </div>
    );
};

export default Orders;
