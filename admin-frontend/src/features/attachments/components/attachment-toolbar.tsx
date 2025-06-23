"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconSearch } from "@tabler/icons-react";
import {
  FileAudio,
  FileImage,
  FileVideo,
  Filter,
  LayoutGrid,
  List,
  X,
} from "lucide-react";
import * as React from "react";

interface AttachmentToolbarProps {
  // Search
  searchQuery: string;
  onSearchChange: (value: string) => void;
  
  // File type filter
  selectedFileType: string;
  onFileTypeChange: (value: string) => void;
  
  // Boolean filters
  showFeaturedOnly: boolean;
  onFeaturedChange: (value: boolean) => void;
  showPublicOnly: boolean;
  onPublicChange: (value: boolean) => void;
  
  // View mode
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  
  // Stats
  totalCount: number;
  
  // Reset
  onResetFilters: () => void;
  
  // Actions
  onUpload?: () => void;
}

const fileTypeFilters = [
  { label: "All Files", value: "all", icon: Filter },
  { label: "Images", value: "image", icon: FileImage },
  { label: "Videos", value: "video", icon: FileVideo },
  { label: "Audio", value: "audio", icon: FileAudio },
  { label: "Documents", value: "document", icon: FileImage },
];

export function AttachmentToolbar({
  searchQuery,
  onSearchChange,
  selectedFileType,
  onFileTypeChange,
  showFeaturedOnly,
  onFeaturedChange,
  showPublicOnly,
  onPublicChange,
  viewMode,
  onViewModeChange,
  totalCount,
  onResetFilters,
  onUpload,
}: AttachmentToolbarProps) {
  const isFiltered = searchQuery || selectedFileType !== "all" || showFeaturedOnly || showPublicOnly;

  return (
    <div className="space-y-4">
      {/* Primary toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search attachments by title, name, or filename..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        
        {/* File type filter */}
        <Select value={selectedFileType} onValueChange={onFileTypeChange}>
          <SelectTrigger className="w-full sm:w-48 h-10">
            <SelectValue placeholder="File type" />
          </SelectTrigger>
          <SelectContent>
            {fileTypeFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <SelectItem key={filter.value} value={filter.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{filter.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-r-none"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-l-none border-l"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured-filter"
            checked={showFeaturedOnly}
            onCheckedChange={(checked) => onFeaturedChange(checked === true)}
            className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <Label htmlFor="featured-filter" className="text-sm font-medium cursor-pointer">
            Featured only
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="public-filter"
            checked={showPublicOnly}
            onCheckedChange={(checked) => onPublicChange(checked === true)}
            className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <Label htmlFor="public-filter" className="text-sm font-medium cursor-pointer">
            Public only
          </Label>
        </div>

        {isFiltered && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="border-dashed"
          >
            <X className="mr-2 h-4 w-4" />
            Reset filters
          </Button>
        )}

        {/* Stats and actions */}
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {totalCount} file{totalCount !== 1 ? 's' : ''}
          </Badge>
          
          {onUpload && (
            <Button onClick={onUpload} size="sm">
              Upload Files
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
