import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UploadFile } from "@/api/integrations";
import { Upload, FileText, Image, Video, X } from "lucide-react";

export default function UploadRevisionModal({
    isOpen,
    onClose,
    content,
    onSubmitRevision
}) {
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [changeSummary, setChangeSummary] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const removeFile = (indexToRemove) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };
    
    const getFileIcon = (file) => {
        if (file.type.startsWith('image/')) return Image;
        if (file.type.startsWith('video/')) return Video;
        return FileText;
    };

    const handleSubmit = async () => {
        if (files.length === 0 || !changeSummary.trim()) {
            // Add user feedback for required fields
            return;
        }

        setIsUploading(true);
        try {
            const uploadPromises = files.map(file => UploadFile({ file }));
            const uploadResults = await Promise.all(uploadPromises);
            const fileUrls = uploadResults.map(result => result.file_url);

            await onSubmitRevision(fileUrls, changeSummary);
            
            // Reset form and close
            setFiles([]);
            setChangeSummary("");
            onClose();

        } catch (error) {
            console.error("Failed to upload revision:", error);
        } finally {
            setIsUploading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-effect sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Upload New Version for "{content.title}"</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {/* Previous Feedback */}
                    <div>
                        <Label>Feedback from Reviewers</Label>
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg max-h-32 overflow-y-auto text-sm text-amber-900 space-y-2">
                           {content.allReviews
                                .filter(r => r.content_version === content.version && (r.status === 'revision_requested' || r.status === 'rejected'))
                                .map(r => (
                                    <div key={r.id}>
                                        <span className="font-semibold capitalize">{r.reviewer_role?.replace(/_/g, ' ')}:</span> {r.feedback}
                                    </div>
                                ))
                           }
                        </div>
                    </div>
                    
                    {/* File Upload */}
                    <div>
                        <Label htmlFor="revision-files">Upload Revised Files *</Label>
                        <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400">
                             <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="w-4 h-4 mr-2" />
                                Choose Files
                            </Button>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {files.map((file, index) => {
                                    const FileIcon = getFileIcon(file);
                                    return (
                                        <div key={index} className="flex items-center justify-between p-2 bg-white/50 rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <FileIcon className="w-4 h-4 text-slate-600" />
                                                <span className="text-sm font-medium">{file.name}</span>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    {/* Change Summary */}
                    <div>
                        <Label htmlFor="change-summary">Summary of Changes *</Label>
                        <Textarea
                            id="change-summary"
                            value={changeSummary}
                            onChange={(e) => setChangeSummary(e.target.value)}
                            placeholder="Briefly describe what was updated in this version based on the feedback."
                            className="mt-2 h-24"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isUploading || files.length === 0 || !changeSummary.trim()}
                    >
                        {isUploading ? "Uploading..." : "Submit New Version"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}