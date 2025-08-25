
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    FileText, 
    Clock, 
    AlertTriangle, 
    CheckCircle, 
    XCircle,
    Eye,
    Calendar,
    User,
    GitCommit // Add revision icon
} from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { Link } from "react-router-dom";
import ElapsedTime from "@/components/ui/elapsed-time";
import TimeProgressBar from "@/components/ui/time-progress-bar";

// Inline utility function to avoid import issues
const createPageUrl = (pageName) => {
    return `/${pageName.toLowerCase()}`;
};

function ContentPipeline({ contentItems, user }) {
    const statusConfig = {
        draft: { 
            title: "Draft", 
            color: "bg-slate-100 text-slate-700", 
            icon: FileText 
        },
        in_review: { 
            title: "In Review", 
            color: "bg-blue-100 text-blue-700", 
            icon: Clock 
        },
        revisions_needed: { 
            title: "Revisions Needed", 
            color: "bg-orange-100 text-orange-700", 
            icon: AlertTriangle 
        },
        approved: { 
            title: "Approved", 
            color: "bg-emerald-100 text-emerald-700", 
            icon: CheckCircle 
        },
        published: { 
            title: "Published", 
            color: "bg-green-100 text-green-700", 
            icon: CheckCircle 
        },
        rejected: { 
            title: "Rejected", 
            color: "bg-red-100 text-red-700", 
            icon: XCircle 
        }
    };

    const getContentByStatus = (status) => {
        return contentItems.filter(item => {
            if (user?.user_role === "content_creator") {
                return item.status === status && item.created_by === user.email;
            }
            return item.status === status;
        });
    };

    const isUrgent = (item) => {
        if (!item.target_publish_date) return false;
        const today = new Date();
        const urgentDeadline = addDays(today, 2);
        return isBefore(new Date(item.target_publish_date), urgentDeadline);
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: "bg-slate-100 text-slate-600",
            medium: "bg-blue-100 text-blue-600", 
            high: "bg-orange-100 text-orange-600",
            urgent: "bg-red-100 text-red-600"
        };
        return colors[priority] || colors.medium;
    };

    return (
        <Card className="glass-effect border-0 shadow-xl h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                    <FileText className="w-5 h-5" />
                    Content Pipeline
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                    {Object.entries(statusConfig).map(([status, config]) => {
                        const items = getContentByStatus(status);
                        const StatusIcon = config.icon;
                        
                        return (
                            <div key={status} className="space-y-3 flex flex-col">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <StatusIcon className="w-4 h-4 text-slate-600" />
                                        <h3 className="font-semibold text-slate-800">{config.title}</h3>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {items.length}
                                    </Badge>
                                </div>
                                
                                <div className="space-y-2 flex-1 overflow-y-auto">
                                    {items.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 h-full flex flex-col justify-center items-center">
                                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No content</p>
                                        </div>
                                    ) : (
                                        items.slice(0, 5).map((item) => (
                                            <div 
                                                key={item.id}
                                                className={`p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200 hover:shadow-md bg-white/50 ${isUrgent(item) ? 'animate-pulse border-red-300 bg-red-50/30' : ''}`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-sm text-slate-800 line-clamp-1 flex items-center gap-2">
                                                        {item.title}
                                                        {item.version > 1 && (
                                                            <div title={`Version ${item.version}`}>
                                                                <GitCommit className="w-3 h-3 text-slate-500" />
                                                            </div>
                                                        )}
                                                    </h4>
                                                    {isUrgent(item) && (
                                                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-xs ${getPriorityColor(item.priority_level)}`}
                                                    >
                                                        {item.priority_level}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs capitalize">
                                                        {item.content_type?.replace(/_/g, " ")}
                                                    </Badge>
                                                    {/* Elapsed Time Badge */}
                                                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <ElapsedTime startDate={item.created_date} />
                                                    </Badge>
                                                </div>

                                                {/* Time Progress Bar */}
                                                {item.target_publish_date && (
                                                    <div className="mb-2">
                                                        <TimeProgressBar 
                                                            createdDate={item.created_date}
                                                            targetDate={item.target_publish_date}
                                                            height={2}
                                                        />
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {item.target_publish_date 
                                                            ? format(new Date(item.target_publish_date), "MMM d")
                                                            : "No date"
                                                        }
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {item.created_by?.split("@")[0] || "Unknown"}
                                                    </div>
                                                </div>
                                                
                                                {status === "in_review" && (
                                                    <div className="mt-2">
                                                        <Link to={createPageUrl(`ReviewQueue?content=${item.id}`)}>
                                                            <Button size="sm" variant="outline" className="w-full text-xs">
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                Review
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                    
                                    {items.length > 5 && (
                                        <div className="text-center pt-2">
                                            <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                                                +{items.length - 5} more items
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default React.memo(ContentPipeline, (prevProps, nextProps) => {
    // Only re-render if content items or user actually changed
    return (
        prevProps.contentItems === nextProps.contentItems &&
        prevProps.user?.id === nextProps.user?.id
    );
});
