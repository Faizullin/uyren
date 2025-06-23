'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Upload, 
  FileText, 
  Table, 
  Database,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { WorkspaceConfig } from './types';
import { useWorkspaceData } from './workspace-context';

interface WorkspaceDataManagerProps {
  config: WorkspaceConfig;
}

export function WorkspaceDataManager({ config }: WorkspaceDataManagerProps) {
  const { data } = useWorkspaceData();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xlsx'>('json');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [importData, setImportData] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const exportableFields = config.table?.columns?.filter(col => 
    col.type !== 'actions' && !col.hidden
  ) || [];

  const handleExport = async () => {
    if (!config.permissions?.export) return;
    
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const fieldsToExport = selectedFields.length > 0 ? selectedFields : exportableFields.map(f => f.key);
      const exportData = data.map(item => {
        const filtered: any = {};
        fieldsToExport.forEach(field => {
          filtered[field] = item[field];
        });
        return filtered;
      });

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'csv':
          content = convertToCSV(exportData, fieldsToExport);
          filename = `${config.name}-export.csv`;
          mimeType = 'text/csv';
          break;
        case 'xlsx':
          // In a real app, you'd use a library like xlsx
          content = JSON.stringify(exportData, null, 2);
          filename = `${config.name}-export.json`;
          mimeType = 'application/json';
          break;
        default:
          content = JSON.stringify(exportData, null, 2);
          filename = `${config.name}-export.json`;
          mimeType = 'application/json';
      }

      // Download the file
      downloadFile(content, filename, mimeType);
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleImport = async () => {
    if (!config.permissions?.import) return;
    
    setIsImporting(true);
    setImportProgress(0);
    setImportErrors([]);

    try {
      let parsedData: any[];
      
      // Parse the input data
      try {
        parsedData = JSON.parse(importData);      } catch {
        throw new Error('Invalid JSON format');
      }

      if (!Array.isArray(parsedData)) {
        throw new Error('Data must be an array of objects');
      }

      // Validate the data structure
      const errors: string[] = [];
      const requiredFields = config.form?.fields?.filter(field => field.required)?.map(f => f.key) || [];

      parsedData.forEach((item, index) => {
        requiredFields.forEach(field => {
          if (!item[field]) {
            errors.push(`Row ${index + 1}: Missing required field "${field}"`);
          }
        });
      });

      if (errors.length > 0) {
        setImportErrors(errors);
        return;
      }

      // Simulate import progress
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // In a real app, you would send the data to your API
      console.log('Importing data:', parsedData);
      
      setImportDialogOpen(false);
      setImportData('');
    } catch (error) {
      setImportErrors([error instanceof Error ? error.message : 'Import failed']);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const convertToCSV = (data: any[], fields: string[]): string => {
    const header = fields.join(',');
    const rows = data.map(item => 
      fields.map(field => {
        const value = item[field];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    return [header, ...rows].join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleField = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(exportableFields.map(f => f.key));
  };

  const clearAllFields = () => {
    setSelectedFields([]);
  };

  return (
    <div className="flex gap-2">
      {/* Export Button */}
      {config.permissions?.export && (
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Data</DialogTitle>
              <DialogDescription>
                Choose the format and fields to export your data.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Format Selection */}
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        JSON
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4" />
                        CSV
                      </div>
                    </SelectItem>
                    <SelectItem value="xlsx">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Excel (XLSX)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Field Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Fields to Export</Label>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAllFields}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAllFields}>
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                  {exportableFields.map(field => (
                    <div key={field.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={selectedFields.includes(field.key)}
                        onCheckedChange={() => toggleField(field.key)}
                      />
                      <Label htmlFor={field.key} className="text-sm">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                {selectedFields.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    All fields will be exported if none selected.
                  </p>
                )}
              </div>

              {/* Export Progress */}
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Exporting data...</span>
                  </div>
                  <Progress value={exportProgress} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Import Button */}
      {config.permissions?.import && (
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Import Data</DialogTitle>
              <DialogDescription>
                Paste JSON data to import. Make sure the data matches the expected format.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Data Input */}
              <div className="space-y-2">
                <Label>JSON Data</Label>
                <Textarea
                  placeholder="[{&quot;field1&quot;: &quot;value1&quot;, &quot;field2&quot;: &quot;value2&quot;}, ...]"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="min-h-32 font-mono text-sm"
                />
              </div>

              {/* Required Fields Info */}
              <div className="space-y-2">
                <Label>Required Fields</Label>
                <div className="flex flex-wrap gap-1">
                  {config.form?.fields?.filter(field => field.required)?.map(field => (
                    <Badge key={field.key} variant="secondary">
                      {field.key}
                    </Badge>
                  )) || (
                    <span className="text-sm text-muted-foreground">No required fields</span>
                  )}
                </div>
              </div>

              {/* Import Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Importing data...</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {/* Import Errors */}
              {importErrors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Import Errors</span>
                  </div>
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-2 max-h-32 overflow-y-auto">
                    {importErrors.map((error, index) => (
                      <p key={index} className="text-sm text-destructive">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || !importData.trim()}
              >
                {isImporting ? 'Importing...' : 'Import'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
