"use client";

import { api } from '@/lib/api';
import { showToast } from '@/lib/error-handler';
import { PaginatedData } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { UseWorkspaceReturn, WorkspaceConfig } from './types';

export function useWorkspace<T = any>(config: WorkspaceConfig): UseWorkspaceReturn<T> {
  const queryClient = useQueryClient();
  
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.table.pageSize || 10);
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  
  // For server-side filtering, we need to track filter state separately
  // React Table will handle client-side filtering, but we need server-side for pagination
  const [serverFilters, setServerFilters] = useState<Record<string, any>>({});

  // Build query parameters for server requests
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page: currentPage,
      page_size: pageSize,
    };

    // Add search
    if (search && config.api.searchField) {
      params[config.api.searchField] = search;
    }

    // Add server-side filters
    Object.entries(serverFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    // Add default sorting
    if (config.table.defaultSort) {
      params.ordering = config.table.defaultSort.order === 'desc' 
        ? `-${config.table.defaultSort.field}` 
        : config.table.defaultSort.field;
    }

    return params;
  }, [currentPage, pageSize, serverFilters, search, config]);

  // Query key for caching
  const queryKey = [config.name, queryParams];

  // Fetch data
  const {
    data: queryData,
    isLoading,
    error,
    refetch,
  } = useQuery<PaginatedData<T>>({
    queryKey,
    queryFn: () => api.get(config.api.endpoint, { params: queryParams }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<T>) => api.post(config.api.endpoint, data),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: [config.name] });
      showToast('success', { message: `${config.title} created successfully` });
      return newItem;
    },
    onError: (error) => {
      showToast('error', { message: `Failed to create ${config.title.toLowerCase()}` });
      throw error;
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<T> }) =>
      api.patch(`${config.api.endpoint}${id}/`, data),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: [config.name] });
      showToast('success', { message: `${config.title} updated successfully` });
      return updatedItem;
    },
    onError: (error) => {
      showToast('error', { message: `Failed to update ${config.title.toLowerCase()}` });
      throw error;
    },
  });
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.delete(`${config.api.endpoint}${id}/`),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: [config.name] });
      showToast('success', { message: `${config.title} deleted successfully` });
      setSelectedItems(prev => prev.filter(item => (item as any)[config.api.idField] !== deletedId));
    },
    onError: (error) => {
      showToast('error', { message: `Failed to delete ${config.title.toLowerCase()}` });
      throw error;
    },
  });

  // Action functions
  const create = useCallback(async (data: Partial<T>): Promise<T> => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const update = useCallback(async (id: string | number, data: Partial<T>): Promise<T> => {
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const deleteItem = useCallback(async (id: string | number): Promise<void> => {
    return deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Pagination functions
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);
  // Filter functions - now for server-side filtering only
  const handleSetFilters = useCallback((newFilters: Record<string, any>) => {
    setServerFilters(newFilters);
    setCurrentPage(1); // Reset to first page when changing filters
  }, []);

  const handleSetSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Selection functions
  const selectAll = useCallback(() => {
    if (queryData?.results) {
      setSelectedItems([...queryData.results]);
    }
  }, [queryData?.results]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);
  // Return the hook interface
  return {
    // Data
    data: queryData?.results || [],
    isLoading,
    error: error as Error | null,
    totalCount: queryData?.count || 0,
    currentPage,
    pageSize,

    // Actions
    create,
    update,
    delete: deleteItem,
    refresh,

    // Filters and search - server-side only
    filters: serverFilters,
    setFilters: handleSetFilters,
    search,
    setSearch: handleSetSearch,

    // Pagination
    goToPage,
    setPageSize: handleSetPageSize,

    // Selection
    selectedItems,
    setSelectedItems,
    selectAll,
    clearSelection,
  };
}

// Hook for managing workspace UI state
export function useWorkspaceState() {
  const [currentAction, setCurrentAction] = useState<{
    type: string;
    item?: any;
    isOpen: boolean;
  }>({
    type: 'create',
    item: undefined,
    isOpen: false,
  });

  const openCreate = useCallback(() => {
    setCurrentAction({
      type: 'create',
      item: undefined,
      isOpen: true,
    });
  }, []);

  const openEdit = useCallback((item: any) => {
    setCurrentAction({
      type: 'edit',
      item,
      isOpen: true,
    });
  }, []);

  const openDelete = useCallback((item: any) => {
    setCurrentAction({
      type: 'delete',
      item,
      isOpen: true,
    });
  }, []);

  const openView = useCallback((item: any) => {
    setCurrentAction({
      type: 'view',
      item,
      isOpen: true,
    });
  }, []);

  const closeAction = useCallback(() => {
    setCurrentAction(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);
  const executeCustomAction = useCallback((action: any, item?: any) => {
    setCurrentAction({
      type: action.key,
      item,
      isOpen: true,
    });
  }, []);

  const executeBulkAction = useCallback(async (actionKey: string, selectedIds: string[]) => {
    // This is a placeholder implementation
    // In a real app, you would call your API endpoint for bulk operations
    try {
      console.log(`Executing bulk action "${actionKey}" on items:`, selectedIds);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // You would implement actual API calls here based on actionKey
      switch (actionKey) {
        case 'delete':
          // Call bulk delete API
          console.log('Bulk deleting items:', selectedIds);
          break;
        case 'archive':
          // Call bulk archive API
          console.log('Bulk archiving items:', selectedIds);
          break;
        default:
          console.log(`Unknown bulk action: ${actionKey}`);
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
      throw error;
    }
  }, []);

  return {
    currentAction,
    setCurrentAction,
    actions: {
      openCreate,
      openEdit,
      openDelete,
      openView,
      executeCustomAction,
      executeBulkAction,
      closeAction,
    },
  };
}
