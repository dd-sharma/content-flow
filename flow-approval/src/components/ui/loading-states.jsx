import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingOverlay({ message = "Loading...", show = true }) {
    if (!show) return null;
    
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg"
        >
            <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-slate-700">{message}</span>
            </div>
        </motion.div>
    );
}

export function ButtonLoader({ loading, children, loadingText, className, ...props }) {
    return (
        <Button disabled={loading} className={className} {...props}>
            {loading ? (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {loadingText || "Loading..."}
                </div>
            ) : (
                children
            )}
        </Button>
    );
}

export function ImageWithLoader({ src, alt, className, fallbackIcon: FallbackIcon = FileText }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    
    return (
        <div className={`relative ${className}`}>
            {loading && (
                <div className="absolute inset-0 bg-slate-100 animate-pulse rounded" />
            )}
            {error ? (
                <div className="flex items-center justify-center h-full bg-slate-100 rounded">
                    <FallbackIcon className="w-8 h-8 text-slate-400" />
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setError(true);
                    }}
                    className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                />
            )}
        </div>
    );
}

export function EmptyState({ 
    icon: Icon, 
    title, 
    description, 
    action, 
    actionLabel,
    className = ""
}) {
    return (
        <Card className={`glass-effect border-0 shadow-xl ${className}`}>
            <CardContent className="py-16 text-center">
                <Icon className="w-16 h-16 mx-auto mb-6 text-slate-400" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {title}
                </h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                    {description}
                </p>
                {action && (
                    <Button onClick={action} className="glass-effect">
                        {actionLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export function LoadingTransition({ loading, loadingComponent, children, className = "" }) {
    return (
        <div className={className}>
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {loadingComponent}
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function ProgressiveImage({ src, alt, className, placeholder }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    return (
        <div className={`relative overflow-hidden ${className}`}>
            {placeholder && !imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse" />
            )}
            
            {!imageError && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                />
            )}
            
            {imageError && (
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                </div>
            )}
        </div>
    );
}

export function InlineLoader({ message = "Loading", size = "sm" }) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    };
    
    return (
        <div className="flex items-center gap-2 text-slate-600">
            <div className={`${sizeClasses[size]} border-2 border-slate-400 border-t-transparent rounded-full animate-spin`} />
            <span className="text-sm">{message}...</span>
        </div>
    );
}