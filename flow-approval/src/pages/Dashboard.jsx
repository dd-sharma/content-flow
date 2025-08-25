
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { ContentItem } from "@/api/entities";
import { Review } from "@/api/entities";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
    Clock,
    CheckCircle,
    AlertTriangle,
    FileText,
    Plus,
    TrendingUp,
    Users,
    Calendar,
    RefreshCw 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isAfter, isBefore, addDays } from "date-fns";

import DashboardStats from "../components/dashboard/DashboardStats";
import ContentPipeline from "../components/dashboard/ContentPipeline";
import PendingReviews from "../components/dashboard/PendingReviews";
import RecentActivity from "../components/dashboard/RecentActivity";
import SLAWarning from "@/components/ui/sla-warning";
import ElapsedTime from "@/components/ui/elapsed-time";
import { 
    DashboardStatsSkeleton, 
    PipelineColumnSkeleton,
    ContentCardSkeleton 
} from "@/components/ui/skeletons";
import { LoadingTransition } from "@/components/ui/loading-states";

// Inline utility functions to bypass import issues
const createPageUrl = (pageName) => {
    return `/${pageName.toLowerCase()}`;
};

// Simple cache implementation inline
class InlineCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }
    
    set(key, value, ttl = 5 * 60 * 1000) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }
        
        this.cache.set(key, { value, timestamp: Date.now(), ttl });
        
        if (ttl > 0) {
            const timer = setTimeout(() => this.delete(key), ttl);
            this.timers.set(key, timer);
        }
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (item.ttl > 0 && Date.now() - item.timestamp > item.ttl) {
            this.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    delete(key) {
        this.cache.delete(key);
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
    }
    
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        const keysToDelete = [];
        
        this.cache.forEach((_, key) => {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        });
        
        keysToDelete.forEach(key => this.delete(key));
    }

    async query(key, apiCall, ttl) {
        const cachedValue = this.get(key);
        if (cachedValue !== null) {
            return Promise.resolve(cachedValue);
        }

        try {
            const result = await apiCall();
            this.set(key, result, ttl);
            return result;
        } catch (error) {
            throw error;
        }
    }
}

const cache = new InlineCache();

// Trigger rebuild

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [contentItems, setContentItems] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
    const { toast } = useToast();

    useEffect(() => {
        loadDashboardData(false);
    }, []);

    // Auto-refresh data every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            loadDashboardData(false);
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async (forceRefresh = false) => {
        setLoading(true);

        if (forceRefresh) {
            cache.invalidatePattern('dashboard:*');
            toast({
                title: "Refreshing data...",
                description: "Fetching the latest information from the server.",
            });
        }

        try {
            const [currentUser, allContent, allReviews] = await Promise.all([
                cache.query('dashboard:user', () => User.me(), 10 * 60 * 1000),
                cache.query('dashboard:content', () => ContentItem.list("-created_date", 25), 2 * 60 * 1000),
                cache.query('dashboard:reviews', () => Review.list("-created_date", 75), 2 * 60 * 1000)
            ]);
            
            setUser(currentUser);
            setContentItems(allContent);
            setReviews(allReviews);

            if (forceRefresh) {
                toast({
                    title: "Dashboard Refreshed",
                    description: "Your data is up to date.",
                });
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            toast({
                title: "Failed to load dashboard",
                description: error.message || "There was an issue fetching the latest data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setLastRefreshTime(new Date());
        }
    };

    const getMyContent = () => {
        return contentItems.filter(item => item.created_by === user?.email);
    };

    const getPendingReviews = () => {
        return reviews.filter(review => 
            review.reviewer_email === user?.email && 
            review.status === "pending"
        );
    };

    const getUrgentContent = () => {
        const today = new Date();
        const urgentDeadline = addDays(today, 2);
        
        return contentItems.filter(item => 
            item.status === "in_review" && 
            item.target_publish_date && 
            isBefore(new Date(item.target_publish_date), urgentDeadline)
        );
    };

    if (loading && contentItems.length === 0) {
        return (
            <div className="space-y-8">
                {/* Welcome Header Skeleton */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 skeleton-shimmer" />
                        <Skeleton className="h-5 w-96 skeleton-shimmer" />
                        <Skeleton className="h-4 w-48 skeleton-shimmer" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-32 skeleton-shimmer" />
                        <Skeleton className="h-10 w-32 skeleton-shimmer" />
                    </div>
                </div>
                
                {/* Stats Skeleton */}
                <DashboardStatsSkeleton />
                
                {/* Main Grid Skeleton */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2">
                        <Card className="glass-effect border-0 shadow-xl">
                            <CardHeader>
                                <Skeleton className="h-6 w-32 skeleton-shimmer" />
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <PipelineColumnSkeleton key={i} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="space-y-6">
                        <ContentCardSkeleton />
                        <ContentCardSkeleton />
                    </div>
                </div>

                {/* Quick Actions Skeleton */}
                <Card className="glass-effect shadow-xl border-0">
                    <CardHeader>
                        <Skeleton className="h-6 w-32 skeleton-shimmer" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-16 w-full skeleton-shimmer" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <LoadingTransition
            loading={false}
            loadingComponent={<div>Loading...</div>}
            className="space-y-8"
        >
            {/* Welcome Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Welcome back, {user?.full_name?.split(" ")[0] || "User"}
                    </h1>
                    <p className="text-slate-600 mt-2">
                        {user?.user_role === "content_creator" 
                            ? "Ready to create amazing content?"
                            : user?.user_role === "admin"
                            ? "Manage your team's approval workflows"
                            : "Review and approve pending content"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                        <span>Last updated: <ElapsedTime startDate={lastRefreshTime} /></span>
                        <Button size="icon" variant="ghost" onClick={() => loadDashboardData(true)} className="w-6 h-6 rounded-full" disabled={loading}>
                            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="flex gap-3">
                    {user?.user_role === "content_creator" || user?.user_role === "admin" ? (
                        <Link to={createPageUrl("Upload")}>
                            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                                <Plus className="w-4 h-4 mr-2" />
                                Upload Content
                            </Button>
                        </Link>
                    ) : null}
                    
                    {["brand_manager", "legal_team", "compliance", "cmo", "admin"].includes(user?.user_role) && (
                        <Link to={createPageUrl("ReviewQueue")}>
                            <Button variant="outline" className="glass-effect shadow-sm">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Review Queue
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* SLA Warning Banner */}
            <SLAWarning reviews={reviews} contentItems={contentItems} />

            {/* Dashboard Stats */}
            <div className="mb-12">
                <DashboardStats 
                    user={user}
                    contentItems={contentItems}
                    reviews={reviews}
                    pendingReviews={getPendingReviews()}
                    urgentContent={getUrgentContent()}
                />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12 items-stretch">
                {/* Content Pipeline */}
                <div className="xl:col-span-2">
                    <ContentPipeline 
                        contentItems={contentItems}
                        user={user}
                    />
                </div>

                {/* Sidebar */}
                <div className="flex flex-col h-full gap-6">
                    <PendingReviews 
                        reviews={getPendingReviews()}
                        contentItems={contentItems}
                    />
                    
                    <RecentActivity 
                        reviews={reviews}
                        contentItems={contentItems}
                        user={user}
                    />
                </div>
            </div>

            {/* Quick Actions for Different Roles */}
            <Card className="glass-effect shadow-xl border-0">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        <TrendingUp className="w-5 h-5" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {user?.user_role === "content_creator" && (
                            <>
                                <Link to={createPageUrl("Upload")}>
                                    <Button variant="outline" className="w-full justify-start h-auto py-4 glass-effect">
                                        <Plus className="w-5 h-5 mr-3 text-blue-600" />
                                        <div className="text-left">
                                            <p className="font-medium">New Content</p>
                                            <p className="text-xs text-slate-500">Upload for review</p>
                                        </div>
                                    </Button>
                                </Link>
                                <Button variant="outline" className="w-full justify-start h-auto py-4 glass-effect">
                                    <FileText className="w-5 h-5 mr-3 text-emerald-600" />
                                    <div className="text-left">
                                        <p className="font-medium">My Content</p>
                                        <p className="text-xs text-slate-500">{getMyContent().length} items</p>
                                    </div>
                                </Button>
                            </>
                        )}
                        
                        {["brand_manager", "legal_team", "compliance", "cmo"].includes(user?.user_role) && (
                            <>
                                <Link to={createPageUrl("ReviewQueue")}>
                                    <Button variant="outline" className="w-full justify-start h-auto py-4 glass-effect">
                                        <Clock className="w-5 h-5 mr-3 text-orange-600" />
                                        <div className="text-left">
                                            <p className="font-medium">Pending Reviews</p>
                                            <p className="text-xs text-slate-500">{getPendingReviews().length} items</p>
                                        </div>
                                    </Button>
                                </Link>
                                <Button variant="outline" className="w-full justify-start h-auto py-4 glass-effect">
                                    <AlertTriangle className="w-5 h-5 mr-3 text-red-600" />
                                    <div className="text-left">
                                        <p className="font-medium">Urgent Items</p>
                                        <p className="text-xs text-slate-500">{getUrgentContent().length} items</p>
                                    </div>
                                </Button>
                            </>
                        )}
                        
                        {user?.user_role === "admin" && (
                            <>
                                <Link to={createPageUrl("Analytics")}>
                                    <Button variant="outline" className="w-full justify-start h-auto py-4 glass-effect">
                                        <TrendingUp className="w-5 h-5 mr-3 text-purple-600" />
                                        <div className="text-left">
                                            <p className="font-medium">Analytics</p>
                                            <p className="text-xs text-slate-500">View insights</p>
                                        </div>
                                    </Button>
                                </Link>
                                <Link to={createPageUrl("AdminSettings")}>
                                    <Button variant="outline" className="w-full justify-start h-auto py-4 glass-effect">
                                        <Users className="w-5 h-5 mr-3 text-indigo-600" />
                                        <div className="text-left">
                                            <p className="font-medium">Settings</p>
                                            <p className="text-xs text-slate-500">Manage workflows</p>
                                        </div>
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </LoadingTransition>
    );
}
