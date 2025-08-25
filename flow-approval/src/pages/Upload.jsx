
import React, { useState, useRef, useEffect } from "react";
import { ContentItem } from "@/api/entities";
import { Review } from "@/api/entities";
import { User } from "@/api/entities";
import { Notification } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { getReviewersForContent } from "@/components/config/reviewerConfig";
import {
    Upload as UploadIcon,
    FileText,
    Image,
    Video,
    Paperclip,
    X,
    Calendar,
    DollarSign,
    AlertTriangle,
    CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormSkeleton } from "@/components/ui/skeletons";
import { LoadingTransition, ButtonLoader } from "@/components/ui/loading-states";

// Inlined utility functions to bypass import issues
const createPageUrl = (pageName) => {
    return `/${pageName.toLowerCase()}`;
};

const calculatePriority = (targetDate) => {
    if (!targetDate) return 'medium';
    const now = new Date();
    const publishDate = new Date(targetDate);
    const diffDays = Math.ceil((publishDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'high';
    if (diffDays <= 7) return 'medium';
    return 'low';
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

class CacheManager {
    constructor() { this.cache = new Map(); this.timers = new Map(); this.pendingRequests = new Map(); }
    set(key, value, ttl = 300000) { if (this.timers.has(key)) { clearTimeout(this.timers.get(key)); } this.cache.set(key, { value, timestamp: Date.now(), ttl }); if (ttl > 0) { const timer = setTimeout(() => this.delete(key), ttl); this.timers.set(key, timer); } }
    get(key) { const item = this.cache.get(key); if (!item) return null; if (item.ttl > 0 && Date.now() - item.timestamp > item.ttl) { this.delete(key); return null; } return item.value; }
    delete(key) { this.cache.delete(key); if (this.timers.has(key)) { clearTimeout(this.timers.get(key)); this.timers.delete(key); } }
    invalidatePattern(pattern) { const regex = new RegExp(pattern.replace(/\*/g, '.*')); const keysToDelete = []; this.cache.forEach((_, key) => { if (regex.test(key)) { keysToDelete.push(key); } }); keysToDelete.forEach(key => this.delete(key)); }
    async query(key, apiCall, ttl) { if (this.pendingRequests.has(key)) { return this.pendingRequests.get(key); } const cachedValue = this.get(key); if (cachedValue !== null) { return Promise.resolve(cachedValue); } const promise = apiCall().finally(() => { this.pendingRequests.delete(key); }); this.pendingRequests.set(key, promise); try { const result = await promise; this.set(key, result, ttl); return result; } catch (error) { throw error; } }
}
const cache = new CacheManager();


// File constraints
const FILE_CONSTRAINTS = {
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
    allowedTypes: [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mpeg', 'video/quicktime',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    allowedExtensions: [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mpeg', '.mov',
        '.pdf', '.doc', '.docx', '.ppt', '.pptx'
    ]
};

export default function Upload() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        content_type: "",
        custom_type: "",
        target_publish_date: "",
        estimated_spend: "",
        mentions_competitors: false,
        department: "",
        files: []
    });
    const [errors, setErrors] = useState({});
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Navigation guard for unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            const hasContent = formData.title?.trim() ||
                              formData.description?.trim() ||
                              formData.files.length > 0 ||
                              formData.content_type ||
                              formData.target_publish_date ||
                              (formData.estimated_spend !== "" && parseFloat(formData.estimated_spend) !== 0) ||
                              formData.department?.trim();

            if (hasContent && !uploading) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [formData, uploading]);

    const contentTypes = [
        { value: "blog_post", label: "Blog Post", icon: FileText },
        { value: "social_media_post", label: "Social Media Post", icon: Image },
        { value: "email_campaign", label: "Email Campaign", icon: FileText },
        { value: "ad_creative", label: "Ad Creative", icon: Image },
        { value: "press_release", label: "Press Release", icon: FileText },
        { value: "custom", label: "Custom Type", icon: Paperclip }
    ];

    const validateField = (name, value) => {
        const newErrors = { ...errors };

        switch (name) {
            case 'title':
                if (!value || value.trim().length < 3) newErrors.title = "Title must be at least 3 characters long.";
                else if (value.length > 200) newErrors.title = "Title must be less than 200 characters.";
                else delete newErrors.title;
                break;
            case 'description':
                if (value && value.length > 1000) newErrors.description = "Description must be less than 1000 characters.";
                else delete newErrors.description;
                break;
            case 'content_type':
                if (!value) newErrors.content_type = "Content type is required.";
                else delete newErrors.content_type;
                if (value !== 'custom') delete newErrors.custom_type; // Clear custom type error if content type changes
                break;
            case 'custom_type':
                if (formData.content_type === "custom" && !value.trim()) newErrors.custom_type = "Custom type is required.";
                else delete newErrors.custom_type;
                break;
            case 'target_publish_date':
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize to start of day
                if (!value) {
                    newErrors.target_publish_date = "Target publish date is required.";
                } else {
                    const selectedDate = new Date(value);
                    selectedDate.setHours(0,0,0,0); // Normalize selected date
                    if (selectedDate < today) newErrors.target_publish_date = "Target publish date cannot be in the past.";
                    else delete newErrors.target_publish_date;
                }
                break;
            case 'estimated_spend':
                const spendValue = parseFloat(value);
                if (value && isNaN(spendValue)) {
                    newErrors.estimated_spend = "Estimated spend must be a number.";
                } else if (spendValue < 0) {
                    newErrors.estimated_spend = "Estimated spend cannot be negative.";
                } else if (spendValue > 10000000) {
                    newErrors.estimated_spend = "Spend seems too high. Please verify.";
                } else {
                    delete newErrors.estimated_spend;
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
        // Returns true if no error for this field
        return !newErrors[name];
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value}));
        validateField(id, value);
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({...prev, [name]: value}));
        validateField(name, value);
    };

    const handleCheckboxChange = (name, checked) => {
        setFormData(prev => ({...prev, [name]: checked}));
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
        // Clear the file input value to allow selecting the same files again if needed
        e.target.value = '';
    };

    const addFiles = (newFiles) => {
        const validationMessages = [];
        const validFiles = [];

        newFiles.forEach(file => {
            const currentTotalFiles = formData.files.length + validFiles.length;
            if (currentTotalFiles >= FILE_CONSTRAINTS.maxFiles) {
                if (!validationMessages.includes(`Maximum ${FILE_CONSTRAINTS.maxFiles} files allowed.`)) {
                    validationMessages.push(`Maximum ${FILE_CONSTRAINTS.maxFiles} files allowed.`);
                }
            } else if (file.size > FILE_CONSTRAINTS.maxSize) {
                validationMessages.push(`File "${file.name}" exceeds ${FILE_CONSTRAINTS.maxSize / 1024 / 1024}MB limit.`);
            } else if (!FILE_CONSTRAINTS.allowedTypes.includes(file.type)) {
                validationMessages.push(`File type of "${file.name}" is not supported. Allowed types include: ${FILE_CONSTRAINTS.allowedExtensions.join(', ')}.`);
            } else {
                validFiles.push(file);
            }
        });

        if (validationMessages.length > 0) {
            toast({
                title: "File Upload Issues",
                description: validationMessages.join(" "),
                variant: "destructive",
            });
        }

        if(validFiles.length > 0) {
            setFormData(prev => ({
                ...prev,
                files: [...prev.files, ...validFiles]
            }));
             toast({
                title: "Files Added",
                description: `${validFiles.length} valid file(s) added successfully.`,
            });
            // Clear file-related errors if we successfully add files
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.files;
                return newErrors;
            });
        }
    };

    const removeFile = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            files: prev.files.filter((_, index) => index !== indexToRemove)
        }));
         // Re-validate files if necessary after removal, especially if it brings count below max
         setErrors(prev => {
            const newErrors = {...prev};
            // Check if 'files' error needs to be re-added or removed
            if (prev.files.length - 1 === 0) { // If no files left after removal
                newErrors.files = "At least one file must be uploaded.";
            } else if (newErrors.files && (prev.files.length - 1) < FILE_CONSTRAINTS.maxFiles) {
                // If there was a max files error and now count is below max
                 delete newErrors.files;
            }
            return newErrors;
         });
    };

    const getFileIcon = (file) => {
        if (file.type.startsWith('image/')) return Image;
        if (file.type.startsWith('video/')) return Video;
        return FileText;
    };

    const validateForm = () => {
        const newErrors = {};

        // Title validation
        if (!formData.title || formData.title.trim().length < 3) newErrors.title = "Title must be at least 3 characters long.";
        if (formData.title.length > 200) newErrors.title = "Title must be less than 200 characters.";

        // Description validation
        if (formData.description && formData.description.length > 1000) newErrors.description = "Description must be less than 1000 characters.";

        // Content type validation
        if (!formData.content_type) newErrors.content_type = "Content type is required.";
        if (formData.content_type === "custom" && !formData.custom_type.trim()) newErrors.custom_type = "Custom type is required.";

        // Date validation
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        const publishDate = new Date(formData.target_publish_date);
        publishDate.setHours(0,0,0,0); // Normalize selected date
        if (!formData.target_publish_date) newErrors.target_publish_date = "Target publish date is required.";
        else if (publishDate < today) newErrors.target_publish_date = "Target publish date cannot be in the past.";

        // Estimated spend validation
        const spendValue = parseFloat(formData.estimated_spend);
        if (formData.estimated_spend && isNaN(spendValue)) {
            newErrors.estimated_spend = "Estimated spend must be a number.";
        } else if (spendValue < 0) {
            newErrors.estimated_spend = "Estimated spend cannot be negative.";
        } else if (spendValue > 10000000) {
            newErrors.estimated_spend = "Spend seems too high. Please verify.";
        }

        // File validation
        if (formData.files.length === 0) newErrors.files = "At least one file must be uploaded.";
        else if (formData.files.length > FILE_CONSTRAINTS.maxFiles) newErrors.files = `Maximum ${FILE_CONSTRAINTS.maxFiles} files allowed.`;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast({
                title: "Validation Failed",
                description: "Please fix the errors shown on the form before submitting.",
                variant: "destructive",
            });
            // Scroll to the first error
            const firstErrorField = document.querySelector('.border-red-500');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setErrors({}); // Clear errors
        setUploading(true);
        setUploadProgress(0);

        toast({
            title: "Submitting Content...",
            description: "Please wait while we upload your files and set up the review process.",
        });

        try {
            // Upload files
            const fileUrls = [];
            for (let i = 0; i < formData.files.length; i++) {
                const file = formData.files[i];
                setUploadProgress((i / formData.files.length) * 50);

                const uploadResult = await UploadFile({ file });
                fileUrls.push(uploadResult.file_url);
            }

            setUploadProgress(75);

            // Determine approval deadline
            const approvalDeadline = new Date(formData.target_publish_date);
            approvalDeadline.setDate(approvalDeadline.getDate() - 1);

            // Create content item
            const contentData = {
                title: formData.title,
                description: formData.description,
                content_type: formData.content_type,
                custom_type: formData.content_type === "custom" ? formData.custom_type : "",
                target_publish_date: formData.target_publish_date,
                estimated_spend: parseFloat(formData.estimated_spend) || 0,
                mentions_competitors: formData.mentions_competitors,
                department: formData.department,
                file_urls: fileUrls,
                status: "in_review",
                priority_level: calculatePriority(formData.target_publish_date),
                approval_deadline: approvalDeadline.toISOString(),
                version: 1
            };

            const createdContent = await ContentItem.create(contentData);

            // Get all users for reviewer assignment
            let allUsers = [];
            try {
                allUsers = await User.list();
            } catch (error) {
                console.warn("Could not fetch all users, using fallback assignment:", error);
                const currentUser = await User.me();
                if (currentUser && currentUser.email) {
                    allUsers = [{ ...currentUser, user_role: "admin" }];
                } else {
                    allUsers = [];
                }
            }

            // Use dynamic reviewer assignment
            const assignReviewersToContent = async (contentItem) => {
                try {
                    let reviewerEmails = await getReviewersForContent(contentItem, allUsers);

                    if (reviewerEmails.length === 0) {
                        console.warn("No reviewers found for content using configuration rules, assigning to current user.");
                        const currentUser = await User.me();
                        if (currentUser && currentUser.email) {
                            reviewerEmails.push(currentUser.email);
                        } else {
                            console.error("Could not assign any reviewers: no rules matched and no current user found.");
                            toast({
                                title: "Warning: No Reviewers Assigned",
                                description: "Content uploaded but no reviewers could be assigned. Please assign manually.",
                                variant: "destructive",
                            });
                            return;
                        }
                    }

                    // Calculate urgency for notification messages
                    const publishDateObj = new Date(contentItem.target_publish_date);
                    const todayObj = new Date();
                    todayObj.setHours(0,0,0,0);
                    const daysUntilPublish = Math.ceil(
                        (publishDateObj.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    let urgencyPrefix = "";
                    if (daysUntilPublish <= 1) {
                        urgencyPrefix = "🚨 URGENT: ";
                    } else if (daysUntilPublish <= 3) {
                        urgencyPrefix = "⚠️ Priority: ";
                    }

                    // Create Review records and Notifications for each reviewer
                    const assignedReviewers = [];

                    for (const email of reviewerEmails) {
                        // Find the user to get their role
                        const user = allUsers.find(u => u.email === email);
                        const role = user?.user_role || "reviewer";

                        assignedReviewers.push(email);

                        // Create Review record
                        await Review.create({
                            content_item_id: contentItem.id,
                            content_version: 1,
                            reviewer_email: email,
                            reviewer_role: role,
                            status: "pending",
                            feedback: "",
                            reviewed_at: null,
                            time_to_review_hours: 0,
                            is_final_approval: false
                        });

                        // Create Notification for the reviewer with urgency prefix
                        await Notification.create({
                            recipient_email: email,
                            type: "new_review",
                            content_item_id: contentItem.id,
                            message: `${urgencyPrefix}New content '${contentItem.title}' requires your review.`,
                            action_url: createPageUrl(`ReviewQueue?content=${contentItem.id}`)
                        });
                    }

                    // Update ContentItem with current reviewers
                    await ContentItem.update(contentItem.id, {
                        current_reviewers: assignedReviewers
                    });

                    toast({
                        title: "Reviewers Assigned",
                        description: `${assignedReviewers.length} reviewer(s) have been notified.`,
                    });

                } catch (error) {
                    console.error("Error assigning reviewers:", error);
                    toast({
                        title: "Warning: Reviewer Assignment Failed",
                        description: "Content uploaded but reviewer assignment failed. Please notify reviewers manually.",
                        variant: "destructive",
                    });
                }
            };

            // Call the reviewer assignment function
            await assignReviewersToContent(createdContent);

            setUploadProgress(100);

            // Invalidate cache to show new content
            cache.invalidatePattern('dashboard:*');
            cache.invalidatePattern('content:*');
            cache.invalidatePattern('review:*');

            toast({
                title: "Content Submitted Successfully!",
                description: "Your content is now in the review queue.",
                variant: "success",
            });

            // Success - redirect to dashboard
            setTimeout(() => {
                navigate(createPageUrl("Dashboard"));
            }, 1000);

        } catch (error) {
            console.error("Error uploading content:", error);
            toast({
                title: "Upload Failed",
                description: error.message || "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const isFormValid = () => {
        // Form is valid if there are no errors in the `errors` state
        // and all required fields have some value (even if that value might be invalid,
        // `validateForm` will catch it on submit, `validateField` on change/blur)
        return Object.keys(errors).length === 0 &&
               formData.title &&
               formData.content_type &&
               formData.target_publish_date &&
               formData.files.length > 0 &&
               (formData.content_type !== "custom" || formData.custom_type.trim() !== "");
    };

    // Filter out errors that are empty strings or null
    const summaryErrors = Object.values(errors).filter(error => error);

    const handleCancel = () => {
        const hasContent = formData.title?.trim() ||
                          formData.description?.trim() ||
                          formData.files.length > 0 ||
                          formData.content_type ||
                          formData.target_publish_date ||
                          (formData.estimated_spend !== "" && parseFloat(formData.estimated_spend) !== 0) ||
                          formData.department?.trim();

        if (hasContent && !uploading) {
            setShowExitConfirm(true);
        } else {
            navigate(createPageUrl("Dashboard"));
        }
    };

    return (
        <LoadingTransition
            loading={uploading}
            loadingComponent={<FormSkeleton />}
            className="max-w-4xl mx-auto space-y-8"
        >
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload New Content</h1>
                <p className="text-slate-600">
                    Submit your content for review and approval by the team
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Global Error Summary */}
                {summaryErrors.length > 0 && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Please fix the following {summaryErrors.length} error(s):</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                {summaryErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Basic Information */}
                <Card className="glass-effect border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-slate-800">Content Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="title">Content Title *</Label>
                                    <span className="text-xs text-slate-500">{formData.title.length} / 200</span>
                                </div>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    onBlur={handleInputChange}
                                    placeholder="Enter a descriptive title"
                                    className={`mt-2 ${errors.title ? 'border-red-500' : ''}`}
                                    maxLength="200"
                                    required
                                />
                                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <Label htmlFor="department">Department/Team</Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    onBlur={handleInputChange}
                                    placeholder="e.g. Marketing, Communications"
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        <div>
                             <div className="flex justify-between items-center">
                                <Label htmlFor="description">Description</Label>
                                <span className="text-xs text-slate-500">{formData.description.length} / 1000</span>
                            </div>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                onBlur={handleInputChange}
                                placeholder="Brief description of the content and its purpose"
                                className={`mt-2 h-24 ${errors.description ? 'border-red-500' : ''}`}
                                maxLength="1000"
                            />
                            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label>Content Type *</Label>
                                <Select
                                    value={formData.content_type}
                                    onValueChange={(value) => handleSelectChange("content_type", value)}
                                    required
                                >
                                    <SelectTrigger className={`mt-2 ${errors.content_type ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder="Select content type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contentTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                <div className="flex items-center gap-2">
                                                    <type.icon className="w-4 h-4" />
                                                    {type.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.content_type && <p className="text-sm text-red-600 mt-1">{errors.content_type}</p>}
                            </div>

                            {formData.content_type === "custom" && (
                                <div>
                                    <Label htmlFor="custom_type">Custom Type *</Label>
                                    <Input
                                        id="custom_type"
                                        value={formData.custom_type}
                                        onChange={handleInputChange}
                                        onBlur={handleInputChange}
                                        placeholder="Specify your custom content type"
                                        className={`mt-2 ${errors.custom_type ? 'border-red-500' : ''}`}
                                        required={formData.content_type === "custom"}
                                    />
                                    {errors.custom_type && <p className="text-sm text-red-600 mt-1">{errors.custom_type}</p>}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Publishing Information */}
                <Card className="glass-effect border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-slate-800">Publishing Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="target_publish_date" className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Target Publish Date *
                                </Label>
                                <Input
                                    id="target_publish_date"
                                    type="date"
                                    value={formData.target_publish_date}
                                    onChange={handleInputChange}
                                    onBlur={handleInputChange}
                                    className={`mt-2 ${errors.target_publish_date ? 'border-red-500' : ''}`}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                                {errors.target_publish_date && <p className="text-sm text-red-600 mt-1">{errors.target_publish_date}</p>}
                                {formData.target_publish_date && !errors.target_publish_date && (
                                    <div className="mt-2">
                                        <Badge className={`text-xs ${
                                            calculatePriority(formData.target_publish_date) === "urgent" ? "bg-red-100 text-red-700" :
                                            calculatePriority(formData.target_publish_date) === "high" ? "bg-orange-100 text-orange-700" :
                                            calculatePriority(formData.target_publish_date) === "medium" ? "bg-blue-100 text-blue-700" :
                                            "bg-slate-100 text-slate-700"
                                        }`}>
                                            {calculatePriority(formData.target_publish_date).toUpperCase()} PRIORITY
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="estimated_spend" className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Estimated Marketing Spend
                                </Label>
                                <Input
                                    id="estimated_spend"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.estimated_spend}
                                    onChange={handleInputChange}
                                    onBlur={handleInputChange}
                                    placeholder="0.00"
                                    className={`mt-2 ${errors.estimated_spend ? 'border-red-500' : ''}`}
                                />
                                {errors.estimated_spend && <p className="text-sm text-red-600 mt-1">{errors.estimated_spend}</p>}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="mentions_competitors"
                                checked={formData.mentions_competitors}
                                onCheckedChange={(checked) => handleCheckboxChange("mentions_competitors", checked)}
                            />
                            <Label htmlFor="mentions_competitors" className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                This content mentions competitors
                            </Label>
                        </div>
                    </CardContent>
                </Card>

                {/* File Upload */}
                <Card className="glass-effect border-0 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-slate-800">Upload Files *</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                                dragActive
                                    ? "border-blue-400 bg-blue-50"
                                    : errors.files ? "border-red-500 bg-red-50/50" : "border-slate-300 hover:border-slate-400"
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                                accept={FILE_CONSTRAINTS.allowedTypes.join(',')}
                            />

                            <div className="space-y-4">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                    <UploadIcon className="w-8 h-8 text-blue-600" />
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        Drop files here or click to browse
                                    </h3>
                                    <p className="text-slate-500 mt-1 text-xs">
                                        {`Up to ${FILE_CONSTRAINTS.maxFiles} files, ${FILE_CONSTRAINTS.maxSize / (1024 * 1024)}MB each.`}
                                        <br />
                                        {`Allowed types: ${FILE_CONSTRAINTS.allowedExtensions.join(', ')}`}
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="glass-effect"
                                >
                                    Choose Files
                                </Button>
                            </div>
                        </div>

                        {errors.files && <p className="text-sm text-red-600 mt-2 text-center">{errors.files}</p>}

                        {/* File List */}
                        {formData.files.length > 0 && (
                            <div className="mt-6 space-y-3">
                                <h4 className="font-semibold text-slate-800">Uploaded Files ({formData.files.length})</h4>
                                {formData.files.map((file, index) => {
                                    const FileIcon = getFileIcon(file);
                                    return (
                                        <div key={file.name + index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <FileIcon className="w-5 h-5 text-slate-600" />
                                                <div>
                                                    <p className="font-medium text-slate-800">{file.name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFile(index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={uploading}
                        className="glass-effect"
                    >
                        Cancel
                    </Button>

                    <ButtonLoader
                        type="submit"
                        loading={uploading}
                        loadingText="Uploading..."
                        disabled={!isFormValid()}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg min-w-32"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit for Review
                    </ButtonLoader>
                </div>

                {uploading && (
                    <Card className="glass-effect border-0 shadow-xl">
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700">
                                        Uploading content...
                                    </span>
                                    <span className="text-sm text-slate-500">
                                        {uploadProgress.toFixed(0)}%
                                    </span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </form>

            {/* Exit Confirmation Dialog */}
            <ConfirmDialog
                open={showExitConfirm}
                onOpenChange={setShowExitConfirm}
                title="Discard Changes?"
                description="You have unsaved changes that will be lost. Are you sure you want to leave without submitting your content?"
                actionLabel="Discard Changes"
                cancelLabel="Continue Editing"
                variant="warning"
                onConfirm={() => navigate(createPageUrl("Dashboard"))}
            />
        </LoadingTransition>
    );
}
