'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Grid3X3, 
  List
} from 'lucide-react';
import { WorkspaceConfig, WorkspaceTableColumn } from './types';
import { useWorkspaceActions } from './workspace-context';
import { cn } from '@/lib/utils';

interface WorkspaceGridViewProps {
  config: WorkspaceConfig;
  data: any[];
  loading?: boolean;
  onSelectItem?: (item: any) => void;
  selectedIds?: string[];
  viewMode?: 'grid' | 'kanban' | 'timeline';
}

export function WorkspaceGridView({
  config,
  data,
  loading = false,
  onSelectItem,
  selectedIds = [],
  viewMode = 'grid'
}: WorkspaceGridViewProps) {
  const [currentView, setCurrentView] = useState<'grid' | 'kanban' | 'timeline'>(viewMode);
  const { openEdit, openDelete, executeCustomAction } = useWorkspaceActions();

  // Get primary display fields
  const displayFields = config.table?.columns?.filter(col => 
    !col.hidden && col.type !== 'actions'
  ).slice(0, 4) || [];

  const titleField = displayFields.find(field => 
    field.key.includes('title') || field.key.includes('name')
  ) || displayFields[0];

  const statusField = displayFields.find(field => 
    field.type === 'badge' || field.key.includes('status')
  );

  const dateField = displayFields.find(field => 
    field.type === 'date' || field.key.includes('date')
  );

  const renderFieldValue = (item: any, field: WorkspaceTableColumn) => {
    const value = item[field.key];
    
    if (!value) return null;

    switch (field.type) {
      case 'badge':
        const variant = field.badgeConfig?.variants?.[value] || 'default';
        return (
          <Badge variant={variant} className="text-xs">
            {value}
          </Badge>
        );
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return (
          <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
            {value ? 'Yes' : 'No'}
          </Badge>
        );
      default:
        return <span className="text-sm text-muted-foreground truncate">{value}</span>;
    }
  };

  const renderGridCard = (item: any) => {
    const isSelected = selectedIds.includes(item[config.api?.idField || 'id']);
    
    return (
      <Card 
        key={item[config.api?.idField || 'id']}
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={() => onSelectItem?.(item)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-medium truncate">
                {titleField ? item[titleField.key] : 'Untitled'}
              </CardTitle>
              {statusField && (
                <div className="mt-1">
                  {renderFieldValue(item, statusField)}
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(item); }}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); openDelete(item); }}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
                {config.actions?.filter(action => action.type === 'custom').map(action => (
                  <DropdownMenuItem 
                    key={action.key}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      executeCustomAction(action, item); 
                    }}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            {displayFields.slice(1, 3).map(field => {
              if (field === statusField || field === titleField) return null;
              
              return (
                <div key={field.key} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{field.label}:</span>
                  {renderFieldValue(item, field)}
                </div>
              );
            })}
            
            {dateField && (
              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                {renderFieldValue(item, dateField)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderKanbanColumn = (status: string, items: any[]) => (
    <div key={status} className="flex-1 min-w-72">
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">{status}</h3>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        
        <div className="space-y-3">
          {items.map(item => (
            <Card 
              key={item[config.api?.idField || 'id']}
              className="cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => onSelectItem?.(item)}
            >
              <CardContent className="p-3">
                <h4 className="font-medium text-sm mb-2">
                  {titleField ? item[titleField.key] : 'Untitled'}
                </h4>
                
                <div className="space-y-1">
                  {displayFields.slice(1, 2).map(field => {
                    if (field === statusField || field === titleField) return null;
                    return (
                      <div key={field.key} className="text-xs text-muted-foreground">
                        {renderFieldValue(item, field)}
                      </div>
                    );
                  })}
                </div>
                
                {dateField && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {renderFieldValue(item, dateField)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (currentView === 'kanban' && statusField) {
    const statusOptions = statusField.filterOptions || [];
    const groupedData = statusOptions.reduce((acc, option) => {
      acc[option.label] = data.filter(item => item[statusField.key] === option.value);
      return acc;
    }, {} as Record<string, any[]>);

    return (
      <div className="space-y-4">        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('grid')}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setCurrentView('kanban')}
            >
              <List className="h-4 w-4 mr-1" />
              Kanban
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(groupedData).map(([status, items]) => 
            renderKanbanColumn(status, items)
          )}
        </div>
      </div>
    );
  }

  // Default Grid View
  return (
    <div className="space-y-4">      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setCurrentView('grid')}
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            Grid
          </Button>
          {statusField && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('kanban')}
            >
              <List className="h-4 w-4 mr-1" />
              Kanban
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map(renderGridCard)}
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items found.</p>
        </div>
      )}
    </div>
  );
}
