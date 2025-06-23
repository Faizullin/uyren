"use client";

/**
 * ModelEditSheet - Generic, reusable, type-safe compound component for model edit/create dialogs
 * 
 * Features:
 * - Compound component pattern with Root, Header, Content, Footer
 * - Support for both Sheet and Dialog variants
 * - DRF error handling integration
 * - Ready state logic for safe form initialization
 * - Type-safe configuration
 * 
 * Usage Examples:
 * 
 * 1. Using Sheet variant:
 * <ModelEditSheet.Root config={config} initialRecord={record} isOpen={isOpen} onOpenChange={setOpen}>
 *   <ModelEditSheet.Sheet isOpen={isOpen} onOpenChange={setOpen}>
 *     <ModelEditSheet.Sheet.Header />
 *     <ModelEditSheet.Content>
 *       <YourFormFields />
 *     </ModelEditSheet.Content>
 *     <ModelEditSheet.Sheet.Footer />
 *   </ModelEditSheet.Sheet>
 * </ModelEditSheet.Root>
 * 
 * 2. Using Dialog variant:
 * <ModelEditSheet.Root config={config} initialRecord={record} isOpen={isOpen} onOpenChange={setOpen}>
 *   <ModelEditSheet.Dialog isOpen={isOpen} onOpenChange={setOpen}>
 *     <ModelEditSheet.Dialog.Header />
 *     <ModelEditSheet.Content>
 *       <YourFormFields />
 *     </ModelEditSheet.Content>
 *     <ModelEditSheet.Dialog.Footer />
 *   </ModelEditSheet.Dialog>
 * </ModelEditSheet.Root>
 * 
 * 3. Custom header/footer:
 * <ModelEditSheet.Root config={config} initialRecord={record} isOpen={isOpen} onOpenChange={setOpen}>
 *   <ModelEditSheet.Sheet isOpen={isOpen} onOpenChange={setOpen}>
 *     <ModelEditSheet.Header>
 *       <CustomHeader />
 *     </ModelEditSheet.Header>
 *     <ModelEditSheet.Content>
 *       <YourFormFields />
 *     </ModelEditSheet.Content>
 *     <ModelEditSheet.Footer>
 *       <CustomFooter />
 *     </ModelEditSheet.Footer>
 *   </ModelEditSheet.Sheet>
 * </ModelEditSheet.Root>
 */

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Form,
} from '@/components/ui/form';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { api, ApiError } from '@/lib/api';
import { DRFErrorHandler } from '@/lib/drf-error-utils';
import { showToast } from '@/lib/error-handler';
import { FormMode } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { Edit, Loader, Plus, Save } from 'lucide-react';
import { createContext, ReactNode, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { ScrollArea } from '../ui/scroll-area';

interface ModelEditSheetConfig<TModel, TFormData extends FieldValues> {
    // API configuration
    apiEndpoint: string;
    getItemId: (item: TModel) => string | number;

    // Form configuration
    form: UseFormReturn<TFormData>;
    defaultValues: TFormData;

    // UI configuration
    title: {
        create: string;
        edit: string;
    };
    description: {
        create: string;
        edit: string;
    };

    // Validation and processing
    beforeSubmit?: (data: TFormData, mode: FormMode) => TFormData | Promise<TFormData>;
    afterSuccess?: (result: TModel, mode: FormMode) => void;

    // Field name mappings for error clearing
    fieldNames?: (keyof TFormData)[];

    // Sheet configuration
    sheetConfig?: {
        side?: 'left' | 'right' | 'top' | 'bottom';
    };
}

// Context for sharing state between compound components
interface ModelEditSheetContextValue<TModel, TFormData extends FieldValues> {
    config: ModelEditSheetConfig<TModel, TFormData>;
    mode: FormMode;
    localRecord: TModel | null;
    ready: boolean;
    isLoading: boolean;
    onSubmit: (e?: React.FormEvent) => void;
    handleCancel: () => void;
    form: UseFormReturn<TFormData>;
    formId: string;
    updateMutation: ReturnType<typeof useMutation<TModel, Error, TFormData>>;
}

const ModelEditSheetContext = createContext<ModelEditSheetContextValue<any, any> | null>(null);

function useModelEditSheetContext<TModel, TFormData extends FieldValues>() {
    const context = useContext(ModelEditSheetContext);
    if (!context) {
        throw new Error('ModelEditSheet compound components must be used within ModelEditSheet.Root');
    }
    return context as ModelEditSheetContextValue<TModel, TFormData>;
}

interface ModelEditSheetRootProps<TModel, TFormData extends FieldValues> {
    config: ModelEditSheetConfig<TModel, TFormData>;
    initialRecord: TModel | null;
    isOpen: boolean;
    onSaveSuccess?: (record: TModel, meta: {
        mode: FormMode;
        message?: string;
        response?: any;
    }) => void;
    onOpenChange?: (state: boolean) => void;
    children: ReactNode;
}

// Root component that provides context
function ModelEditSheetRoot<TModel, TFormData extends FieldValues>({
    config,
    initialRecord = null,
    onSaveSuccess,
    onOpenChange,
    children,
}: ModelEditSheetRootProps<TModel, TFormData>) {
    const [mode, setMode] = useState<FormMode>('create');
    const [localRecord, setLocalRecord] = useState<TModel | null>(null);
    const [ready, setReady] = useState(false);
    const initializedRef = useRef(false);
    const formId = useId(); // Unique ID for the form

    const {
        apiEndpoint,
        getItemId,
        form,
        defaultValues,
        title,
        beforeSubmit,
        afterSuccess,
        fieldNames,
    } = config;


    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (formData: TFormData) => {
            const processedData = beforeSubmit ? await beforeSubmit(formData, 'create') : formData;
            const response = await api.post(apiEndpoint, processedData);
            return response.data;
        },
        onSuccess: (newRecord: TModel) => {
            setLocalRecord(newRecord);
            setMode('edit');
            form.reset();

            const successMessage = `${title.create.replace('Create New ', '')} created successfully! Now in edit mode.`;
            showToast("success", { message: successMessage });

            afterSuccess?.(newRecord, 'create');
            onSaveSuccess?.(newRecord, {
                mode: 'create',
                message: `${title.create.replace('Create New ', '')} created successfully`,
                response: newRecord,
            });
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                DRFErrorHandler.handle(error, {
                    form: { setError: form.setError, clearErrors: form.clearErrors },
                    displayType: 'both',
                    toastOptions: {
                        showNonFieldErrors: true,
                        showFieldErrors: false,
                        showGeneralErrors: true,
                    }
                });
            } else {
                showToast("error", {
                    message: `Failed to create ${title.create.toLowerCase().replace('create new ', '')}. Please try again.`
                });
            }
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (formData: TFormData) => {
            const currentRecord = localRecord;
            if (!currentRecord) throw new Error('No record available for update');

            const itemId = getItemId(currentRecord);
            const processedData = beforeSubmit ? await beforeSubmit(formData, 'edit') : formData;
            const response = await api.put(`${apiEndpoint}${itemId}/`, processedData);
            return response.data;
        },
        onSuccess: (updatedRecord: TModel) => {
            setLocalRecord(updatedRecord);

            const successMessage = `${title.edit.replace('Edit ', '')} updated successfully`;
            showToast("success", { message: successMessage });

            afterSuccess?.(updatedRecord, 'edit');
            onSaveSuccess?.(updatedRecord, {
                mode: 'edit',
                message: successMessage,
                response: updatedRecord,
            });
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                DRFErrorHandler.handle(error, {
                    form: { setError: form.setError, clearErrors: form.clearErrors },
                    displayType: 'both',
                    toastOptions: {
                        showNonFieldErrors: true,
                        showFieldErrors: false,
                        showGeneralErrors: true,
                    }
                });
            } else {
                showToast("error", {
                    message: `Failed to update ${title.edit.toLowerCase().replace('edit ', '')}. Please try again.`
                });
            }
        },
    });

    // Form submission handler
    const onSubmit = form.handleSubmit((data) => {
        if (fieldNames) {
            DRFErrorHandler.clearFormErrors(
                form,
                fieldNames as string[]
            );
        }

        if (mode === 'create') {
            createMutation.mutate(data);
        } else if (mode === 'edit') {
            updateMutation.mutate(data);
        }
    });

    // Handle close
    const handleCancel = useCallback(() => {
        onOpenChange?.(false);
    }, [onOpenChange]);

    const isLoading = form.formState.isSubmitting;    // Initialize form data when component mounts or mode/record changes
    useEffect(() => {
        if (mode === 'create' && !initializedRef.current) {
            form.reset(defaultValues);
            initializedRef.current = true;
        }
        setReady(true);
    }, [defaultValues, form, mode]);
    useEffect(() => {
        if (initialRecord) {
            setMode('edit');
            setLocalRecord(initialRecord);
        } else {
            setMode('create');
            setLocalRecord(null);
        }
        setReady(false);
        initializedRef.current = false; // Reset initialization flag
    }, [initialRecord]);

    const contextValue: ModelEditSheetContextValue<TModel, TFormData> = {
        config,
        mode,
        localRecord,
        ready,
        isLoading,
        onSubmit,
        handleCancel,
        form,
        formId,
        updateMutation,
    };

    return (
        <ModelEditSheetContext.Provider value={contextValue}>
            {children}
        </ModelEditSheetContext.Provider>
    );
}

// Header component
interface ModelEditSheetHeaderProps {
    children?: ReactNode;
    className?: string;
}

function ModelEditSheetHeader({ children, className }: ModelEditSheetHeaderProps) {
    const { config, mode } = useModelEditSheetContext();

    if (children) {
        return <div className={className}>{children}</div>;
    }

    // Default header
    return (
        <div className={`text-left ${className || ''}`}>
            <div className="flex items-center gap-2 text-lg font-semibold">
                {mode === 'create' ? (
                    <>
                        <Plus className="w-5 h-5" />
                        {config.title.create}
                    </>
                ) : (
                    <>
                        <Edit className="w-5 h-5" />
                        {config.title.edit}
                    </>
                )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
                {mode === 'create' ? config.description.create : config.description.edit}
            </p>
        </div>
    );
}

// Content component
interface ModelEditSheetContentProps {
    children: ReactNode;
    className?: string;
}

function ModelEditSheetContent({ children, className }: ModelEditSheetContentProps) {
    const { form, onSubmit, formId } = useModelEditSheetContext();

    return (
        <Form {...form}>
            <form
                id={formId}
                onSubmit={onSubmit}
                className={`flex flex-col gap-4 ${className || ''}`}>

                <ScrollArea className='h-[70vh]'>
                    <div className='px-4'>
                        {/* Non-field errors */}
                        {form.formState.errors.root && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                                {form.formState.errors.root.message}
                            </div>
                        )}

                        <div className="grid gap-6">
                            {children}
                        </div>
                    </div>
                </ScrollArea>
            </form>
        </Form>
    );
}

// Footer component
interface ModelEditSheetFooterProps {
    children?: ReactNode;
    className?: string;
}

function ModelEditSheetFooter({ children, className }: ModelEditSheetFooterProps) {
    const { config, mode, isLoading, handleCancel, formId } = useModelEditSheetContext();
    if (children) {
        return <div className={className}>{children}</div>;
    }

    // Default footer
    return (
        <div className={`pt-2 flex gap-2 justify-end ${className || ''}`}>
            <Button type="button" variant="outline" disabled={isLoading} onClick={handleCancel}>
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading} form={formId}>
                {isLoading && <Loader className="w-4 h-4 animate-spin mr-2" />}
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? config.title.create : `Update ${config.title.edit.replace('Edit ', '')}`}
            </Button>
        </div>
    );
}

// Sheet variant components
interface ModelEditSheetSheetProps {
    children: ReactNode;
    isOpen: boolean;
    onOpenChange?: (state: boolean) => void;
    className?: string;
}

function ModelEditSheetSheet({ children, isOpen, onOpenChange, className }: ModelEditSheetSheetProps) {
    const { config } = useModelEditSheetContext();
    const side = config.sheetConfig?.side || 'right';

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent
                side={side}
                className={`flex flex-col gap-6 sm:max-w-md ${className || ''}`}
            >
                {children}
            </SheetContent>
        </Sheet>
    );
}

function ModelEditSheetSheetHeader({ children, className }: ModelEditSheetHeaderProps) {
    const { config, mode } = useModelEditSheetContext();

    if (children) {
        return (
            <SheetHeader className={className}>
                {children}
            </SheetHeader>
        );
    }

    // Default sheet header
    return (
        <SheetHeader className={className}>
            <SheetTitle className="flex items-center gap-2">
                {mode === 'create' ? (
                    <>
                        <Plus className="w-5 h-5" />
                        {config.title.create}
                    </>
                ) : (
                    <>
                        <Edit className="w-5 h-5" />
                        {config.title.edit}
                    </>
                )}
            </SheetTitle>
            <SheetDescription>
                {mode === 'create' ? config.description.create : config.description.edit}
            </SheetDescription>
        </SheetHeader>
    );
}

function ModelEditSheetSheetFooter({ children, className }: ModelEditSheetFooterProps) {
    const { config, mode, isLoading, formId } = useModelEditSheetContext();

    if (children) {
        return (
            <SheetFooter className={className}>
                {children}
            </SheetFooter>
        );
    }

    // Default sheet footer
    return (
        <SheetFooter className={className}>
            <div className="flex gap-2 justify-end w-full">
                <SheetClose asChild>
                    <Button type="button" variant="outline" disabled={isLoading}>
                        Cancel
                    </Button>
                </SheetClose>
                <Button type="submit" disabled={isLoading} form={formId}>
                    {isLoading && <Loader className="w-4 h-4 animate-spin mr-2" />}
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? config.title.create : `Update ${config.title.edit.replace('Edit ', '')}`}
                </Button>
            </div>
        </SheetFooter>
    );
}

// Dialog variant components
interface ModelEditSheetDialogProps {
    children: ReactNode;
    isOpen: boolean;
    onOpenChange?: (state: boolean) => void;
    className?: string;
}

function ModelEditSheetDialog({ children, isOpen, onOpenChange, className }: ModelEditSheetDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className={className}>
                {children}
            </DialogContent>
        </Dialog>
    );
}

function ModelEditSheetDialogHeader({ children, className }: ModelEditSheetHeaderProps) {
    const { config, mode } = useModelEditSheetContext();

    if (children) {
        return (
            <DialogHeader className={className}>
                {children}
            </DialogHeader>
        );
    }

    // Default dialog header
    return (
        <DialogHeader className={className}>
            <DialogTitle className="flex items-center gap-2">
                {mode === 'create' ? (
                    <>
                        <Plus className="w-5 h-5" />
                        {config.title.create}
                    </>
                ) : (
                    <>
                        <Edit className="w-5 h-5" />
                        {config.title.edit}
                    </>
                )}
            </DialogTitle>
            <DialogDescription>
                {mode === 'create' ? config.description.create : config.description.edit}
            </DialogDescription>
        </DialogHeader>
    );
}

function ModelEditSheetDialogFooter({ children, className }: ModelEditSheetFooterProps) {
    const { config, mode, isLoading, handleCancel } = useModelEditSheetContext();

    if (children) {
        return (
            <DialogFooter className={className}>
                {children}
            </DialogFooter>
        );
    }

    // Default dialog footer
    return (
        <DialogFooter className={className}>
            <Button type="button" variant="outline" disabled={isLoading} onClick={handleCancel}>
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader className="w-4 h-4 animate-spin mr-2" />}
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? config.title.create : `Update ${config.title.edit.replace('Edit ', '')}`}
            </Button>
        </DialogFooter>
    );
}

// Main compound component with all variants
export const ModelEditSheet = {
    Root: ModelEditSheetRoot,
    Header: ModelEditSheetHeader,
    FormContent: ModelEditSheetContent,
    Footer: ModelEditSheetFooter,

    // Sheet variant
    Sheet: Object.assign(ModelEditSheetSheet, {
        Header: ModelEditSheetSheetHeader,
        Footer: ModelEditSheetSheetFooter,
    }),

    // Dialog variant
    Dialog: Object.assign(ModelEditSheetDialog, {
        Header: ModelEditSheetDialogHeader,
        Footer: ModelEditSheetDialogFooter,
    }),
};

// Export types and hooks
export { useModelEditSheetContext };
export type { ModelEditSheetConfig, ModelEditSheetRootProps };

