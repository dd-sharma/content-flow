
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Activity, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    User,
    Clock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function RecentActivity({ reviews, contentItems, user }) {
    const getRecentActivity = () => {
        const recentReviews = reviews
            .filter(review => review.reviewed_at)
            .sort((a, b) => new Date(b.reviewed_at) - new Date(a.reviewed_at))
            .slice(0, 8);

        return recentReviews.map(review => {
            const content = contentItems.find(item => item.id === review.content_item_id);
            return {
                ...review,
                content: content
            };
        });
    };

    const getActivityIcon = (status) => {
        const icons = {
            approved: CheckCircle,
            rejected: XCircle,
            revision_requested: AlertTriangle
        };
        return icons[status] || Activity;
    };

    const getActivityColor = (status) => {
        const colors = {
            approved: "text-emerald-600 bg-emerald-50",
            rejected: "text-red-600 bg-red-50", 
            revision_requested: "text-orange-600 bg-orange-50"
        };
        return colors[status] || "text-slate-600 bg-slate-50";
    };

    const activities = getRecentActivity();

    return (
        <Card className="glass-effect border-0 shadow-xl h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                {activities.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center py-8 text-slate-400">
                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No recent activity</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 flex-1">
                        {activities.map((activity) => {
                            const ActivityIcon = getActivityIcon(activity.status);
                            const activityColor = getActivityColor(activity.status);
                            
                            return (
                                <div 
                                    key={activity.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-all duration-200 bg-white/50"
                                >
                                    <div className={`p-2 rounded-full ${activityColor} flex-shrink-0`}>
                                        <ActivityIcon className="w-4 h-4" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <p className="text-sm font-medium text-slate-800 line-clamp-1">
                                                {activity.content?.title || "Unknown Content"}
                                            </p>
                                            <Badge 
                                                variant="outline" 
                                                className="text-xs ml-2 flex-shrink-0 capitalize"
                                            >
                                                {activity.status.replace(/_/g, " ")}
                                            </Badge>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                            <User className="w-3 h-3" />
                                            <span>
                                                {activity.reviewer_role?.replace(/_/g, " ")} review
                                            </span>
                                            <span>•</span>
                                            <Clock className="w-3 h-3" />
                                            <span>
                                                {formatDistanceToNow(new Date(activity.reviewed_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        
                                        {activity.feedback && (
                                            <p className="text-xs text-slate-600 line-clamp-2">
                                                {activity.feedback}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="text-center pt-2 mt-auto">
                            <p className="text-xs text-slate-400">
                                Showing recent activity across all content
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
