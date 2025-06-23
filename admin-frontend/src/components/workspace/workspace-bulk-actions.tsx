'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Archive, Tag, Mail, Download, Copy, MoreHorizontal } from 'lucide-react';
import { WorkspaceConfig, WorkspaceAction } from './types';
import { useWorkspaceActions } from './workspace-context';

interface WorkspaceBulkActionsProps {
  config: WorkspaceConfig;
  selectedIds: string[];
  onClearSelection: () => void;
}

export function WorkspaceBulkActions({
  config,
  selectedIds,
  onClearSelection,
}: WorkspaceBulkActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { executeBulkAction } = useWorkspaceActions();

  const bulkActions = config.actions?.filter(action => action.bulk) || [];
  
  if (selectedIds.length === 0) {
    return null;
  }

  const handleBulkAction = async (action: WorkspaceAction) => {
    setActionLoading(action.key);
    try {
      await executeBulkAction(action.key, selectedIds);
      onClearSelection();
    } catch (error) {
      console.error(`Bulk action ${action.key} failed:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading('delete');
    try {
      await executeBulkAction('delete', selectedIds);
      setDeleteDialogOpen(false);
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getActionIcon = (actionKey: string) => {
    const iconMap: Record<string, any> = {
      delete: Trash2,
      archive: Archive,
      tag: Tag,
      email: Mail,
      export: Download,
      duplicate: Copy,
    };
    return iconMap[actionKey] || MoreHorizontal;
  };

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-muted/50 border rounded-lg">
        <Badge variant="secondary">
          {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
        </Badge>
        
        <div className="flex items-center gap-1 ml-auto">
          {/* Quick actions */}
          {config.permissions?.delete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={actionLoading !== null}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}

          {/* Dropdown for other bulk actions */}
          {bulkActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading !== null}
                >
                  <MoreHorizontal className="h-4 w-4 mr-1" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {bulkActions.map((action) => {
                  const Icon = getActionIcon(action.key);
                  return (
                    <DropdownMenuItem
                      key={action.key}
                      onClick={() => handleBulkAction(action)}
                      disabled={actionLoading !== null}
                      className={action.variant === 'destructive' ? 'text-destructive' : ''}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={actionLoading !== null}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Items</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} selected item{selectedIds.length !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={actionLoading !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
