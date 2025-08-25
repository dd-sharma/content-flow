import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    FileText, 
    Clock, 
    CheckCircle, 
    AlertTriangle,
    TrendingUp,
    Users
} from "lucide-react";

export default function DashboardStats({ 
    user, 
    contentItems, 
    reviews, 
    pendingReviews, 
    urgentContent 
}) {
    const getMyContentCount = () => {
        return contentItems.filter(item => item.created_by === user?.email).length;
    };

    const getApprovedThisWeek = () => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        return reviews.filter(review => 
            review.status === "approved" && 
            review.reviewed_at &&
            new Date(review.reviewed_at) > oneWeekAgo
        ).length;
    };

    const getAverageApprovalTime = () => {
        const completedReviews = reviews.filter(review => 
            review.time_to_review_hours && review.time_to_review_hours > 0
        );
        
        if (completedReviews.length === 0) return "0h";
        
        const avgHours = completedReviews.reduce((sum, review) => 
            sum + review.time_to_review_hours, 0
        ) / completedReviews.length;
        
        // Display as hours if <24, otherwise as days
        return avgHours < 24 ? `${avgHours.toFixed(1)}h` : `${(avgHours / 24).toFixed(1)}d`;
    };

    const stats = [
        {
            title: user?.user_role === "content_creator" ? "My Content" : "Total Content",
            value: user?.user_role === "content_creator" ? getMyContentCount() : contentItems.length,
            icon: FileText,
            color: "blue",
            description: user?.user_role === "content_creator" ? "Items submitted" : "All items"
        },
        {
            title: "Pending Reviews",
            value: pendingReviews.length,
            icon: Clock,
            color: "orange",
            description: "Awaiting approval"
        },
        {
            title: "Approved This Week", 
            value: getApprovedThisWeek(),
            icon: CheckCircle,
            color: "emerald",
            description: "Recently approved"
        },
        {
            title: urgentContent.length > 0 ? "Urgent Items" : "Avg. Approval Time",
            value: urgentContent.length > 0 ? urgentContent.length : getAverageApprovalTime(),
            icon: urgentContent.length > 0 ? AlertTriangle : TrendingUp,
            color: urgentContent.length > 0 ? "red" : "purple",
            description: urgentContent.length > 0 ? "Need attention" : "Time to approve"
        }
    ];

    const colorMap = {
        blue: {
            bg: "from-blue-500 to-blue-600",
            light: "bg-blue-50",
            text: "text-blue-700"
        },
        orange: {
            bg: "from-orange-500 to-orange-600", 
            light: "bg-orange-50",
            text: "text-orange-700"
        },
        emerald: {
            bg: "from-emerald-500 to-emerald-600",
            light: "bg-emerald-50", 
            text: "text-emerald-700"
        },
        red: {
            bg: "from-red-500 to-red-600",
            light: "bg-red-50",
            text: "text-red-700"
        },
        purple: {
            bg: "from-purple-500 to-purple-600",
            light: "bg-purple-50",
            text: "text-purple-700"
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <Card key={index} className="glass-effect border-0 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                    <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-r ${colorMap[stat.color].bg} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-3 rounded-xl ${colorMap[stat.color].light}`}>
                            <stat.icon className={`w-5 h-5 ${colorMap[stat.color].text}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 mb-1">
                            {stat.value}
                        </div>
                        <p className="text-xs text-slate-500">
                            {stat.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}