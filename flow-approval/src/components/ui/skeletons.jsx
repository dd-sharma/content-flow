import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardStatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <Card key={i} className="glass-effect border-0 shadow-xl">
                    <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-24 skeleton-shimmer" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-20 mb-1 skeleton-shimmer" />
                        <Skeleton className="h-3 w-32 skeleton-shimmer" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function ContentCardSkeleton() {
    return (
        <Card className="glass-effect border-0 shadow-xl">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-20 skeleton-shimmer" />
                            <Skeleton className="h-5 w-24 skeleton-shimmer" />
                        </div>
                        <Skeleton className="h-6 w-3/4 skeleton-shimmer" />
                        <Skeleton className="h-4 w-full skeleton-shimmer" />
                        <Skeleton className="h-4 w-2/3 skeleton-shimmer" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded skeleton-shimmer" />
                </div>
            </CardHeader>
        </Card>
    );
}

export function ReviewCardSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <ContentCardSkeleton key={i} />
            ))}
        </div>
    );
}

export function TableRowSkeleton({ columns = 5 }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="p-4">
                    <Skeleton className="h-4 w-full skeleton-shimmer" />
                </td>
            ))}
        </tr>
    );
}

export function ChartSkeleton() {
    return (
        <Card className="glass-effect border-0 shadow-xl">
            <CardHeader>
                <Skeleton className="h-5 w-48 skeleton-shimmer" />
            </CardHeader>
            <CardContent>
                <div className="h-[300px] flex items-end justify-around gap-2">
                    {[40, 70, 50, 80, 60, 45, 75].map((height, i) => (
                        <Skeleton
                            key={i}
                            className="flex-1 skeleton-shimmer"
                            style={{ height: `${height}%` }}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function NotificationSkeleton() {
    return (
        <div className="p-3 border-b border-slate-100">
            <div className="flex items-start gap-3">
                <Skeleton className="w-2 h-2 rounded-full mt-1.5 skeleton-shimmer" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full skeleton-shimmer" />
                    <Skeleton className="h-3 w-24 skeleton-shimmer" />
                </div>
            </div>
        </div>
    );
}

export function PipelineColumnSkeleton() {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 skeleton-shimmer" />
                <Skeleton className="h-5 w-8 rounded-full skeleton-shimmer" />
            </div>
            <div className="space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white/50">
                        <Skeleton className="h-4 w-full mb-2 skeleton-shimmer" />
                        <div className="flex gap-2">
                            <Skeleton className="h-4 w-16 skeleton-shimmer" />
                            <Skeleton className="h-4 w-20 skeleton-shimmer" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="space-y-8">
            <Card className="glass-effect border-0 shadow-xl">
                <CardHeader>
                    <Skeleton className="h-6 w-32 skeleton-shimmer" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20 skeleton-shimmer" />
                            <Skeleton className="h-10 w-full skeleton-shimmer" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24 skeleton-shimmer" />
                            <Skeleton className="h-10 w-full skeleton-shimmer" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16 skeleton-shimmer" />
                        <Skeleton className="h-24 w-full skeleton-shimmer" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function AnalyticsStatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <Card key={i} className="glass-effect border-0 shadow-lg">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-32 skeleton-shimmer" />
                            <Skeleton className="h-4 w-4 skeleton-shimmer" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-24 skeleton-shimmer" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}