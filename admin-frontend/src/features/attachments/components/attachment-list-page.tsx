"use client";

import { Heading } from "@/components/common/heading";
import { MediaLibraryDialog } from "@/components/editor/media-gallery/media-library-dialog";
import DeleteConfirmDialog from "@/components/resource/delete-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { showToast } from '@/lib/error-handler';
import { AttachmentService } from "@/services/attachment-service";
import { Attachment } from "@/types/attachment";
import { IconPlus } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, List } from "lucide-react";
import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AttachmentGrid } from "./attachment-grid";
import { AttachmentToolbar } from "./attachment-toolbar";

// Enhanced action types for better state management
type AttachmentActionType = 'upload' | 'delete' | 'view';

interface AttachmentAction {
    type: AttachmentActionType;
    attachment?: Attachment;
    isOpen: boolean;
}

export default function AttachmentListPage() {
    const queryClient = useQueryClient();

    // URL state management with debounced search
    const [searchQuery, setSearchQuery] = useQueryState("search", parseAsString.withDefault(""));
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [selectedFileType, setSelectedFileType] = useQueryState("file_type", parseAsString.withDefault("all"));
    const [showFeaturedOnly, setShowFeaturedOnly] = useQueryState("featured", parseAsBoolean.withDefault(false));
    const [showPublicOnly, setShowPublicOnly] = useQueryState("public", parseAsBoolean.withDefault(false));
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Enhanced state management for different actions
    const [currentAction, setCurrentAction] = useState<AttachmentAction>({
        type: 'upload',
        attachment: undefined,
        isOpen: false,
    });

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Build query parameters for API call
    const queryParams = useMemo(() => {
        const params: Record<string, string | boolean> = {};
        if (debouncedSearchQuery) {
            params.search = debouncedSearchQuery;
        }
        if (selectedFileType !== "all") {
            params.file_type = selectedFileType;
        }
        if (showFeaturedOnly) {
            params.is_featured = true;
        }
        if (showPublicOnly) {
            params.is_public = true;
        }
        return params;
    }, [debouncedSearchQuery, selectedFileType, showFeaturedOnly, showPublicOnly]);    // Fetch attachments
    const {
        data: attachmentsData,
        isLoading,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ["attachments", queryParams],
        queryFn: () => AttachmentService.listAttachments(1, 20, queryParams),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 3,
    });

    // Enhanced delete mutation with better error handling
    const deleteMutation = useMutation({
        mutationFn: (id: Attachment["id"]) => AttachmentService.deleteAttachment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attachments"] });
            closeAction();
            showToast("success", {
                message: `Attachment deleted successfully`,
            });
        },
        onError: (error) => {
            console.error('Delete error:', error);
            showToast("error", {
                message: 'Failed to delete attachment. Please try again.',
            });
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
    });

    // Process and filter attachments
    const processedAttachments = useMemo(() => {
        if (!attachmentsData?.results) return [];
        return attachmentsData.results;
    }, [attachmentsData?.results]);

    // Action handlers with enhanced logic
    const openUploadDialog = useCallback(() => {
        setCurrentAction({
            type: 'upload',
            attachment: undefined,
            isOpen: true,
        });
    }, []);

    const openDeleteDialog = useCallback((attachment: Attachment) => {
        setCurrentAction({
            type: 'delete',
            attachment,
            isOpen: true,
        });
    }, []);

    const closeAction = useCallback(() => {
        setCurrentAction(prev => ({
            ...prev,
            isOpen: false,
        }));
    }, []);

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback(async () => {
        if (currentAction.attachment) {
            deleteMutation.mutate(currentAction.attachment.id);
        }
    }, [currentAction.attachment, deleteMutation]);

    const handleDownload = useCallback((attachment: Attachment) => {
        downloadMutation.mutate(attachment.id);
    }, [downloadMutation]);

    const handleSelect = useCallback((attachment: Attachment) => {
        // Could open a preview modal or navigate to detail page
        console.log('Selected attachment:', attachment);
    }, []);

    // Reset filters
    const resetFilters = useCallback(() => {
        setSearchQuery("");
        setSelectedFileType("all");
        setShowFeaturedOnly(false);
        setShowPublicOnly(false);
    }, [setSearchQuery, setSelectedFileType, setShowFeaturedOnly, setShowPublicOnly]);

    const isFiltered = Boolean(searchQuery || selectedFileType !== "all" || showFeaturedOnly || showPublicOnly);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="text-red-500 text-center">
                    <h3 className="text-lg font-semibold mb-2">Error loading attachments</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {error instanceof Error ? error.message : "Something went wrong"}
                    </p>
                    <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                        {isFetching ? "Retrying..." : "Try Again"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className='flex items-start justify-between'>
                <Heading
                    title='Media Library'
                    description='Manage your media files with advanced filtering and organization.'
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    >
                        {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                    </Button>
                    <Button onClick={openUploadDialog}>
                        <IconPlus className='mr-2 h-4 w-4' />
                        Upload Files
                    </Button>
                </div>
            </div>
            <Separator />

            {/* Enhanced Toolbar */}
            <div className="bg-muted/30 rounded-lg p-4">
                <AttachmentToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedFileType={selectedFileType}
                    onFileTypeChange={setSelectedFileType}
                    showFeaturedOnly={showFeaturedOnly}
                    onFeaturedChange={setShowFeaturedOnly}
                    showPublicOnly={showPublicOnly}
                    onPublicChange={setShowPublicOnly}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    totalCount={processedAttachments.length}
                    onResetFilters={resetFilters}
                />
            </div>

            {/* Content Area */}
            <div className="flex-1">
                <AttachmentGrid
                    attachments={processedAttachments}
                    viewMode={viewMode}
                    isLoading={isLoading}
                    isFiltered={isFiltered}
                    onSelect={handleSelect}
                    onDelete={openDeleteDialog}
                    onDownload={handleDownload}
                    onUpload={openUploadDialog}
                />
            </div>

            {/* Enhanced Upload Dialog */}
            <MediaLibraryDialog
                open={currentAction.isOpen && currentAction.type === 'upload'}
                onOpenChange={(open) => !open && closeAction()}
                onInsert={() => {
                    queryClient.invalidateQueries({ queryKey: ["attachments"] });
                    closeAction();
                }}
            />

            {/* Enhanced Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={currentAction.isOpen && currentAction.type === 'delete'}
                onOpenChange={closeAction}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}
