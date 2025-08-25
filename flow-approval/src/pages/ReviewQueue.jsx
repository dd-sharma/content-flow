
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ContentItem } from "@/api/entities";
import { Review } from "@/api/entities";
import { User } from "@/api/entities";
import { Notification } from "@/api/entities";
import { ContentVersion } from "@/api/entities";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/components/utils";
import { useToast } from "@/components/ui/use-toast";
import { 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    FileText,
    Calendar,
    User as UserIcon,
    Search,
    Filter,
    Download,
    Eye,
    ChevronDown,
    ChevronUp,
    Send,
    ArrowLeft,
    RefreshCw,
    Database 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow, differenceInDays, differenceInHours, isBefore, addDays } from "date-fns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cache } from "@/components/utils/cache";

import ReviewCard from "../components/review/ReviewCard";
import ReviewFilters from "../components/review/ReviewFilters";
import UploadRevisionModal from "../components/review/UploadRevisionModal";
import VersionHistory from "../components/review/VersionHistory";
import ElapsedTime from "../components/ui/elapsed-time";
import { PaginationControls, LoadMoreButton } from "../components/ui/pagination-controls";

import { Skeleton } from "@/components/ui/skeleton";
import { 
    ReviewCardSkeleton,
    ContentCardSkeleton 
} from "@/components/ui/skeletons";
import { LoadingOverlay, LoadingTransition, InlineLoader } from "@/components/ui/loading-states";

export default function ReviewQueue() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [user, setUser] = useState(null);
    const [contentItems, setContentItems] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    
    const [filters, setFilters] = useState({
        priority: "all",
        contentType: "all",
        search: "",
        sortBy: "deadline_soon" 
    });
    const [expandedReview, setExpandedReview] = useState(null);
    const [submittingReview, setSubmittingReview] = useState(null);
    const [allVersions, setAllVersions] = useState([]);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [contentToRevise, setContentToRevise] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
    const { toast } = useToast();

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        action: null,
        contentId: null,
        feedback: "",
        title: "",
        description: ""
    });

    useEffect(() => {
        loadData(1, false);
    }, []);

    // Auto-refresh data every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            loadData(currentPage, false);
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [currentPage]);

    useEffect(() => {
        // Check if we should auto-expand a specific content item
        const contentId = searchParams.get('content');
        if (contentId) {
            setExpandedReview(contentId);
        }
    }, [searchParams, contentItems]);

    const loadData = async (page = 1, isManualRefresh = false, append = false) => {
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const contentLimit = itemsPerPage * 5;
            const reviewLimit = contentLimit * 3;
            const versionLimit = 200;

            if (contentLimit > 100 && !append) {
                toast({
                    title: "Loading Data",
                    description: "Loading review queue, this may take a moment...",
                });
            }

            const [currentUser, allContent, allReviews, versions] = await Promise.all([
                User.me(),
                ContentItem.list("-created_date", contentLimit),
                Review.list("-created_date", reviewLimit),
                ContentVersion.list("-created_date", versionLimit)
            ]);
            
            setUser(currentUser);
            
            if (append) {
                setContentItems(prev => {
                    const existingIds = new Set(prev.map(item => item.id));
                    const newItems = allContent.filter(item => !existingIds.has(item.id));
                    return [...prev, ...newItems];
                });
                
                setReviews(prev => {
                    const existingIds = new Set(prev.map(review => review.id));
                    const newReviews = allReviews.filter(review => !existingIds.has(review.id));
                    return [...prev, ...newReviews];
                });
            } else {
                setContentItems(allContent);
                setReviews(allReviews);
            }
            
            setAllVersions(versions);
            setHasMore(allContent.length >= contentLimit);
            
            if (allContent.length >= contentLimit && !append) {
                toast({
                    title: "Large Dataset",
                    description: `Showing most recent ${contentLimit} items. Use filters to narrow results or load more data.`,
                });
            }

            if (isManualRefresh && !append) {
                toast({
                    title: "Queue Refreshed",
                    description: "The review queue is now up to date.",
                });
            }
        } catch (error) {
            console.error("Error loading review queue data:", error);
            toast({
                title: "Failed to Load Queue",
                description: error.message || "There was an issue fetching the latest review items.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setLastRefreshTime(new Date());
        }
    };

    const loadMoreItems = async () => {
        const nextOffset = contentItems.length;
        setLoadingMore(true);
        
        try {
            const moreContent = await ContentItem.list("-created_date", itemsPerPage, nextOffset);
            const moreReviews = await Review.list("-created_date", itemsPerPage * 3, nextOffset);
            
            if (moreContent.length < itemsPerPage) {
                setHasMore(false);
            }
            
            setContentItems(prev => {
                const existingIds = new Set(prev.map(item => item.id));
                const newItems = moreContent.filter(item => !existingIds.has(item.id));
                return [...prev, ...newItems];
            });
            
            setReviews(prev => {
                const existingIds = new Set(prev.map(review => review.id));
                const newReviews = moreReviews.filter(review => !existingIds.has(review.id));
                return [...prev, ...newReviews];
            });
            
            toast({
                title: "Loaded More Items",
                description: `${moreContent.length} additional items loaded`,
            });
        } catch (error) {
            console.error("Error loading more items:", error);
            toast({
                title: "Error",
                description: "Failed to load more items",
                variant: "destructive",
            });
        } finally {
            setLoadingMore(false);
        }
    };

    const getPendingReviewsForUser = () => {
        if (!user) return [];

        const userPendingReviews = reviews.filter(review => 
            review.reviewer_email === user.email && 
            review.status === "pending"
        );

        const contentWithReviews = userPendingReviews.map(review => {
            const content = contentItems.find(item => item.id === review.content_item_id);
            if (!content || content.version !== review.content_version) return null;

            const allReviewsForContent = reviews.filter(r => r.content_item_id === review.content_item_id);
            const versionsForContent = allVersions.filter(v => v.content_item_id === review.content_item_id);
            
            return {
                ...content,
                myReview: review,
                allReviews: allReviewsForContent,
                versions: versionsForContent
            };
        }).filter(item => item && item.id);

        return sortContentItems(contentWithReviews, filters.sortBy);
    };

    const sortContentItems = (items, sortBy) => {
        const sortedItems = [...items];
        
        switch (sortBy) {
            case "oldest_first":
                return sortedItems.sort((a, b) => 
                    new Date(a.created_date) - new Date(b.created_date)
                );
            
            case "deadline_soon":
                return sortedItems.sort((a, b) => {
                    if (!a.target_publish_date && !b.target_publish_date) return 0;
                    if (!a.target_publish_date) return 1;
                    if (!b.target_publish_date) return -1;
                    
                    return new Date(a.target_publish_date) - new Date(b.target_publish_date);
                });
            
            case "longest_waiting":
                return sortedItems.sort((a, b) => {
                    const aWaitTime = differenceInHours(new Date(), new Date(a.created_date));
                    const bWaitTime = differenceInHours(new Date(), new Date(b.created_date));
                    return bWaitTime - aWaitTime;
                });
            
            case "priority":
            default:
                const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                
                return sortedItems.sort((a, b) => {
                    const priorityDiff = (priorityOrder[b.priority_level] || 2) - (priorityOrder[a.priority_level] || 2);
                    if (priorityDiff !== 0) return priorityDiff;
                    
                    if (!a.target_publish_date && !b.target_publish_date) return 0;
                    if (!a.target_publish_date) return 1;
                    if (!b.target_publish_date) return -1;
                    
                    return new Date(a.target_publish_date) - new Date(b.target_publish_date);
                });
        }
    };

    const getFilteredContent = () => {
        let filtered = getPendingReviewsForUser();

        if (filters.priority !== "all") {
            filtered = filtered.filter(item => item.priority_level === filters.priority);
        }

        if (filters.contentType !== "all") {
            filtered = filtered.filter(item => item.content_type === filters.contentType);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(item => 
                item.title?.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    };

    const handleReviewAction = (contentId, decision, feedback) => {
        const content = contentItems.find(item => item.id === contentId);
        if (!content) {
            console.error("Content not found for review action:", contentId);
            toast({
                title: "Error",
                description: "Content item not found.",
                variant: "destructive"
            });
            return;
        }
        
        if (decision === 'rejected') {
            setConfirmDialog({
                open: true,
                action: decision,
                contentId: contentId,
                feedback: feedback,
                title: "Reject Content?",
                description: `This will reject "${content.title}" and notify the creator. The content will need to be resubmitted from scratch. This action cannot be undone.`
            });
        } else if (decision === 'revision_requested') {
            setConfirmDialog({
                open: true,
                action: decision,
                contentId: contentId,
                feedback: feedback,
                title: "Request Revisions?",
                description: `This will send "${content.title}" back for revisions. The creator will be notified of the required changes and can upload a new version.`
            });
        } else if (decision === 'approved') {
            const allReviewsForContentAndVersion = reviews.filter(review => 
                review.content_item_id === contentId && review.content_version === content.version
            );
            
            const otherReviewersPendingOrRejected = allReviewsForContentAndVersion.some(review => 
                review.reviewer_email !== user.email && (review.status === "pending" || review.status === "rejected" || review.status === "revision_requested")
            );

            if (!otherReviewersPendingOrRejected) {
                setConfirmDialog({
                    open: true,
                    action: 'final_approval',
                    contentId: contentId,
                    feedback: feedback,
                    title: "Final Approval",
                    description: `This is the final approval needed for "${content.title}". The content will be marked as approved and ready for publishing.`
                });
            } else {
                handleReviewSubmit(contentId, decision, feedback);
            }
        }
    };

    const handleReviewSubmit = async (contentId, decision, feedback) => {
        setSubmittingReview(contentId);
        
        toast({
            title: "Submitting Review...",
            description: `Decision: ${decision.replace(/_/g, " ")}`,
        });

        try {
            const content = contentItems.find(item => item.id === contentId);
            const myReview = reviews.find(review => 
                review.content_item_id === contentId && 
                review.reviewer_email === user.email &&
                review.content_version === content.version
            );

            await Review.update(myReview.id, {
                status: decision,
                feedback: feedback,
                reviewed_at: new Date().toISOString(),
                time_to_review_hours: calculateReviewTime(myReview.created_date)
            });

            let newContentStatus = content.status;
            
            if (decision === "rejected") {
                newContentStatus = "rejected";
                await Notification.create({
                    recipient_email: content.created_by,
                    type: "content_rejected",
                    content_item_id: content.id,
                    message: `Your content '${content.title}' was rejected. Feedback: ${feedback}`,
                    action_url: createPageUrl(`Dashboard`)
                });
            } else if (decision === "revision_requested") {
                newContentStatus = "revisions_needed";
                await Notification.create({
                    recipient_email: content.created_by,
                    type: "revision_requested",
                    content_item_id: content.id,
                    message: `Revisions requested for '${content.title}'. Feedback: ${feedback}`,
                    action_url: createPageUrl(`Upload?edit=${content.id}`)
                });
            } else if (decision === "approved") {
                const allReviewsForContentAndVersion = reviews.filter(review => 
                    review.content_item_id === contentId && review.content_version === content.version
                );
                
                const pendingReviews = allReviewsForContentAndVersion.filter(review => 
                    review.id !== myReview.id && review.status === "pending"
                );
                const rejectedReviews = allReviewsForContentAndVersion.filter(review => 
                    review.id !== myReview.id && (review.status === "rejected" || review.status === "revision_requested")
                );
                
                if (pendingReviews.length === 0 && rejectedReviews.length === 0) {
                    newContentStatus = "approved";
                    await Review.update(myReview.id, { is_final_approval: true });
                    
                    await Notification.create({
                        recipient_email: content.created_by,
                        type: "content_approved",
                        content_item_id: content.id,
                        message: `Your content '${content.title}' has been fully approved!`,
                        action_url: createPageUrl(`Dashboard`)
                    });
                }
            }

            if (newContentStatus !== content.status) {
                await ContentItem.update(contentId, { status: newContentStatus });
            }

            // Invalidate cache after review submission
            cache.invalidatePattern('dashboard:*');
            cache.invalidatePattern('content:*');
            cache.invalidatePattern('review:*');

            await loadData(currentPage, true); // Force a refresh of the data
            setExpandedReview(null);
            
            toast({
                title: "Review Submitted!",
                description: "Your feedback has been recorded.",
                variant: "success"
            });
            
        } catch (error) {
            console.error("Error submitting review:", error);
            toast({
                title: "Submission Failed",
                description: error.message || "Could not submit your review. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSubmittingReview(null);
        }
    };

    const calculateReviewTime = (createdDate) => {
        const created = new Date(createdDate);
        const now = new Date();
        return Math.round((now - created) / (1000 * 60 * 60));
    };

    const handleOpenRevisionModal = (content) => {
        setContentToRevise(content);
        setShowRevisionModal(true);
    };

    const handleSubmitRevision = async (fileUrls, changeSummary) => {
        if (!contentToRevise) return;
        
        toast({
            title: "Submitting Revision...",
            description: "Please wait while we process your changes.",
        });

        try {
            const newVersionNumber = contentToRevise.version + 1;

            const feedbackFromReviewers = contentToRevise.allReviews
                .filter(r => r.content_version === contentToRevise.version && (r.status === 'revision_requested' || r.status === 'rejected'))
                .map(r => `${r.reviewer_role?.replace(/_/g, ' ')}: ${r.feedback}`)
                .join('\n');

            await ContentVersion.create({
                content_item_id: contentToRevise.id,
                version_number: newVersionNumber,
                file_urls: fileUrls,
                change_summary: changeSummary,
                review_feedback: feedbackFromReviewers
            });
            
            await ContentItem.update(contentToRevise.id, {
                version: newVersionNumber,
                file_urls: fileUrls,
                status: 'in_review'
            });

            const originalReviewers = [...new Set(
                contentToRevise.allReviews
                    .filter(r => r.content_version === contentToRevise.version)
                    .map(r => ({ email: r.reviewer_email, role: r.reviewer_role }))
            )];

            for (const reviewer of originalReviewers) {
                await Review.create({
                    content_item_id: contentToRevise.id,
                    content_version: newVersionNumber,
                    reviewer_email: reviewer.email,
                    reviewer_role: reviewer.role,
                    status: 'pending'
                });

                await Notification.create({
                    recipient_email: reviewer.email,
                    type: 'revision_requested',
                    content_item_id: contentToRevise.id,
                    message: `A new version of "${contentToRevise.title}" is ready for your review.`,
                    action_url: createPageUrl(`ReviewQueue?content=${contentToRevise.id}`)
                });
            }

            // Invalidate cache after revision
            cache.invalidatePattern('dashboard:*');
            cache.invalidatePattern('content:*');
            cache.invalidatePattern('review:*');

            await loadData(currentPage, true); // Force a refresh
            setShowRevisionModal(false);
            setContentToRevise(null);

            toast({
                title: "Revision Submitted!",
                description: "Your revised content has been uploaded and reviewers re-notified.",
                variant: "success",
            });

        } catch (error) {
            console.error("Error submitting revision:", error);
            toast({
                title: "Revision Failed",
                description: error.message || "Could not submit your revision. Please try again.",
                variant: "destructive",
            });
        }
    };

    const filteredContent = getFilteredContent();

    if (loading && reviews.length === 0) {
        return (
            <div className="space-y-8">
                {/* Header Skeleton */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 skeleton-shimmer" />
                        <Skeleton className="h-5 w-96 skeleton-shimmer" />
                        <Skeleton className="h-4 w-48 skeleton-shimmer" />
                    </div>
                    <Skeleton className="h-10 w-32 skeleton-shimmer" />
                </div>

                {/* Filters Skeleton */}
                <Card className="glass-effect border-0 shadow-xl">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-10 w-full skeleton-shimmer" />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Review Cards Skeleton */}
                <ReviewCardSkeleton />
            </div>
        );
    }

    return (
        <LoadingTransition
            loading={false}
            loadingComponent={<ReviewCardSkeleton />}
            className="space-y-8"
        >
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Review Queue</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <p className="text-slate-600">
                            {filteredContent.length} item{filteredContent.length !== 1 ? 's' : ''} awaiting your review
                        </p>
                        {contentItems.length > filteredContent.length && (
                            <Badge variant="outline" className="w-fit">
                                <Database className="w-3 h-3 mr-1" />
                                {contentItems.length} total loaded
                            </Badge>
                        )}
                        {filters.sortBy !== "priority" && (
                            <span className="text-sm text-slate-500">
                                (sorted by {filters.sortBy.replace(/_/g, " ")})
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                        <span>Last updated: <ElapsedTime startDate={lastRefreshTime} /></span>
                        <Button size="icon" variant="ghost" onClick={() => loadData(currentPage, true)} className="w-6 h-6 rounded-full" disabled={loading}>
                            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
                
                <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl("Dashboard"))}
                    className="glass-effect"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </div>

            {/* Filters */}
            <ReviewFilters 
                filters={filters}
                onFiltersChange={setFilters}
                contentItems={contentItems}
            />

            {/* Review Queue */}
            {filteredContent.length === 0 ? (
                <Card className="glass-effect border-0 shadow-xl">
                    <CardContent className="py-16 text-center">
                        <CheckCircle className="w-16 h-16 mx-auto mb-6 text-emerald-500 opacity-50" />
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">All caught up!</h3>
                        <p className="text-slate-600 mb-6">
                            {filters.priority !== "all" || filters.contentType !== "all" || filters.search
                                ? "No content matches your current filters."
                                : "No content is currently awaiting your review."
                            }
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={() => setFilters({ priority: "all", contentType: "all", search: "", sortBy: "priority" })}
                                className="glass-effect"
                            >
                                Clear Filters
                            </Button>
                            {hasMore && (
                                <Button
                                    variant="outline"
                                    onClick={loadMoreItems}
                                    disabled={loadingMore}
                                    className="glass-effect"
                                >
                                    {loadingMore ? (
                                        <InlineLoader message="Loading" size="sm" />
                                    ) : (
                                        <>
                                            <Database className="w-4 h-4 mr-2" />
                                            Load More Data
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="space-y-6">
                        {filteredContent.map((content) => (
                            <div key={content.id} className="relative">
                                <LoadingOverlay 
                                    show={submittingReview === content.id} 
                                    message="Submitting review..." 
                                />
                                <ReviewCard
                                    content={content}
                                    user={user}
                                    expanded={expandedReview === content.id}
                                    onToggleExpanded={() => setExpandedReview(
                                        expandedReview === content.id ? null : content.id
                                    )}
                                    onSubmitReview={handleReviewAction}
                                    submitting={submittingReview === content.id}
                                    onUploadRevision={() => handleOpenRevisionModal(content)}
                                />
                                {expandedReview === content.id && (
                                    <VersionHistory versions={content.versions} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Load More Button */}
                    <LoadMoreButton
                        onLoadMore={loadMoreItems}
                        hasMore={hasMore}
                        loading={loadingMore}
                        itemsLoaded={contentItems.length}
                    />
                </>
            )}
            
            {contentToRevise && (
                <UploadRevisionModal
                    isOpen={showRevisionModal}
                    onClose={() => setShowRevisionModal(false)}
                    content={contentToRevise}
                    onSubmitRevision={handleSubmitRevision}
                />
            )}

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                title={confirmDialog.title}
                description={confirmDialog.description}
                actionLabel={
                    confirmDialog.action === 'rejected' ? "Reject Content" :
                    confirmDialog.action === 'revision_requested' ? "Request Revisions" :
                    confirmDialog.action === 'final_approval' ? "Approve for Publishing" :
                    "Continue"
                }
                variant={
                    confirmDialog.action === 'rejected' ? "destructive" :
                    confirmDialog.action === 'revision_requested' ? "warning" :
                    confirmDialog.action === 'final_approval' ? "success" :
                    "default"
                }
                loading={submittingReview === confirmDialog.contentId}
                onConfirm={() => {
                    const actualAction = confirmDialog.action === 'final_approval' ? 'approved' : confirmDialog.action;
                    handleReviewSubmit(
                        confirmDialog.contentId,
                        actualAction,
                        confirmDialog.feedback
                    );
                    setConfirmDialog({ open: false, action: null, contentId: null, feedback: "", title: "", description: "" });
                }}
            />
        </LoadingTransition>
    );
}
