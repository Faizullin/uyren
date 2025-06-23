"use client";

import { Heading } from '@/components/common/heading';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import DeleteConfirmDialog from '@/components/resource/delete-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDataTable } from '@/hooks/use-data-table';
import { IconPlus } from '@tabler/icons-react';
import React, { useMemo } from 'react';
import { WorkspaceConfig } from './types';
import { useWorkspaceContext } from './workspace-context';
import { generateTableColumns } from './workspace-table';

interface WorkspaceListPageProps {
  config: WorkspaceConfig;
  children?: React.ReactNode;
}

export function WorkspaceListPage({ config, children }: WorkspaceListPageProps) {
  const { workspace, actions, state } = useWorkspaceContext();

  // Generate table columns from config
  const columns = useMemo(() => {
    return generateTableColumns(
      config.table.columns,
      (action, row) => {
        switch (action) {
          case 'edit':
            actions.openEdit(row);
            break;
          case 'view':
            actions.openView(row);
            break;
          case 'delete':
            actions.openDelete(row);
            break;
          default:
            // Find the custom action from config
            const customAction = config.actions?.find(a => a.key === action);
            if (customAction) {
              actions.executeCustomAction(customAction, row);
            }
        }
      },
      config.table.selectable
    );
  }, [config.table.columns, config.table.selectable, config.actions, actions]);

  // Calculate page count
  const pageCount = useMemo(() => {
    return Math.ceil(workspace.totalCount / workspace.pageSize);
  }, [workspace.totalCount, workspace.pageSize]);  // Create data table with filtering enabled
  const { table } = useDataTable({
    data: workspace.data,
    columns,
    pageCount,
    initialState: {
      sorting: config.table.defaultSort ? [{
        id: config.table.defaultSort.field,
        desc: config.table.defaultSort.order === 'desc'
      }] : [],
      columnPinning: { right: ['actions'] },
    },
    getRowId: (row) => `${(row as any)[config.api.idField]}`,
    enableColumnFilters: true,
  });
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (state.currentAction.item) {
      await workspace.delete((state.currentAction.item as any)[config.api.idField]);
      state.setCurrentAction((prev: any) => ({ ...prev, isOpen: false }));
    }
  };

  if (workspace.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">Error loading {config.title.toLowerCase()}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {workspace.error.message}
          </p>
          <Button variant="outline" onClick={workspace.refresh}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title={config.title}
          description={config.description}
        />
        <div className="flex items-center gap-2">
          {config.permissions?.create !== false && (
            <Button onClick={actions.openCreate}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create {config.title.slice(0, -1)}
            </Button>
          )}
        </div>
      </div>
      <Separator />      <div className="data-table-container">
        {workspace.isLoading ? (
          <DataTableSkeleton
            columnCount={config.table.columns.length}
            rowCount={8}
            filterCount={config.filters?.length || 0}
          />
        ) : (
          <>
            <DataTableToolbar table={table} />
            <DataTable table={table} />
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={state.currentAction.isOpen && state.currentAction.type === 'delete'}
        onOpenChange={() => state.setCurrentAction((prev: any) => ({ ...prev, isOpen: false }))}
        onConfirm={handleDeleteConfirm}
      />

      {/* Custom children (forms, dialogs, etc.) */}
      {children}
    </>
  );
}
