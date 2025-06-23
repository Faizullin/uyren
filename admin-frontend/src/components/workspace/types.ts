// Workspace configuration types
export interface WorkspaceField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'boolean' | 'email' | 'url' | 'password' | 'file' | 'rich-text' | 'slug';
  required?: boolean;
  placeholder?: string;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: Array<{ label: string; value: string | number }>;
  };
  column?: number; // For form layout (1-12)
  defaultValue?: any;
  hidden?: boolean;
  readonly?: boolean;
  // Slug-specific properties
  slugifyFrom?: string; // Field key to generate slug from
  autoSlug?: boolean; // Enable auto-generation in create mode
}

export interface WorkspaceFormLayout {
  columns: number; // Number of columns in the form
  fields: WorkspaceField[];
  sections?: Array<{
    title: string;
    description?: string;
    fields: string[]; // Field keys
    collapsible?: boolean;
  }>;
}

export interface WorkspaceTableColumn {
  key: string;
  label: string;
  type: 'text' | 'badge' | 'date' | 'number' | 'boolean' | 'actions' | 'select' | 'custom';
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  width?: number;
  hidden?: boolean;
  render?: 'default' | 'badge' | 'date' | 'currency' | 'percentage' | 'link' | 'image';
  badgeConfig?: {
    variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'>;
    colors?: Record<string, string>;
  };
  filterOptions?: Array<{ label: string; value: string | number }>;
}

export interface WorkspaceFilter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multi-select' | 'date' | 'date-range' | 'boolean';
  options?: Array<{ label: string; value: string | number }>;
  placeholder?: string;
  icon?: string;
}

export interface WorkspaceAction {
  key: string;
  label: string;
  type: 'create' | 'edit' | 'delete' | 'view' | 'custom';
  icon?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  permission?: string;
  bulk?: boolean; // Support for bulk operations
  confirmation?: {
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
  };
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

export interface WorkspaceConfig {
  name: string;
  title: string;
  description: string;
  
  // API Configuration
  api: {
    endpoint: string;
    idField: string;
    searchField?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  };
  
  // Permissions
  permissions?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    export?: boolean;
    import?: boolean;
  };
  
  // Form configuration
  form: WorkspaceFormLayout;
  
  // Table configuration
  table: {
    columns: WorkspaceTableColumn[];
    defaultSort?: { field: string; order: 'asc' | 'desc' };
    pageSize?: number;
    selectable?: boolean;
    exportable?: boolean;
  };
  
  // Filtering configuration
  filters?: WorkspaceFilter[];
  
  // Actions configuration
  actions?: WorkspaceAction[];
  
  // Validation schemas (Zod schema as string or object)
  validation?: {
    create?: string | object;
    update?: string | object;
  };
  
  // UI Configuration
  ui?: {
    layout?: 'table' | 'grid' | 'kanban';
    theme?: string;
    headerActions?: string[];
    bulkActions?: string[];
  };
  
  // Relationships
  relationships?: {
    [key: string]: {
      type: 'one-to-one' | 'one-to-many' | 'many-to-many';
      resource: string;
      field: string;
      display: string;
    };
  };
}

// Example lesson configuration type
export interface LessonWorkspaceConfig extends WorkspaceConfig {
  name: 'lessons';
}

// Hook return types
export interface UseWorkspaceReturn<T = any> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  
  // Actions
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string | number, data: Partial<T>) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
  refresh: () => void;
  
  // Filters and search
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  search: string;
  setSearch: (search: string) => void;
  
  // Pagination
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // Selection
  selectedItems: T[];
  setSelectedItems: (items: T[]) => void;
  selectAll: () => void;
  clearSelection: () => void;
}

// Form field props for dynamic form generation
export interface DynamicFormFieldProps {
  field: WorkspaceField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  formData?: Record<string, any>; // All form data for reference
  isCreateMode?: boolean; // Whether this is create mode
}

// Table cell props for dynamic table generation
export interface DynamicTableCellProps<T = any> {
  column: WorkspaceTableColumn;
  row: T;
  value: any;
  onAction?: (action: string, row: T) => void;
}

// Workspace context type
export interface WorkspaceContextType {
  config: WorkspaceConfig;
  workspace: UseWorkspaceReturn;  actions: {
    openCreate: () => void;
    openEdit: (item: any) => void;
    openDelete: (item: any) => void;
    openView: (item: any) => void;
    executeCustomAction: (action: WorkspaceAction, item?: any) => void;
    executeBulkAction: (actionKey: string, selectedIds: string[]) => Promise<void>;
    closeAction: () => void;
  };
  state: {
    currentAction: {
      type: string;
      item?: any;
      isOpen: boolean;
    };
    setCurrentAction: (action: any) => void;
  };
}
