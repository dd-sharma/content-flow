import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCommit, FileText, User, Calendar, Eye } from 'lucide-react';
import { format } from "date-fns";

export default function VersionHistory({ versions }) {
    if (!versions || versions.length <= 1) {
        return null;
    }

    return (
        <Card className="glass-effect border-0 shadow-lg mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                    <GitCommit className="w-5 h-5" />
                    Version History
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative pl-6">
                    {/* Timeline line */}
                    <div className="absolute left-[34px] top-2 h-full border-l-2 border-slate-200"></div>
                    
                    <div className="space-y-8">
                        {versions.sort((a,b) => b.version_number - a.version_number).map((version) => (
                            <div key={version.id} className="relative">
                                <div className="absolute -left-[11px] top-1.5 w-6 h-6 bg-blue-500 rounded-full border-4 border-white flex items-center justify-center text-white text-xs font-bold">
                                    {version.version_number}
                                </div>
                                <div className="ml-8">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-slate-800">
                                            Version {version.version_number}
                                        </p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(version.created_date), "MMM d, yyyy 'at' hh:mm a")}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1 mb-2">
                                        {version.change_summary}
                                    </p>
                                    {version.review_feedback && (
                                        <div className="text-xs p-2 bg-amber-50 rounded-md border border-amber-200 text-amber-900">
                                            <span className="font-semibold">Addressed Feedback:</span> {version.review_feedback}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            Uploaded by {version.created_by.split('@')[0]}
                                        </div>
                                        <div className="flex gap-2">
                                            {version.file_urls.map((url, index) => (
                                                <Button 
                                                    key={index}
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => window.open(url, '_blank')}
                                                >
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    View File {version.file_urls.length > 1 ? index + 1 : ''}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}