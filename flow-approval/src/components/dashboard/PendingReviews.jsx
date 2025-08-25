
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Clock, 
    AlertTriangle, 
    CheckCircle, 
    FileText,
    Calendar,
    ArrowRight
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import { Link } from "react-router-dom";
import CountdownTimer from "@/components/ui/countdown-timer";
import TimeProgressBar from "@/components/ui/time-progress-bar";
import ElapsedTime from "@/components/ui/elapsed-time";

// Inline utility function to avoid import issues
const createPageUrl = (pageName) => {
    return `/${pageName.toLowerCase()}`;
};

export default function PendingReviews({ reviews, contentItems }) {
    const getContentForReview = (reviewContentId) => {
        return contentItems.find(item => item.id === reviewContentId);
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

    const isWaitingTooLong = (createdDate) => {
        const hoursWaiting = differenceInHours(new Date(), new Date(createdDate));
        return hoursWaiting > 24;
    };

    return (
        <Card className="glass-effect border-0 shadow-xl h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="text-slate-800">Awaiting Your Review</span>
                    </div>
                    {reviews.length > 0 && (
                        <Badge className="bg-orange-500 text-white">
                            {reviews.length}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                {reviews.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center py-8 text-slate-400">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <h3 className="font-medium text-slate-600 mb-2">All caught up!</h3>
                            <p className="text-sm">No pending reviews at the moment.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 flex-1">
                        {reviews.slice(0, 4).map((review) => {
                            const content = getContentForReview(review.content_item_id);
                            if (!content) return null;

                            const waitingTooLong = isWaitingTooLong(review.created_date);

                            return (
                                <div 
                                    key={review.id}
                                    className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200 hover:shadow-md bg-white/70 relative"
                                >
                                    {/* Waiting Too Long Indicator */}
                                    {waitingTooLong && (
                                        <div className="absolute top-3 left-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    )}

                                    <div className={`flex items-start justify-between mb-3 ${waitingTooLong ? 'ml-6' : ''}`}>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-slate-800 line-clamp-1 mb-1">
                                                {content.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 line-clamp-2">
                                                {content.description}
                                            </p>
                                        </div>
                                        {content.priority_level === "urgent" && (
                                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <Badge 
                                            variant="outline" 
                                            className={`text-xs ${getPriorityColor(content.priority_level)}`}
                                        >
                                            {content.priority_level}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {content.content_type?.replace(/_/g, " ")}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {review.reviewer_role?.replace(/_/g, " ")}
                                        </Badge>
                                    </div>

                                    {/* Time Tracking Section */}
                                    <div className="space-y-2 mb-3">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2 sm:gap-4">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                                Due: <CountdownTimer targetDate={content.target_publish_date} />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 flex-shrink-0" />
                                                Waiting: <ElapsedTime startDate={review.created_date} />
                                            </div>
                                        </div>
                                        
                                        {/* Mini Progress Bar */}
                                        <TimeProgressBar 
                                            createdDate={content.created_date} 
                                            targetDate={content.target_publish_date}
                                            height={3}
                                        />
                                    </div>

                                    <Link to={createPageUrl(`ReviewQueue?content=${content.id}`)}>
                                        <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md h-12 md:h-10">
                                            <FileText className="w-4 h-4 mr-2" />
                                            Review Now
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            );
                        })}

                        {reviews.length > 4 && (
                            <div className="text-center pt-4">
                                <Link to={createPageUrl("ReviewQueue")}>
                                    <Button variant="outline" size="sm" className="glass-effect">
                                        View All {reviews.length} Reviews
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
