import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to the console for debugging
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error });
    }

    render() {
        if (this.state.hasError) {
            // Render a user-friendly fallback UI
            return (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
                    <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800">Something went wrong.</h1>
                    <p className="text-slate-600 mt-2 mb-6">
                        An unexpected error occurred. Please try reloading the page.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        Reload Page
                    </Button>
                    {this.state.error && (
                        <details className="mt-4 text-left bg-slate-100 p-4 rounded-lg w-full max-w-2xl">
                            <summary className="cursor-pointer font-medium text-slate-700">Error Details</summary>
                            <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap">
                                {this.state.error.toString()}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;