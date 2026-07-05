import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const pageLabels = {
  "/admin": "Dashboard",
  "/admin/add-car": "Add Car",
  "/admin/manage-cars": "Manage Cars",
  "/admin/manage-bookings": "Manage Bookings",
};

const NavbarAdmin = () => {
  const {
    user,
    logout,
    navigate,
    notifications,
    notificationsLoading,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppContext();
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pageLabel = pageLabels[location.pathname] || "Admin Workspace";
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const formatNotificationDate = (value)=>{
    if(!value) return "";
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getNotificationBookingId = (notification)=>{
    if(!notification?.booking) return "";
    return typeof notification.booking === "object" ? notification.booking._id : notification.booking;
  };

  const handleNotificationsToggle = ()=>{
    setNotificationsOpen(open => !open);
    if(!notificationsOpen){
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification)=>{
    if(!notification.isRead){
      await markNotificationRead(notification._id);
    }
    const bookingId = getNotificationBookingId(notification);
    setNotificationsOpen(false);
    navigate(bookingId ? `/admin/manage-bookings?bookingId=${bookingId}` : "/admin/manage-bookings");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 px-4 py-4 backdrop-blur-xl md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Admin Portal</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">{pageLabel}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 md:block">
            Signed in as <span className="font-semibold text-slate-950">{user?.name || "Admin"}</span>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={handleNotificationsToggle}
              className="relative rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
            >
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-md border border-slate-200 bg-white p-4 shadow-2xl">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-slate-950">Notifications</p>
                  {notifications.length > 0 && (
                    <button type="button" onClick={markAllNotificationsRead} className="text-xs font-semibold text-primary hover:text-primary-dull">
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <p className="py-6 text-center text-sm text-slate-500">Loading notifications...</p>
                  ) : notifications.length > 0 ? (
                    <div className="grid gap-2">
                      {notifications.map(notification => (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={()=> handleNotificationClick(notification)}
                          className={`rounded-md border p-3 text-left transition ${notification.isRead ? "border-slate-100 bg-white" : "border-primary/20 bg-primary/5"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-950">{notification.title}</p>
                            {!notification.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"></span>}
                          </div>
                          <p className="mt-1 text-sm leading-5 text-slate-600">{notification.message}</p>
                          <p className="mt-2 text-xs font-medium text-slate-400">{formatNotificationDate(notification.createdAt)}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-500">No notifications yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <Link
            to="/"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
          >
            View Website
          </Link>
          <button
            onClick={logout}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dull"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavbarAdmin;
