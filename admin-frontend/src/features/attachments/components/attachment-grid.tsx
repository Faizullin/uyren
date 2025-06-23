"use client";

import { AttachmentCard } from "@/components/editor/media-gallery/attachment-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Attachment } from "@/types/attachment";
import { IconPlus } from "@tabler/icons-react";
import { FileImage, Download, Trash2 } from "lucide-react";
import Image from "next/image";
import * as React from "react";

interface AttachmentGridProps {
  attachments: Attachment[];
  viewMode: 'grid' | 'list';
  isLoading?: boolean;
  isFiltered?: boolean;
  onSelect: (attachment: Attachment) => void;
  onDelete: (attachment: Attachment) => void;
  onDownload: (attachment: Attachment) => void;
  onUpload?: () => void;
  className?: string;
}

export function AttachmentGrid({
  attachments,
  viewMode,
  isLoading = false,
  isFiltered = false,
  onSelect,
  onDelete,
  onDownload,
  onUpload,
  className,
}: AttachmentGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4 p-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (attachments.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <FileImage className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {isFiltered ? "No attachments found" : "No attachments yet"}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {isFiltered 
            ? "Try adjusting your filters to see more results."
            : "Upload your first file to get started with your media library."
          }
        </p>
        {!isFiltered && onUpload && (
          <Button onClick={onUpload}>
            <IconPlus className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        )}
      </div>
    );
  }

  // Grid view
  if (viewMode === 'grid') {
    return (
      <ScrollArea className={`h-[calc(100vh-300px)] ${className}`}>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {attachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                onSelect={onSelect}
                isSelected={false}
                onRemove={onDelete}
                onDownload={onDownload}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    );
  }

  // List view
  return (
    <ScrollArea className={`h-[calc(100vh-300px)] ${className}`}>
      <div className="p-4 space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onSelect(attachment)}
          >            {/* Thumbnail */}
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0 relative overflow-hidden">
              {attachment.file_type === 'image' && attachment.url ? (
                <Image
                  src={attachment.url}
                  alt={attachment.alt_text || attachment.title || 'Attachment'}
                  fill
                  className="object-cover rounded"
                  onError={() => {
                    // Handle error by showing fallback icon
                  }}
                />
              ) : (
                <FileImage className="w-6 h-6 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">
                {attachment.title || attachment.original_filename || 'Untitled'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {attachment.file_size_human} • {attachment.mime_type}
              </p>
              {attachment.description && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {attachment.description}
                </p>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 shrink-0">
              {attachment.is_featured && (
                <Badge variant="secondary" className="text-xs">
                  Featured
                </Badge>
              )}
              {attachment.is_public && (
                <Badge variant="outline" className="text-xs">
                  Public
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(attachment);
                }}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Download</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(attachment);
                }}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
