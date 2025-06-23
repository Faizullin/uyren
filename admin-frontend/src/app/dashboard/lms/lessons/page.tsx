'use client';

import PageContainer from "@/components/common/page-container";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  WorkspaceBulkActions,
  WorkspaceConfig,
  WorkspaceEditSheetLegacy as WorkspaceEditSheet,
  WorkspaceGridView,
  WorkspaceListPage,
  WorkspaceProvider
} from "@/components/workspace";
import { BookOpen, Grid3X3, Table as TableIcon, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

// Import the lessons configuration
import lessonsConfigData from "./lessons.json";

// Type the configuration
const lessonsConfig = lessonsConfigData as WorkspaceConfig;

export default function LessonsPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'table' | 'grid'>('table');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lessons Management</h1>
            <p className="text-muted-foreground">
              Create and manage educational lessons for your LMS platform.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              LMS Module
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-card">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Lessons</p>
              <p className="text-2xl font-bold">247</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-lg bg-card">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">189</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-lg bg-card">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">23</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <WorkspaceProvider config={lessonsConfig}>
          <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)} className="flex-1">
            {/* Tab Controls */}
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4" />
                  Table View
                </TabsTrigger>
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Grid View
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="mb-4">
                <WorkspaceBulkActions
                  config={lessonsConfig}
                  selectedIds={selectedIds}
                  onClearSelection={() => setSelectedIds([])}
                />
              </div>
            )}

            {/* Table View */}
            <TabsContent value="table" className="space-y-4">
              <WorkspaceListPage config={lessonsConfig} />
            </TabsContent>

            {/* Grid View */}
            <TabsContent value="grid" className="space-y-4">
              <WorkspaceGridView
                config={lessonsConfig}
                data={[]} // In a real app, this would come from the workspace hook
                onSelectItem={(item) => {
                  const itemId = item[lessonsConfig.api?.idField || 'id'];
                  setSelectedIds(prev =>
                    prev.includes(itemId)
                      ? prev.filter(id => id !== itemId)
                      : [...prev, itemId]
                  );
                }}
                selectedIds={selectedIds}
                viewMode="grid"
              />
            </TabsContent>
          </Tabs>          {/* Edit Sheet */}
          <WorkspaceEditSheet
            config={lessonsConfig}
          />
        </WorkspaceProvider>
      </div>
    </PageContainer>
  );
}

