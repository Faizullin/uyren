import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NiceModal, { NiceModalHocPropsExtended } from "@/contexts/nice-modal-context";
import { AttachmentGrid } from '@/features/attachments/components/attachment-grid';
import { AttachmentToolbar } from '@/features/attachments/components/attachment-toolbar';
import { showToast } from '@/lib/error-handler';
import { AttachmentService } from '@/services/attachment-service';
import { Attachment } from '@/types/attachment';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Library,
    Upload,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface MediaLibraryDialogConfig {
    initialFileType?: Attachment["file_type"] | "all";
    initialPost?: number | string;
    initialFeatured?: boolean;
    initialPublic?: boolean;
}

interface MediaLibraryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInsert?: (attachment: Attachment) => void;
    config?: MediaLibraryDialogConfig;
}

const getFileTypeFromMimeType = (fileType: Attachment["file_type"]): string => {
    if (fileType === "image") return "image";
    else if (fileType === "video") return "video";
    else if (fileType === "audio") return "audio";
    return "document";
};

export function MediaLibraryDialog({ open, onOpenChange, onInsert, config }: MediaLibraryDialogProps) {
    const [activeTab, setActiveTab] = useState("attachments");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [selectedFileType, setSelectedFileType] = useState<string>(config?.initialFileType || "all");
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(config?.initialFeatured || false);
    const [showPublicOnly, setShowPublicOnly] = useState(config?.initialPublic || false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [dragActive, setDragActive] = useState(false);

    // File upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    // Reset filters when dialog opens with new config
    useEffect(() => {
        if (open && config) {
            setSelectedFileType(config.initialFileType || "all");
            setShowFeaturedOnly(config.initialFeatured || false);
            setShowPublicOnly(config.initialPublic || false);
            setSearchQuery("");
        }
    }, [open, config]);    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Query for attachments with filtering
    const { data: attachmentsData, isLoading } = useQuery({
        queryKey: ['attachments', debouncedSearchQuery, selectedFileType, showFeaturedOnly, showPublicOnly, config?.initialPost],
        queryFn: () => {
            // Build query parameters including config
            const filters: Record<string, any> = {};

            // Apply config-based filters first
            if (config?.initialPost) {
                filters.post = config.initialPost;
            }

            // Apply user-selected filters
            if (debouncedSearchQuery.trim()) {
                filters.search = debouncedSearchQuery;
            }

            if (selectedFileType !== "all") {
                filters.file_type = selectedFileType;
            }

            if (showFeaturedOnly) {
                filters.is_featured = true;
            }

            if (showPublicOnly) {
                filters.is_public = true;
            }

            return AttachmentService.listAttachments(1, 20, filters);
        },
        enabled: open,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 3,
    });// Upload attachment mutation
    const uploadMutation = useMutation({
        mutationFn: (file: File) => AttachmentService.uploadAttachment(file),
        onSuccess: () => {
            showToast("success", { message: "File uploaded successfully!" });
            queryClient.invalidateQueries({ queryKey: ['attachments'] });
            setSelectedFile(null);
            setSelectedFileType("all");
            setActiveTab("attachments");
        },
        onError: (error) => {
            console.error('Upload error:', error);
            showToast("error", { message: "Failed to upload file." });
        },
        onSettled: () => {
            setIsUploading(false);
            setUploadProgress(0);
        },
    });

    // Delete attachment mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => AttachmentService.deleteAttachment(id),
        onSuccess: () => {
            showToast("success", { message: "Attachment deleted successfully!" });
            queryClient.invalidateQueries({ queryKey: ['attachments'] });
        },
        onError: (error) => {
            console.error('Delete error:', error);
            showToast("error", { message: "Failed to delete attachment." });
        },
    });

    // Download attachment mutation
    const downloadMutation = useMutation({
        mutationFn: (id: number) => AttachmentService.downloadAttachment(id),
        onSuccess: (blob, id) => {
            const attachment = attachmentsData?.results.find((a: Attachment) => a.id === id);
            if (attachment) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = attachment.original_filename || attachment.name;
                a.click();
                URL.revokeObjectURL(url);
                showToast("success", { message: "File downloaded successfully!" });
            }
        },
        onError: (error) => {
            console.error('Download error:', error);
            showToast("error", { message: "Failed to download file." });
        },
    });    // Process and filter attachments using data table logic
    const processedMedia = useMemo(() => {
        if (!attachmentsData?.results) return [];

        let filtered = attachmentsData.results;

        // Note: Post filtering is handled at the API level via query parameters
        // The config.initialPost is passed to the API query

        // Apply search filter (using debounced query) - this is now handled at API level
        // but we keep client-side for immediate feedback
        if (debouncedSearchQuery.trim()) {
            const query = debouncedSearchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.name && item.name.toLowerCase().includes(query)) ||
                (item.original_filename && item.original_filename.toLowerCase().includes(query))
            );
        }

        // Apply file type filter - this is now handled at API level
        // but we keep client-side for immediate feedback
        if (selectedFileType !== "all") {
            filtered = filtered.filter(item => {
                const fileType = getFileTypeFromMimeType(item.file_type || "");
                return fileType === selectedFileType;
            });
        }

        // Apply featured filter - this is now handled at API level
        // but we keep client-side for immediate feedback
        if (showFeaturedOnly) {
            filtered = filtered.filter(item => item.is_featured);
        }

        // Apply public filter - this is now handled at API level
        // but we keep client-side for immediate feedback
        if (showPublicOnly) {
            filtered = filtered.filter(item => item.is_public);
        }

        return filtered;
    }, [attachmentsData?.results, debouncedSearchQuery, selectedFileType, showFeaturedOnly, showPublicOnly]);    // Reset filters function (similar to data table logic)
    const resetFilters = useCallback(() => {
        setSearchQuery("");
        setSelectedFileType(config?.initialFileType || "all");
        setShowFeaturedOnly(config?.initialFeatured || false);
        setShowPublicOnly(config?.initialPublic || false);
        setViewMode('grid');
    }, [config]);

    // Event handlers
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleFileTypeChange = useCallback((value: string) => {
        setSelectedFileType(value);
    }, []);

    const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
        setViewMode(mode);
    }, []);

    const handleSelectMedia = useCallback((media: Attachment) => {
        if (onInsert) {
            onInsert(media);
            onOpenChange(false);
        }
    }, [onInsert, onOpenChange]);

    const handleDeleteMedia = useCallback(async (media: Attachment) => {
        if (!confirm("Are you sure you want to delete this media file?")) {
            return;
        }
        deleteMutation.mutate(media.id);
    }, [deleteMutation]); const handleDownloadMedia = useCallback((media: Attachment) => {
        downloadMutation.mutate(media.id);
    }, [downloadMutation]);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    }, []);

    const handleUpload = useCallback(async () => {
        if (!selectedFile) {
            showToast("error", { message: "Please select a file to upload" });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return prev;
                }
                return prev + 10;
            });
        }, 200);

        uploadMutation.mutate(selectedFile);
    }, [selectedFile, uploadMutation]);

    // Drag and drop handlers
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    }, []); const formatFileSize = useCallback((bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }, []); 
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-7xl h-[85vh] overflow-hidden bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm border-0 shadow-2xl">
                <DialogHeader className="hidden">
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                    <div className="w-full mb-4 pr-5">
                        <TabsList className="grid grid-cols-2 bg-gray-50/80 rounded-lg p-1 shrink-0">
                            <TabsTrigger
                                value="attachments"
                                className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                            >
                                <Library className="h-4 w-4 mr-2" />
                                Attachments
                            </TabsTrigger>
                            <TabsTrigger
                                value="upload"
                                className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                            </TabsTrigger>
                        </TabsList>
                    </div>                    <TabsContent value="attachments" className="flex flex-col h-full space-y-4 mt-0">
                        {/* Toolbar Section */}
                        <div className="shrink-0">
                            <AttachmentToolbar
                                searchQuery={searchQuery}
                                onSearchChange={handleSearch}
                                selectedFileType={selectedFileType}
                                onFileTypeChange={handleFileTypeChange}
                                showFeaturedOnly={showFeaturedOnly}
                                onFeaturedChange={setShowFeaturedOnly}
                                showPublicOnly={showPublicOnly}
                                onPublicChange={setShowPublicOnly}
                                viewMode={viewMode}
                                onViewModeChange={handleViewModeChange}
                                totalCount={attachmentsData?.results?.length || 0}
                                onResetFilters={resetFilters}
                                onUpload={() => setActiveTab("upload")}
                            />
                        </div>

                        {/* Media Grid */}
                        <div className="flex-1 overflow-hidden">
                            <AttachmentGrid
                                attachments={processedMedia}
                                viewMode={viewMode}
                                isLoading={isLoading}
                                isFiltered={Boolean(debouncedSearchQuery || selectedFileType !== "all" || showFeaturedOnly || showPublicOnly)}
                                onSelect={handleSelectMedia}
                                onDelete={handleDeleteMedia}
                                onDownload={handleDownloadMedia}
                                onUpload={() => setActiveTab("upload")}
                                className="h-full"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="upload" className="flex flex-col h-full mt-0">
                        <ScrollArea className="flex-1 h-full">
                            <div className="p-6">
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 bg-gradient-to-br from-white to-gray-50/30 ${dragActive
                                        ? "border-blue-400 bg-blue-50/50"
                                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/30"
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileSelect}
                                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />

                                    <div className="space-y-4">
                                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-blue-600" />
                                        </div>

                                        <div>
                                            <p className="text-lg font-semibold text-gray-900 mb-2">
                                                Drop files here or click to browse
                                            </p>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Support for images, documents, videos, and more
                                            </p>

                                            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                                                Choose Files
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {selectedFile && (
                                    <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <h4 className="font-medium mb-2 text-blue-900">Selected File</h4>
                                        <div className="flex items-center justify-between">
                                            <span className="truncate flex-1 mr-2 text-sm">
                                                {selectedFile.name}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {formatFileSize(selectedFile.size)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {isUploading && (
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Uploading...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <Button
                                        onClick={handleUpload}
                                        disabled={!selectedFile || isUploading}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Upload className="h-4 w-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Upload File
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setUploadProgress(0);
                                        }}
                                        disabled={isUploading}
                                    >
                                        Clear
                                    </Button>
                                </div>

                                <div className="mt-6 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                                    <h4 className="text-sm font-medium text-blue-900 mb-2">Upload Guidelines</h4>
                                    <ul className="text-xs text-blue-700 space-y-1">
                                        <li>• Maximum file size: 50MB per file</li>
                                        <li>• Supported formats: Images, Documents, Videos, Audio, Archives</li>
                                        <li>• Files are automatically organized by type</li>
                                    </ul>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

export const MediaLibraryNiceDialog = NiceModal.create<
    NiceModalHocPropsExtended<{
        args: Omit<MediaLibraryDialogProps, 'open' | 'onInsert'>;
    }>>(({ args }) => {
        const modal = NiceModal.useModal();
        const handleOpenChange = useCallback((open: boolean) => {
            if (!open) {
                modal.hide();
            }
            args.onOpenChange?.(open);
        }, [args, modal]);
        const handleInsert = useCallback((attachment: Attachment) => {
            modal.resolve({
                result: {
                    record: attachment,
                }
            })
        }, [modal]);
        return (
            <MediaLibraryDialog
                {...args}
                open={modal.visible}
                onOpenChange={handleOpenChange}
                onInsert={handleInsert}
            />
        )
    });