import axios from "axios";
import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { toast } from "react-toastify";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/admin/dashboard`, { withCredentials: true });
            if (res.data.success) {
                setUser(res.data.admin);
            }
        } catch (err) {
            console.log(err);
            setUser(null);
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        checkAuth();
    }, [])

    const login = async (email, password) => {
        try {
            const res = await axios.post(
                `${backendUrl}/api/admin/login`,
                { email, password },
                { withCredentials: true }
            );

            if (res.data.success) {
                await checkAuth();
                return true;
            } else {
                toast.error(res.data.message);
                return false;
            }
        } catch (err) {
            throw new Error(err?.response?.data?.message || "Login failed");
        }
    };


    const logout = async () => {
        try {
            const res = await axios.post(`${backendUrl}/api/admin/logout`, {}, { withCredentials: true });
            if (res.data.success) {
                setUser(null);
                toast.success(res.data.message);
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }} >
            {children}
        </AuthContext.Provider>
    );
};