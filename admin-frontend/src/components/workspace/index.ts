// Main workspace components
export { WorkspaceProvider, useWorkspaceContext, useWorkspaceData, useWorkspaceActions, useWorkspaceConfig } from './workspace-context';
export { useWorkspace, useWorkspaceState } from './use-workspace';
export { WorkspaceListPage } from './workspace-list-page';
export { WorkspaceEditSheet, WorkspaceEditSheetLegacy, useWorkspaceEditSheetContext } from './workspace-edit-sheet';
export { DynamicFormField, WorkspaceFormField, WorkspaceFormLayout } from './workspace-form';
export { DynamicTableCell, generateTableColumns, WorkspaceFilter } from './workspace-table';
export { WorkspaceBulkActions } from './workspace-bulk-actions';
export { WorkspaceGridView } from './workspace-grid-view';
export { WorkspaceDataManager } from './workspace-data-manager';

// Types
export type {
  WorkspaceConfig,
  WorkspaceField,
  WorkspaceFormLayout as IWorkspaceFormLayout,
  WorkspaceTableColumn,
  WorkspaceFilter as IWorkspaceFilter,
  WorkspaceAction,
  UseWorkspaceReturn,
  DynamicFormFieldProps,
  DynamicTableCellProps,
  WorkspaceContextType,
  LessonWorkspaceConfig,
} from './types';
