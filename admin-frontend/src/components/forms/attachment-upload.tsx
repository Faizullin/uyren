"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { showComponentNiceDialog } from "@/lib/nice-dialog";
import { cn } from "@/lib/utils";
import { Attachment } from "@/types/attachment";
import { File, FileImage, FileText, FileVideo, Upload } from "lucide-react";
import { useCallback } from "react";
import { MediaLibraryNiceDialog } from "../editor/media-gallery/media-library-dialog";


interface AttachmentUploadProps {
    /** Upload endpoint URL - can include dynamic course_id */
    uploadEndpoint: string;
    /** Accepted file types */
    acceptedFileTypes?: {
        [key: string]: string[];
    };
    /** Maximum file size in bytes */
    maxFileSize?: number;
    /** Maximum number of files */
    maxFiles?: number;
    /** Allow multiple file uploads */
    multiple?: boolean;
    /** Callback when files are uploaded successfully */
    onUploadSuccess?: (files: Attachment[]) => void;
    /** Callback when upload fails */
    onUploadError?: (error: string) => void;
    /** Show upload progress */
    showProgress?: boolean;
    /** Custom styling */
    className?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Upload area label */
    label?: string;
    /** Upload area description */
    description?: string;

    trasnformToBody: (data: FormData) => FormData;
}

const defaultAcceptedTypes = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
};

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return FileImage;
    if (fileType.startsWith('video/')) return FileVideo;
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return FileText;
    return File;
};

const getFileTypeCategory = (mimeType: string): Attachment['file_type'] => {
    if (mimeType.startsWith('image')) return 'image';
    if (mimeType.startsWith('video')) return 'video';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return 'other';
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function AttachmentUpload({
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 5,
    multiple = true,
    className,
    disabled = false,
    label = "Upload Files",
    description = "Drag and drop files here or click to browse",
    onUploadSuccess,
}: AttachmentUploadProps) {

    const handleUplaod = useCallback(() => {
        return showComponentNiceDialog<{
            record: Attachment;
        }>(MediaLibraryNiceDialog, {
            args: {
                config: {
                    initialFileType: "image",
                }
            }
        }).then((result) => {
            if (result && result.result.record) {
                onUploadSuccess?.([result.result.record]);
            }
        });
    }, [onUploadSuccess]);


    return (
        <div className={cn("space-y-4", className)}>
            {/* Upload Area */}
            <Card className={cn(
                "border-2 border-dashed transition-colors cursor-pointer",
                "border-border hover:border-primary/50",
            )}
                onClick={handleUplaod}>
                <CardContent className="p-6">
                    <div className="text-center space-y-4">
                        <input />
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium">{label}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Max file size: {formatFileSize(maxFileSize)} • Max files: {maxFiles}
                            </p>
                        </div>
                        {!disabled && (
                            <Button variant="outline" size="sm" type="button">
                                Browse Files
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
