import React from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const exploreLinks = [
  { label: "Home", path: "/" },
  { label: "Cars", path: "/cars" },
  { label: "My Bookings", path: "/my-bookings" },
]

const Footer = () => {
  const {setPickupDate, setReturnDate, user, isAdmin} = useAppContext()
  const visibleExploreLinks = exploreLinks.filter((link)=> link.path !== "/my-bookings" || (user?.role === "user" && !isAdmin))

  const handleLinkClick = (path)=>{
    if(path === "/cars"){
      setPickupDate("")
      setReturnDate("")
    }
  }

  return (
    <footer className="border-t border-white/10 bg-slate-950 px-5 text-sm text-slate-400 md:px-8">
      <div className="mx-auto max-w-7xl py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-white text-xs font-bold text-slate-950">
              <span className="absolute inset-x-0 top-0 h-1/2 bg-teal-100"></span>
              <span className="relative">DS</span>
            </span>
            <span>
              <span className="block text-base font-semibold text-white">DriveSphere</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Premium car booking</span>
            </span>
          </Link>

          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            {visibleExploreLinks.map((link)=>(
              <Link key={link.label} to={link.path} onClick={()=> handleLinkClick(link.path)} className="font-medium transition hover:text-white">{link.label}</Link>
            ))}
          </nav>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Copyright {new Date().getFullYear()} DriveSphere. All rights reserved.</p>
          <p>Created by Viktor Kushchevoi</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
