import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    FileText, 
    Image, 
    Video, 
    Clock, 
    Calendar,
    AlertTriangle,
    Users,
    MessageSquare,
    Eye
} from "lucide-react";
import CountdownTimer from "@/components/ui/countdown-timer";
import TimeProgressBar from "@/components/ui/time-progress-bar";
import ElapsedTime from "@/components/ui/elapsed-time";

const getFileIcon = (fileUrl) => {
    if (!fileUrl) return FileText;
    const extension = fileUrl.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return Image;
    if (['mp4', 'mov', 'avi', 'mpeg'].includes(extension)) return Video;
    return FileText;
};

const formatRole = (role) => {
    return role?.replace(/_/g, ' ') || 'Unknown';
};

export default function ReviewCard({ contentItem, onSelect, onUploadRevision }) {
    const FileIcon = getFileIcon(contentItem.file_urls?.[0]);
    
    const priorityConfig = useMemo(() => ({
        urgent: {
            badge: "bg-red-100 text-red-700 border-red-200",
            border: "border-red-400 hover:border-red-500",
            icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
            pulse: "animate-pulse"
        },
        high: {
            badge: "bg-orange-100 text-orange-700 border-orange-200",
            border: "border-orange-300 hover:border-orange-400",
            icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
        },
        medium: {
            badge: "bg-blue-100 text-blue-700 border-blue-200",
            border: "border-slate-200 hover:border-blue-400",
        },
        low: {
            badge: "bg-slate-100 text-slate-700 border-slate-200",
            border: "border-slate-200 hover:border-slate-300",
        },
    }[contentItem.priority_level] || {}), [contentItem.priority_level]);

    const myReview = contentItem.myReview;
    const isRevisionNeeded = contentItem.status === 'revisions_needed' && contentItem.created_by === 'user@example.com'; // Replace with actual user check

    return (
        <Card className={`glass-effect shadow-lg w-full transition-all duration-300 ${priorityConfig.border}`}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">
                        {contentItem.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs capitalize ${priorityConfig.badge}`}>
                            {contentItem.priority_level} Priority
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                            {contentItem.content_type?.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <FileIcon className="w-3 h-3" />
                            {contentItem.file_urls?.length || 0} file(s)
                        </Badge>
                    </div>
                </div>
                {priorityConfig.icon && (
                    <div className={`flex-shrink-0 ${priorityConfig.pulse}`}>{priorityConfig.icon}</div>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-slate-600 line-clamp-3">
                    {contentItem.description}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: <CountdownTimer targetDate={contentItem.target_publish_date} />
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Waiting: <ElapsedTime startDate={contentItem.created_date} />
                        </div>
                    </div>
                    <TimeProgressBar
                        createdDate={contentItem.created_date}
                        targetDate={contentItem.target_publish_date}
                    />
                </div>

                <div className="border-t border-slate-200 pt-3">
                    <h4 className="text-xs font-semibold text-slate-500 mb-2">Review Status</h4>
                    <div className="space-y-2">
                        {contentItem.allReviews?.map(review => (
                             <div key={review.id} className="flex items-center justify-between text-sm">
                                <span className="text-slate-700 capitalize">{formatRole(review.reviewer_role)}</span>
                                <Badge variant={
                                    review.status === 'approved' ? 'success' :
                                    review.status === 'rejected' ? 'destructive' :
                                    review.status === 'revision_requested' ? 'warning' :
                                    'outline'
                                }>
                                    {review.status?.replace(/_/g, ' ')}
                                </Badge>
                             </div>
                        ))}
                    </div>
                </div>

            </CardContent>
            <CardFooter className="flex justify-between gap-2 bg-slate-50/50 p-4">
                 {isRevisionNeeded ? (
                    <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md"
                        onClick={() => onUploadRevision(contentItem)}
                    >
                        <MessageSquare className="w-4 h-4 mr-2"/>
                        Upload New Version
                    </Button>
                 ) : (
                    <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
                        onClick={() => onSelect(contentItem)}
                        disabled={myReview?.status !== 'pending'}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        {myReview?.status === 'pending' ? 'Review Now' : `Status: ${myReview?.status}`}
                    </Button>
                 )}
            </CardFooter>
        </Card>
    );
}