
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ArrowUpDown } from "lucide-react";

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    
    return debouncedValue;
}

export default function ReviewFilters({ filters, onFiltersChange, contentItems }) {
    const [searchTerm, setSearchTerm] = useState(filters.search);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Effect to update parent's filters when debounced search term changes
    useEffect(() => {
        // Only update if the debounced term is different from the current filter's search term
        // This prevents unnecessary re-renders if the debounced value hasn't actually changed relevantly
        if (debouncedSearchTerm !== filters.search) {
            onFiltersChange(prev => ({...prev, search: debouncedSearchTerm}));
        }
    }, [debouncedSearchTerm, onFiltersChange, filters.search]); // Added filters.search and onFiltersChange to dependencies for correctness

    const priorityOptions = [
        { value: "all", label: "All Priorities" },
        { value: "urgent", label: "Urgent" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" }
    ];

    const contentTypeOptions = [
        { value: "all", label: "All Types" },
        { value: "blog_post", label: "Blog Post" },
        { value: "social_media_post", label: "Social Media" },
        { value: "email_campaign", label: "Email Campaign" },
        { value: "ad_creative", label: "Ad Creative" },
        { value: "press_release", label: "Press Release" },
        { value: "custom", label: "Custom" }
    ];

    const sortOptions = [
        { value: "priority", label: "Priority" },
        { value: "oldest_first", label: "Oldest First" },
        { value: "deadline_soon", label: "Deadline Soon" },
        { value: "longest_waiting", label: "Longest Waiting" }
    ];

    // This handleFilterChange is for select inputs, not for the debounced search
    const handleFilterChange = (key, value) => {
        onFiltersChange(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <Card className="glass-effect border-0 shadow-xl">
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder="Search by title or description..."
                            value={searchTerm} // Controlled by local state for debouncing
                            onChange={(e) => setSearchTerm(e.target.value)} // Updates local state immediately
                            className="pl-10 glass-effect"
                        />
                    </div>

                    {/* Priority Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <Select
                            value={filters.priority}
                            onValueChange={(value) => handleFilterChange("priority", value)}
                        >
                            <SelectTrigger className="glass-effect">
                                <SelectValue placeholder="Filter by priority" />
                            </SelectTrigger>
                            <SelectContent>
                                {priorityOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Content Type Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <Select
                            value={filters.contentType}
                            onValueChange={(value) => handleFilterChange("contentType", value)}
                        >
                            <SelectTrigger className="glass-effect">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                {contentTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-slate-500" />
                        <Select
                            value={filters.sortBy}
                            onValueChange={(value) => handleFilterChange("sortBy", value)}
                        >
                            <SelectTrigger className="glass-effect">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
