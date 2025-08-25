import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Info, Trash2, CheckCircle } from 'lucide-react';

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    actionLabel = "Continue",
    cancelLabel = "Cancel",
    onConfirm,
    variant = "default", // "default", "destructive", "warning", "success"
    loading = false
}) {
    const icons = {
        default: <Info className="w-5 h-5 text-blue-600" />,
        destructive: <Trash2 className="w-5 h-5 text-red-600" />,
        warning: <AlertTriangle className="w-5 h-5 text-orange-600" />,
        success: <CheckCircle className="w-5 h-5 text-emerald-600" />
    };
    
    const actionColors = {
        default: "bg-blue-600 hover:bg-blue-700",
        destructive: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        warning: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
        success: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
    };
    
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="glass-effect border-0 shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-slate-800">
                        {icons[variant]}
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-600 leading-relaxed">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel 
                        disabled={loading}
                        className="glass-effect border-slate-300"
                    >
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={loading}
                        className={`${actionColors[variant]} text-white shadow-lg`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                            </div>
                        ) : (
                            actionLabel
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Hook for easier confirmation dialogs
export function useConfirmDialog() {
    const [state, setState] = React.useState({
        open: false,
        title: "",
        description: "",
        actionLabel: "Continue",
        variant: "default",
        onConfirm: null
    });

    const confirm = React.useCallback(({
        title,
        description,
        actionLabel = "Continue",
        variant = "default",
        onConfirm
    }) => {
        return new Promise((resolve) => {
            setState({
                open: true,
                title,
                description,
                actionLabel,
                variant,
                onConfirm: () => {
                    onConfirm?.();
                    resolve(true);
                    setState(prev => ({ ...prev, open: false }));
                }
            });
        });
    }, []);

    const dialog = (
        <ConfirmDialog
            open={state.open}
            onOpenChange={(open) => setState(prev => ({ ...prev, open }))}
            title={state.title}
            description={state.description}
            actionLabel={state.actionLabel}
            variant={state.variant}
            onConfirm={state.onConfirm}
        />
    );

    return { confirm, dialog };
}