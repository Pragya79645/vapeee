import React from "react";
import { NavLink } from "react-router";
import { assets } from "../assets/admin_assets/assets";

const Sidebar = () => {
    return (
        <div className="w-[18%] min-h-screen admin-sidebar">
            <div className="flex flex-col gap-4 pt-6 pl-[20%] text-[15px]">
                {/* Add Items */}
                <NavLink to="/add">
                    {({ isActive }) => (
                        <div className={`flex items-center gap-3 border border-r-0 px-3 py-2 rounded-l 
                            ${isActive ? "admin-active" : "border-gray-300"}`}>
                            <img className="w-5 h-5" src={assets.add_icon} alt="Add Icon" />
                            <p className="hidden md:block">Add Items</p>
                        </div>
                    )}
                </NavLink>

                {/* List Items */}
                <NavLink to="/list">
                    {({ isActive }) => (
                        <div className={`flex items-center gap-3 border border-r-0 px-3 py-2 rounded-l 
                            ${isActive ? "admin-active" : "border-gray-300"}`}>
                            <img className="w-5 h-5" src={assets.order_icon} alt="List Items" />
                            <p className="hidden md:block">List Items</p>
                        </div>
                    )}
                </NavLink>

                {/* Orders */}
                <NavLink to="/orders">
                    {({ isActive }) => (
                        <div className={`flex items-center gap-3 border border-r-0 px-3 py-2 rounded-l 
                            ${isActive ? "admin-active" : "border-gray-300"}`}>
                            <img className="w-5 h-5" src={assets.order_icon} alt="Orders" />
                            <p className="hidden md:block">Orders</p>
                        </div>
                    )}
                </NavLink>

                {/* Categories */}
                <NavLink to="/categories">
                    {({ isActive }) => (
                        <div className={`flex items-center gap-3 border border-r-0 px-3 py-2 rounded-l 
                            ${isActive ? "admin-active" : "border-gray-300"}`}>
                            <img className="w-5 h-5" src={assets.order_icon} alt="Categories" />
                            <p className="hidden md:block">Categories</p>
                        </div>
                    )}
                </NavLink>
            </div>
        </div>
    )
};

export default Sidebar;