import React from "react";
import { assets } from "../assets/admin_assets/assets";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const { logout } = useAuth();
    return (
        <div className="flex items-center py-2 px-[4%] justify-between" style={{background:'var(--bg)'}}>
            <div className="flex items-center gap-3">
                <span className="text-2xl font-extrabold" style={{ color: 'var(--brand)' }}>Knight St. Vapes</span>
                <span className="text-2xl text-black">Admin</span>
            </div>
            <button onClick={logout} className="px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm cursor-pointer btn-gold">Logout</button>
        </div>
    )
};

export default Navbar;