
import React, { useState, useEffect, useMemo } from 'react';
import { ContentItem } from '@/api/entities';
import { Review } from '@/api/entities';
import { User } from '@/api/entities';
import { useToast } from "@/components/ui/use-toast";
import { createPageUrl } from "@/components/utils"; // Removed formatCurrency from here
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    CalendarDays,
    FileText,
    CheckCircle,
    Clock,
    DollarSign,
    TrendingUp,
    ArrowLeft,
    Filter,
    RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Link } from "react-router-dom";
import { 
    ChartSkeleton, 
    AnalyticsStatsSkeleton,
    FormSkeleton 
} from "@/components/ui/skeletons";
import { LoadingTransition, InlineLoader } from "@/components/ui/loading-states";
import { cache } from "@/components/utils/cache";

// Add formatCurrency function inline
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function Analytics() {
    const [user, setUser] = useState(null);
    const [allContent, setAllContent] = useState([]);
    const [allReviews, setAllReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Filters
    const [dateRange, setDateRange] = useState("30");
    const [selectedContentType, setSelectedContentType] = useState("all");
    const [selectedUser, setSelectedUser] = useState("all");
    
    // Derived data
    const [filteredContent, setFilteredContent] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterData();
    }, [allContent, allReviews, dateRange, selectedContentType, selectedUser]);
    
    const loadData = async (forceRefresh = false) => {
        if (forceRefresh) {
            setRefreshing(true);
            cache.invalidatePattern('analytics:*');
        } else {
            setLoading(true);
        }

        try {
            let limit = 100;
            if (dateRange === "7") limit = 50;
            else if (dateRange === "30") limit = 200;
            else if (dateRange === "90") limit = 500;
            else if (dateRange === "all") limit = 1000;
            
            if (limit > 200) {
                toast({
                    title: "Loading Data",
                    description: "Loading large dataset, this may take a moment...",
                });
            }
            
            const [currentUser, contentData, reviewData] = await Promise.all([
                cache.query('analytics:user', () => User.me(), 10 * 60 * 1000),
                cache.query(`analytics:content:${limit}`, () => ContentItem.list("-created_date", limit), 5 * 60 * 1000),
                cache.query(`analytics:reviews:${limit * 2}`, () => Review.list("-created_date", limit * 2), 5 * 60 * 1000)
            ]);
            
            setUser(currentUser);
            setAllContent(contentData);
            setAllReviews(reviewData);
            
            if (contentData.length === limit) {
                toast({
                    title: "Data Limit Reached",
                    description: `Showing most recent ${limit} items. Some older data may not be included.`,
                });
            }
            
        } catch (error) {
            console.error("Error loading analytics data:", error);
            toast({
                title: "Failed to load analytics",
                description: error.message || "Please try again later.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterData = () => {
        if (loading) return;
        
        let contentData = [...allContent];
        let reviewData = [...allReviews];
        
        // Date filtering
        if (dateRange !== "all") {
            const daysAgo = parseInt(dateRange);
            const cutoffDate = subDays(new Date(), daysAgo);
            
            contentData = contentData.filter(item => 
                new Date(item.created_date) >= cutoffDate
            );
            reviewData = reviewData.filter(review => 
                new Date(review.created_date) >= cutoffDate
            );
        }
        
        // Content type filtering
        if (selectedContentType !== "all") {
            contentData = contentData.filter(item => 
                item.content_type === selectedContentType
            );
        }
        
        // User filtering
        if (selectedUser !== "all") {
            contentData = contentData.filter(item => 
                item.created_by === selectedUser
            );
        }
        
        setFilteredContent(contentData);
        setFilteredReviews(reviewData);
    };

    // Memoize expensive calculations
    const chartData = useMemo(() => {
        if (loading) return {};
        
        const getApprovalTimeByContentType = () => {
            const typeData = {};
            filteredContent.forEach(content => {
                const reviews = filteredReviews.filter(r => r.content_item_id === content.id);
                const avgTime = reviews.length > 0 
                    ? reviews.reduce((sum, r) => sum + (r.time_to_review_hours || 0), 0) / reviews.length 
                    : 0;
                
                if (!typeData[content.content_type]) {
                    typeData[content.content_type] = { total: 0, count: 0 };
                }
                typeData[content.content_type].total += avgTime;
                typeData[content.content_type].count += 1;
            });
            
            return Object.entries(typeData).map(([type, data]) => ({
                name: type.replace(/_/g, ' '),
                avgTime: data.count > 0 ? (data.total / data.count).toFixed(1) : 0
            }));
        };

        const getRevisionRateByContentType = () => {
            const typeData = {};
            filteredContent.forEach(content => {
                const revisions = filteredReviews.filter(r => 
                    r.content_item_id === content.id && r.status === 'revision_requested'
                ).length;
                
                if (!typeData[content.content_type]) {
                    typeData[content.content_type] = 0;
                }
                typeData[content.content_type] += revisions;
            });
            
            return Object.entries(typeData).map(([type, revisions]) => ({
                name: type.replace(/_/g, ' '),
                revisions
            }));
        };

        const getContentStatusOverTime = () => {
            const last30Days = Array.from({ length: 30 }, (_, i) => {
                const date = subDays(new Date(), 29 - i);
                return {
                    date: format(date, 'MMM dd'),
                    approved: 0,
                    rejected: 0,
                    in_review: 0
                };
            });
            
            filteredContent.forEach(content => {
                const dayIndex = Math.floor((new Date() - new Date(content.created_date)) / (1000 * 60 * 60 * 24));
                if (dayIndex >= 0 && dayIndex < 30) {
                    const dataIndex = 29 - dayIndex;
                    if (dataIndex >= 0 && dataIndex < last30Days.length) {
                        if (content.status === 'approved' || content.status === 'published') {
                            last30Days[dataIndex].approved += 1;
                        } else if (content.status === 'rejected') {
                            last30Days[dataIndex].rejected += 1;
                        } else if (content.status === 'in_review') {
                            last30Days[dataIndex].in_review += 1;
                        }
                    }
                }
            });
            
            return last30Days;
        };

        const getContentVolumeTrends = () => {
            const last30Days = Array.from({ length: 30 }, (_, i) => {
                const date = subDays(new Date(), 29 - i);
                return {
                    date: format(date, 'MMM dd'),
                    count: 0
                };
            });
            
            filteredContent.forEach(content => {
                const dayIndex = Math.floor((new Date() - new Date(content.created_date)) / (1000 * 60 * 60 * 24));
                if (dayIndex >= 0 && dayIndex < 30) {
                    const dataIndex = 29 - dayIndex;
                    if (dataIndex >= 0 && dataIndex < last30Days.length) {
                        last30Days[dataIndex].count += 1;
                    }
                }
            });
            
            return last30Days;
        };

        const getTimeDistribution = () => {
            const completedReviews = filteredReviews.filter(r => r.time_to_review_hours > 0);
            
            const distributions = [
                { name: '< 4 hours', value: 0, color: '#3b82f6' },
                { name: '4-24 hours', value: 0, color: '#f97316' },
                { name: '1-3 days', value: 0, color: '#ef4444' },
                { name: '> 3 days', value: 0, color: '#8b5cf6' }
            ];
            
            completedReviews.forEach(review => {
                const hours = review.time_to_review_hours;
                if (hours < 4) distributions[0].value++;
                else if (hours < 24) distributions[1].value++;
                else if (hours < 72) distributions[2].value++;
                else distributions[3].value++;
            });
            
            return distributions.filter(d => d.value > 0);
        };

        const getApprovalTimeByReviewer = () => {
            const reviewerData = {};
            filteredReviews.forEach(review => {
                if (review.time_to_review_hours > 0) {
                    const role = review.reviewer_role?.replace(/_/g, ' ') || 'Unknown';
                    if (!reviewerData[role]) {
                        reviewerData[role] = { total: 0, count: 0 };
                    }
                    reviewerData[role].total += review.time_to_review_hours;
                    reviewerData[role].count += 1;
                }
            });
            
            return Object.entries(reviewerData)
                .map(([role, data]) => ({
                    name: role,
                    avgTime: (data.total / data.count).toFixed(1)
                }))
                .sort((a, b) => parseFloat(b.avgTime) - parseFloat(a.avgTime));
        };

        return {
            approvalTimeByType: getApprovalTimeByContentType(),
            revisionRates: getRevisionRateByContentType(),
            approvalTimeByReviewer: getApprovalTimeByReviewer(),
            contentStatusOverTime: getContentStatusOverTime(),
            volumeTrends: getContentVolumeTrends(),
            timeDistribution: getTimeDistribution(),
        };
    }, [filteredContent, filteredReviews, loading]);

    if (loading && allContent.length === 0) {
        return (
            <div className="space-y-8">
                {/* Header Skeleton */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 skeleton-shimmer" />
                        <Skeleton className="h-5 w-96 skeleton-shimmer" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-48 skeleton-shimmer" />
                        <Skeleton className="h-10 w-24 skeleton-shimmer" />
                    </div>
                </div>
                
                {/* Filters Skeleton */}
                <Card className="glass-effect border-0 shadow-xl">
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-10 w-32 skeleton-shimmer" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
                
                {/* Stats Skeleton */}
                <AnalyticsStatsSkeleton />
                
                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <ChartSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <LoadingTransition
            loading={false}
            loadingComponent={<div>Loading...</div>}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
                    <p className="text-slate-600">Insights into your content approval workflows and performance</p>
                </div>
                
                <div className="flex gap-4">
                    <Link to={createPageUrl("Dashboard")}>
                        <Button variant="outline" className="glass-effect">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <Button 
                        onClick={() => loadData(true)} 
                        disabled={refreshing}
                        variant="outline" 
                        className="glass-effect"
                    >
                        {refreshing ? (
                            <InlineLoader message="Refreshing" size="sm" />
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="glass-effect border-0 shadow-xl">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">Filters:</span>
                        </div>
                        
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-40 glass-effect">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="90">Last 90 days</SelectItem>
                                <SelectItem value="all">All time</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                            <SelectTrigger className="w-48 glass-effect">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Content Types</SelectItem>
                                <SelectItem value="blog_post">Blog Posts</SelectItem>
                                <SelectItem value="social_media_post">Social Media</SelectItem>
                                <SelectItem value="email_campaign">Email Campaigns</SelectItem>
                                <SelectItem value="ad_creative">Ad Creatives</SelectItem>
                                <SelectItem value="press_release">Press Releases</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Content Items</CardTitle>
                        <FileText className="w-4 h-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredContent.length}</div>
                    </CardContent>
                </Card>
                
                <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Approved</CardTitle>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredContent.filter(c => c.status === 'approved' || c.status === 'published').length}
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Avg. Approval Time</CardTitle>
                        <Clock className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {
                                (() => {
                                    const completed = filteredReviews.filter(r => r.time_to_review_hours);
                                    if (completed.length === 0) return 'N/A';
                                    const avg = completed.reduce((sum, r) => sum + r.time_to_review_hours, 0) / completed.length;
                                    return `${avg.toFixed(1)} hrs`;
                                })()
                            }
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="glass-effect border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Estimated Spend</CardTitle>
                        <DollarSign className="w-4 h-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(filteredContent.reduce((sum, item) => sum + (item.estimated_spend || 0), 0))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-effect border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Approval Time by Content Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.approvalTimeByType} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="avgTime" fill="#3b82f6" name="Avg. Hours" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-effect border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Revisions by Content Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.revisionRates} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="revisions" fill="#f97316" name="Revisions Requested" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 glass-effect border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Content Status Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={chartData.contentStatusOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="approved" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="rejected" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="in_review" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-effect border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Content Volume Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData.volumeTrends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Content Submitted" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="glass-effect border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Time to Review Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={chartData.timeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                    {chartData.timeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#f97316', '#ef4444', '#8b5cf6'][index % 4]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 glass-effect border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-800">Approval Time by Reviewer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.approvalTimeByReviewer} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="avgTime" fill="#14b8a6" name="Avg. Hours" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </LoadingTransition>
    );
}
