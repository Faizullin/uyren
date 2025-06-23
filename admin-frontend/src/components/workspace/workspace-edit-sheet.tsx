"use client";

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus } from 'lucide-react';
import React, { createContext, useContext, useEffect, useId, useMemo } from 'react';
import { FieldValues, useForm, UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import { ScrollArea } from '../ui/scroll-area';
import { WorkspaceConfig } from './types';
import { useWorkspaceContext } from './workspace-context';
import { WorkspaceFormLayout } from './workspace-form';

// Context for workspace edit sheet
interface WorkspaceEditSheetContextType<TFormData extends FieldValues = FieldValues> {
  formId: string;
  form: UseFormReturn<TFormData>;
  mode: 'create' | 'edit';
  isLoading: boolean;
  config: WorkspaceConfig;
  currentItem: any;
}

const WorkspaceEditSheetContext = createContext<WorkspaceEditSheetContextType | null>(null);

export function useWorkspaceEditSheetContext<TFormData extends FieldValues = FieldValues>(): WorkspaceEditSheetContextType<TFormData> {
  const context = useContext(WorkspaceEditSheetContext);
  if (!context) {
    throw new Error('useWorkspaceEditSheetContext must be used within a WorkspaceEditSheet.Root');
  }
  return context as WorkspaceEditSheetContextType<TFormData>;
}

interface WorkspaceEditSheetProps {
  config: WorkspaceConfig;
  children: React.ReactNode;
}

// Root component that provides context
function WorkspaceEditSheetRoot({ config, children }: WorkspaceEditSheetProps) {
  const { workspace, state, actions } = useWorkspaceContext();

  const mode = state.currentAction.type === 'edit' ? 'edit' : 'create';
  const currentItem = state.currentAction.item;

  // Generate form schema from config
  const formSchema = useMemo(() => {
    const schemaObject: Record<string, any> = {};

    config.form.fields.forEach(field => {
      let fieldSchema: any;

      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'url':
        case 'password':
          fieldSchema = z.string();
          if (field.required) {
            fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          }
          if (field.validation?.min) {
            fieldSchema = fieldSchema.min(field.validation.min, `${field.label} must be at least ${field.validation.min} characters`);
          }
          if (field.validation?.max) {
            fieldSchema = fieldSchema.max(field.validation.max, `${field.label} must be less than ${field.validation.max} characters`);
          }
          if (field.validation?.pattern) {
            fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern), `${field.label} format is invalid`);
          }
          break;

        case 'number':
          fieldSchema = z.number();
          if (field.validation?.min) {
            fieldSchema = fieldSchema.min(field.validation.min);
          }
          if (field.validation?.max) {
            fieldSchema = fieldSchema.max(field.validation.max);
          }
          break;

        case 'boolean':
          fieldSchema = z.boolean();
          break;

        case 'date':
          fieldSchema = z.string().or(z.date());
          break;

        case 'select':
          if (field.validation?.options) {
            const values = field.validation.options.map(opt => String(opt.value));
            fieldSchema = z.enum(values as [string, ...string[]]);
          } else {
            fieldSchema = z.string();
          }
          break;

        default:
          fieldSchema = z.any();
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }

      schemaObject[field.key] = fieldSchema;
    });

    return z.object(schemaObject);
  }, [config.form.fields]);

  type FormData = z.infer<typeof formSchema>;

  // Create form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: config.form.fields.reduce((acc, field) => {
      acc[field.key] = field.defaultValue || '';
      return acc;
    }, {} as any),
    mode: 'onSubmit',
  });

  // Reset form when item changes
  useEffect(() => {
    if (mode === 'edit' && currentItem) {
      const formData: any = {};
      config.form.fields.forEach(field => {
        formData[field.key] = currentItem[field.key] || field.defaultValue || '';
      });
      form.reset(formData);
    } else if (mode === 'create') {
      const defaultData: any = {};
      config.form.fields.forEach(field => {
        defaultData[field.key] = field.defaultValue || '';
      });
      form.reset(defaultData);
    }
  }, [mode, currentItem, config.form.fields, form]);

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    console.log('Form submitted with data:', data);
    try {
      if (mode === 'create') {
        await workspace.create(data);
      } else if (currentItem) {
        await workspace.update(currentItem[config.api.idField], data);
      }
      actions.closeAction();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const formId = useId();

  const contextValue: WorkspaceEditSheetContextType<FormData> = {
    form,
    mode,
    isLoading: form.formState.isSubmitting,
    config,
    currentItem,
    formId,
  };

  return (
    <WorkspaceEditSheetContext.Provider value={contextValue}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id={formId}>
          {children}
        </form>
      </Form>
    </WorkspaceEditSheetContext.Provider>
  );
}

// Sheet wrapper component
interface WorkspaceSheetProps {
  children: React.ReactNode;
}

function WorkspaceSheet({ children }: WorkspaceSheetProps) {
  const { state, actions } = useWorkspaceContext();

  const isOpen = state.currentAction.isOpen && (state.currentAction.type === 'create' || state.currentAction.type === 'edit');
  const onOpenChange = (open: boolean) => {
    if (!open) {
      actions.closeAction();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px] ">
        {children}
      </SheetContent>
    </Sheet>
  );
}

// Header component
function WorkspaceSheetHeader({ children }: { children: React.ReactNode }) {
  return <SheetHeader>{children}</SheetHeader>;
}

// Default header content
function WorkspaceHeader() {
  const { mode, config } = useWorkspaceEditSheetContext();

  return (
    <>
      <SheetTitle className="flex items-center gap-2">
        {mode === 'create' ? (
          <>
            <Plus className="w-5 h-5" />
            Create {config.title.slice(0, -1)}
          </>
        ) : (
          <>
            <Edit className="w-5 h-5" />
            Edit {config.title.slice(0, -1)}
          </>
        )}
      </SheetTitle>
      <SheetDescription>
        {mode === 'create'
          ? `Fill in the details below to create a new ${config.title.toLowerCase().slice(0, -1)}.`
          : `Update the ${config.title.toLowerCase().slice(0, -1)} details below.`}
      </SheetDescription>
    </>
  );
}

// Form content component
function WorkspaceFormContent({ children }: { children?: React.ReactNode }) {
  const { config, form, isLoading, mode } = useWorkspaceEditSheetContext();

  return (
    <div className="mt-6 space-y-6 flex flex-col gap-4">
      <ScrollArea className="h-[calc(100vh-500px)]">
        <div className="px-4">
          {children ? (
            children
          ) : (
            <WorkspaceFormLayout
              layout={config.form}
              control={form.control}
              disabled={isLoading}
              isCreateMode={mode === 'create'}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Footer component
function WorkspaceSheetFooter() {
  const { isLoading, mode, formId } = useWorkspaceEditSheetContext();
  const { actions } = useWorkspaceContext();

  return (
    <div className="flex justify-end gap-3 pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={() => actions.closeAction()}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isLoading}
        form={formId}
      >
        {isLoading
          ? 'Saving...'
          : mode === 'create'
            ? 'Create'
            : 'Save Changes'
        }
      </Button>
    </div>
  );
}

// Compound component structure
export const WorkspaceEditSheet = {
  Root: WorkspaceEditSheetRoot,
  Sheet: Object.assign(WorkspaceSheet, {
    Header: WorkspaceSheetHeader,
    Footer: WorkspaceSheetFooter,
  }),
  Header: WorkspaceHeader,
  FormContent: WorkspaceFormContent,
};

// Legacy component for backward compatibility
export function WorkspaceEditSheetLegacy({
  config
}: { config: WorkspaceConfig }) {
  return (
    <WorkspaceEditSheet.Root config={config}>
      <WorkspaceEditSheet.Sheet>
        <WorkspaceEditSheet.Sheet.Header>
          <WorkspaceEditSheet.Header />
        </WorkspaceEditSheet.Sheet.Header>

        <WorkspaceEditSheet.FormContent />

        <WorkspaceEditSheet.Sheet.Footer />
      </WorkspaceEditSheet.Sheet>
    </WorkspaceEditSheet.Root>
  );
}
