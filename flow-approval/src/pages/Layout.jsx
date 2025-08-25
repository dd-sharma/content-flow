

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { Notification } from "@/api/entities";
import { formatDistanceToNow } from "date-fns";
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { 
    LayoutDashboard, 
    Upload, 
    CheckSquare, 
    BarChart3, 
    Settings, 
    FileText,
    Bell,
    User as UserIcon,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Inline utility functions to avoid import issues
const createPageUrl = (pageName) => {
    return `/${pageName.toLowerCase()}`;
};

const getInitials = (fullName) => {
    if (!fullName) return "U";
    return fullName.split(" ").map(name => name.charAt(0).toUpperCase()).join("").slice(0, 2);
};

const navigationItems = [
    {
        title: "Dashboard",
        url: createPageUrl("Dashboard"),
        icon: LayoutDashboard,
        roles: ["content_creator", "brand_manager", "legal_team", "compliance", "cmo", "admin"]
    },
    {
        title: "Upload Content",
        url: createPageUrl("Upload"),
        icon: Upload,
        roles: ["content_creator", "admin"]
    },
    {
        title: "Review Queue",
        url: createPageUrl("ReviewQueue"),
        icon: CheckSquare,
        roles: ["brand_manager", "legal_team", "compliance", "cmo", "admin"]
    },
    {
        title: "Analytics",
        url: createPageUrl("Analytics"),
        icon: BarChart3,
        roles: ["admin", "cmo"]
    },
    {
        title: "Admin Settings",
        url: createPageUrl("AdminSettings"),
        icon: Settings,
        roles: ["admin"]
    }
];

export default function Layout({ children, currentPageName }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [pendingReviews, setPendingReviews] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        loadUserAndNotifications();
    }, []);

    const loadUserAndNotifications = async () => {
        setLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            if (currentUser) {
                fetchNotifications(currentUser.email);
            }
        } catch (error) {
            console.error("Failed to load user:", error);
        }
        setLoading(false);
    };

    const fetchNotifications = async (email) => {
        try {
            const fetchedNotifications = await Notification.filter({ recipient_email: email }, '-created_date', 10);
            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedNotifications.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            setNotifications([]); // Clear notifications on error
            setUnreadCount(0); // Reset unread count on error
        }
    };

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        try {
            await User.logout();
            navigate("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            await Notification.update(notification.id, { is_read: true });
            fetchNotifications(user.email);
        }
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.is_read);
        if (unreadNotifications.length === 0) return;

        await Promise.all(
            unreadNotifications.map(n => Notification.update(n.id, { is_read: true }))
        );
        fetchNotifications(user.email);
    };

    const filteredNavItems = navigationItems.filter(item => 
        !user || item.roles.includes(user.user_role)
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="animate-pulse">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <style>{`
                :root {
                    --primary: 219 234 254;
                    --primary-foreground: 30 41 59;
                    --accent: 16 185 129;
                    --accent-foreground: 255 255 255;
                }
                
                .glass-effect {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .nav-gradient {
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                }
            `}</style>

            {/* Top Navigation */}
            <nav className="nav-gradient border-b border-slate-200/20 sticky top-0 z-50">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-bold text-white">ContentFlow</h1>
                                <p className="text-xs text-slate-300">Approval Accelerator</p>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            {filteredNavItems.map((item) => (
                                <Link
                                    key={item.title}
                                    to={item.url}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                                        location.pathname === item.url
                                            ? "bg-white/20 text-white shadow-lg"
                                            : "text-slate-300 hover:text-white hover:bg-white/10"
                                    }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span className="font-medium">{item.title}</span>
                                    {item.title === "Review Queue" && pendingReviews > 0 && (
                                        <Badge className="bg-orange-500 text-white ml-1">
                                            {pendingReviews}
                                        </Badge>
                                    )}
                                </Link>
                            ))}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white relative">
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && (
                                            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white">
                                                {unreadCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80 glass-effect p-0">
                                    <div className="p-3 border-b border-slate-200 flex justify-between items-center">
                                        <h4 className="font-semibold">Notifications</h4>
                                        {notifications.some(n => !n.is_read) && (
                                            <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={handleMarkAllAsRead}>
                                                Mark all as read
                                            </Button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <p className="text-center text-sm text-slate-500 py-8">No notifications yet.</p>
                                        ) : (
                                            notifications.map(notification => (
                                                <div 
                                                    key={notification.id}
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50/50 transition-colors ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {!notification.is_read && (
                                                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                                        )}
                                                        <div className={`flex-1 ${!notification.is_read ? 'pr-2' : 'pl-5'}`}>
                                                            <p className="text-sm text-slate-700">{notification.message}</p>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="text-slate-300 hover:text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {getInitials(user?.full_name)}
                                                </span>
                                            </div>
                                            <span className="hidden sm:block font-medium">{user?.full_name}</span>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 glass-effect">
                                    <DropdownMenuLabel>
                                        <div className="space-y-1">
                                            <p className="font-medium">{user?.full_name}</p>
                                            <p className="text-xs text-slate-500 capitalize">
                                                {user?.user_role?.replace(/_/g, " ")}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogoutClick}>
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Mobile Menu Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden text-slate-300 hover:text-white"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-slate-600/20 pt-4 pb-4">
                            <div className="space-y-2">
                                {filteredNavItems.map((item) => (
                                    <Link
                                        key={item.title}
                                        to={item.url}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                            location.pathname === item.url
                                                ? "bg-white/20 text-white"
                                                : "text-slate-300 hover:text-white hover:bg-white/10"
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.title}</span>
                                        {item.title === "Review Queue" && pendingReviews > 0 && (
                                            <Badge className="bg-orange-500 text-white ml-auto">
                                                {pendingReviews}
                                            </Badge>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="px-4 sm:px-6 lg:px-8 py-8">
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </main>
            <Toaster />

            {/* Logout Confirmation Dialog */}
            <ConfirmDialog
                open={showLogoutConfirm}
                onOpenChange={setShowLogoutConfirm}
                title="Sign Out?"
                description="Are you sure you want to sign out? Any unsaved work in other tabs will be lost."
                actionLabel="Sign Out"
                variant="warning"
                onConfirm={confirmLogout}
            />
        </div>
    );
}

