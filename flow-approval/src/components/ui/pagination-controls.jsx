import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export function PaginationControls({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    itemsPerPage, 
    totalItems,
    loading 
}) {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    if (totalPages <= 1) {
        return null;
    }
    
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 glass-effect rounded-lg border-0 shadow-lg">
            <div className="text-sm text-slate-600">
                Showing {startItem} to {endItem} of {totalItems} items
            </div>
            
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1 || loading}
                    className="glass-effect"
                    title="First page"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="glass-effect"
                    title="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 px-3">
                    <span className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
                
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="glass-effect"
                    title="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages || loading}
                    className="glass-effect"
                    title="Last page"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export function LoadMoreButton({ onLoadMore, hasMore, loading, itemsLoaded }) {
    if (!hasMore) {
        return (
            <div className="text-center py-6">
                <p className="text-sm text-slate-500">All items loaded ({itemsLoaded} total)</p>
            </div>
        );
    }

    return (
        <div className="text-center mt-6">
            <Button
                onClick={onLoadMore}
                disabled={loading}
                variant="outline"
                className="glass-effect shadow-lg"
            >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                    </div>
                ) : (
                    "Load More"
                )}
            </Button>
        </div>
    );
}