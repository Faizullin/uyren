"use client"

import Image from "next/image"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { showToast } from "@/lib/error-handler"
import { cn } from "@/lib/utils"
import type { Attachment } from "@/types/attachment"
import { Download, FileIcon, FileText, ImageIcon, Music, Trash2, Video } from "lucide-react"

interface AttachmentCardProps {
    attachment: Attachment
    onSelect: (attachment: Attachment) => void
    isSelected: boolean
    onRemove: (obj: Attachment) => void
    onDownload: (obj: Attachment) => void
}

export function AttachmentCard({ attachment, onSelect, isSelected, onRemove, onDownload }: AttachmentCardProps) {
    const getIconForFileType = (fileType: Attachment["file_type"]) => {
        switch (fileType) {
            case "image":
                return <ImageIcon className="size-8 text-muted-foreground" />
            case "document":
                return <FileText className="size-8 text-muted-foreground" />
            case "video":
                return <Video className="size-8 text-muted-foreground" />
            case "audio":
                return <Music className="size-8 text-muted-foreground" />
            default:
                return <FileIcon className="size-8 text-muted-foreground" />
        }
    }

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card selection
        onDownload(attachment)
        showToast("info", {
            message: `Downloading ${attachment.original_filename}...`,
        })
    }

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card selection
        onRemove(attachment)
        showToast("success", {
            message: `${attachment.original_filename} removed.`,
        })
    }

    return (
        <Card
            className={cn(
                " relative cursor-pointer transition-all hover:shadow-md",
                isSelected && "border-primary ring-2 ring-primary",
            )}
            onClick={() => onSelect(attachment)}
        >
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">                {attachment.file_type === "image" ? (
                    <div className="relative h-24 w-full overflow-hidden rounded-md mb-2">
                        <Image
                            src={attachment.url || "/placeholder.svg"}
                            alt={attachment.alt_text || attachment.title}
                            fill
                            style={{ objectFit: "cover" }}
                            className="group-hover:scale-105 transition-transform duration-200"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized={attachment.url?.startsWith('data:') || attachment.url?.includes('blob:')}
                        />
                    </div>
                ) : (
                    <div className="h-24 w-full flex items-center justify-center mb-2">
                        {getIconForFileType(attachment.file_type)}
                    </div>
                )}
                <p className="text-sm font-medium truncate w-full">{attachment.original_filename}</p>
                <p className="text-xs text-muted-foreground">{attachment.file_size_human}</p>
            </CardContent>
            <div className="absolute top-1 right-1 flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:bg-background/80 hover:text-foreground"
                    onClick={handleDownload}
                    title="Download"
                >
                    <Download className="size-4" />
                    <span className="sr-only">Download</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:bg-background/80 hover:text-destructive"
                    onClick={handleRemove}
                    title="Remove"
                >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Remove</span>
                </Button>
            </div>
        </Card>
    )
}
