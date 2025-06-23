import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  Calendar,
  CheckCircle,
  Edit,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Trash2,
  XCircle
} from 'lucide-react';
import Image from 'next/image';
import { DynamicTableCellProps, WorkspaceTableColumn } from './types';

// Dynamic table cell component
export function DynamicTableCell<T = any>({
  column,
  row,
  value,
  onAction
}: DynamicTableCellProps<T>) {

  const renderValue = () => {
    if (column.render || column.type) {
      if (column.type === 'actions') {
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction?.('edit', row)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction?.('view', row)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction?.('delete', row)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        );
      }
    }

    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }

    switch (column.render || column.type) {
      case 'badge':
        if (column.badgeConfig?.variants) {
          const variant = column.badgeConfig.variants[value] || 'default';
          const color = column.badgeConfig.colors?.[value];
          return (
            <Badge
              variant={variant}
              className={color ? cn('', color) : ''}
            >
              {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
            </Badge>
          );
        }
        return <Badge>{String(value)}</Badge>;

      case 'date':
        try {
          return (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(value), 'MMM dd, yyyy')}
            </div>
          );
        } catch {
          return <span className="text-muted-foreground">{String(value)}</span>;
        }

      case 'currency':
        return (
          <span className="font-medium">
            ${typeof value === 'number' ? value.toFixed(2) : value}
          </span>
        );

      case 'percentage':
        return (
          <span className="font-medium">
            {typeof value === 'number' ? (value * 100).toFixed(1) : value}%
          </span>
        );

      case 'link':
        return (
          <Button variant="link" className="h-auto p-0" asChild>
            <a href={value} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              {value}
            </a>
          </Button>
        );

      case 'image':
        return (
          <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
            {value ? (
              <Image
                src={value}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <ImageIcon className="w-4 h-4 absolute inset-0 m-auto text-muted-foreground" />
            )}
          </div>
        );

      case 'boolean':
        return value ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        );

      case 'text':
      case 'number':
      default:
        if (typeof value === 'string' && value.length > 50) {
          return (
            <span className="truncate max-w-[200px] block" title={value}>
              {value}
            </span>
          );
        }
        return <span>{String(value)}</span>;
    }
  };

  return (
    <div className={cn(
      'flex items-center',
      column.type === 'number' && 'justify-end',
      column.type === 'actions' && 'justify-center'
    )}>
      {renderValue()}
    </div>
  );
}

// Generate column definitions from workspace table config
export function generateTableColumns<T = any>(
  columns: WorkspaceTableColumn[],
  onAction?: (action: string, row: T) => void,
  selectable: boolean = false
): ColumnDef<T>[] {
  const tableColumns: ColumnDef<T>[] = [];

  // Add selection column if enabled
  if (selectable) {
    tableColumns.push({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 32,
      enableSorting: false,
      enableHiding: false,
    });
  }

  // Add data columns
  columns.forEach((column) => {
    if (column.hidden) return;
    const columnDef: ColumnDef<T> = {
      id: column.key,
      accessorKey: column.key,
      header: column.label,
      enableSorting: column.sortable !== false,
      enableColumnFilter: column.filterable !== false,
      size: column.width,
      cell: ({ row }) => {
        const value = row.getValue(column.key);
        return (
          <DynamicTableCell
            column={column}
            row={row.original}
            value={value}
            onAction={onAction}
          />
        );
      },
    };

    // Add filter metadata for data table toolbar
    if (column.filterable && column.filterOptions) {
      (columnDef as any).meta = {
        label: column.label,
        options: column.filterOptions,
        variant: 'select',
      };
    } else if (column.searchable) {
      (columnDef as any).meta = {
        label: column.label,
        placeholder: `Search ${column.label.toLowerCase()}...`,
        variant: 'text',
      };
    }

    tableColumns.push(columnDef);
  });

  return tableColumns;
}

// Filter component for workspace toolbar
interface WorkspaceFilterProps {
  filter: {
    key: string;
    label: string;
    type: string;
    options?: Array<{ label: string; value: string | number }>;
    placeholder?: string;
  };
  value: any;
  onChange: (value: any) => void;
}

export function WorkspaceFilter({ filter, value, onChange }: WorkspaceFilterProps) {
  switch (filter.type) {
    case 'select':
      return (<Select
        value={value || '__all__'}
        onValueChange={(newValue) => onChange(newValue === '__all__' ? '' : newValue)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder={filter.placeholder || `Select ${filter.label}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All {filter.label}</SelectItem>
          {filter.options?.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      );

    case 'text':
    default:
      return (
        <Input
          placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-64"
        />
      );
  }
}
