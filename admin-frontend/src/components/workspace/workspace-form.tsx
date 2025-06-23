'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CalendarIcon, Link, Upload } from 'lucide-react';
import { Control, FieldPath, FieldValues, useWatch } from 'react-hook-form';
import { DynamicFormFieldProps, WorkspaceFormLayout as IWorkspaceFormLayout, WorkspaceField } from './types';

// Utility function to convert string to slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple dashes with single dash
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing dashes
}

// Dynamic form field component
export function DynamicFormField({
  field,
  value,
  onChange,
  disabled = false,
  formData = {},
  // isCreateMode = false
}: DynamicFormFieldProps) {
  // const [isAutoSlug, setIsAutoSlug] = useState(
  //   field.type === 'slug' && isCreateMode && field.autoSlug !== false
  // );

  // // Auto-generate slug from reference field when in create mode
  // useEffect(() => {
  //   if (
  //     field.type === 'slug' && 
  //     isCreateMode && 
  //     isAutoSlug && 
  //     field.slugifyFrom && 
  //     formData[field.slugifyFrom]
  //   ) {
  //     const referenceValue = formData[field.slugifyFrom];
  //     if (typeof referenceValue === 'string' && referenceValue.trim()) {
  //       const slugValue = slugify(referenceValue);
  //       onChange(slugValue);
  //     }
  //   }
  // }, [formData, field.slugifyFrom, field.type, isCreateMode, isAutoSlug, onChange]);

  const handleSlugChange = (newValue: string) => {
    // setIsAutoSlug(false); // Disable auto-generation when user manually edits
    const slugified = slugify(newValue);
    onChange(slugified);
  };

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || field.readonly}
            rows={3}
            className="resize-none"
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled || field.readonly}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.validation?.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ); case 'boolean':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.key}
                checked={!!value}
                onCheckedChange={onChange}
                disabled={disabled || field.readonly}
              />
              <label
                htmlFor={field.key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
            </div>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.valueAsNumber || '')}
            disabled={disabled || field.readonly}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || field.readonly}
          />
        );

      case 'url':
        return (
          <Input
            type="url"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || field.readonly}
          />
        );

      case 'password':
        return (
          <Input
            type="password"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || field.readonly}
          />
        );

      case 'date':
        return (
          <div className="relative">
            <Input
              type="date"
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled || field.readonly}
            />
            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                disabled={disabled || field.readonly}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) onChange(file);
                  };
                  input.click();
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
              {value && (
                <span className="text-sm text-muted-foreground">
                  {typeof value === 'object' && 'name' in value ? value.name : 'File selected'}
                </span>
              )}
            </div>
          </div>
        );

      case 'rich-text':
        // This would integrate with your rich text editor
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || field.readonly}
            rows={6}
            className="resize-none font-mono text-sm"
          />
        );
      case 'slug':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder={field.placeholder}
                value={value || ''}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={disabled || field.readonly}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || field.readonly}
                onClick={() => {
                  if (field.slugifyFrom && formData[field.slugifyFrom]) {
                    const slugValue = slugify(formData[field.slugifyFrom]);
                    onChange(slugValue);
                  }
                }}
                className="whitespace-nowrap"
              >
                <Link className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
            {/* {isCreateMode && field.slugifyFrom && isAutoSlug && (
              <p className="text-xs text-muted-foreground">
                Auto-generating from {field.slugifyFrom}. Edit to customize.
              </p>
            )} */}
          </div>
        );

      case 'text':
      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || field.readonly}
            pattern={field.validation?.pattern}
            minLength={field.validation?.min}
            maxLength={field.validation?.max}
          />
        );
    }
  };

  return (
    <div className={cn(
      'space-y-2',
      field.column && `col-span-${Math.min(field.column, 12)}`
    )}>
      {renderInput()}
    </div>
  );
}

// React Hook Form integration
interface WorkspaceFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: Control<TFieldValues>;
  name: TName;
  field: WorkspaceField;
  disabled?: boolean;
  formData?: Record<string, any>;
  isCreateMode?: boolean;
}

export function WorkspaceFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  field,
  disabled = false,
  formData = {},
  isCreateMode = false
}: WorkspaceFormFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field: formField, fieldState }) => (
        <FormItem className={cn(
          field.column && `col-span-${Math.min(field.column, 12)}`
        )}>
          {field.type !== 'boolean' && (
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <DynamicFormField
              field={field}
              value={formField.value}
              onChange={formField.onChange}
              error={fieldState.error?.message}
              disabled={disabled}
              formData={formData}
              isCreateMode={isCreateMode}
            />
          </FormControl>
          {field.type !== 'boolean' && field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Form layout component
interface WorkspaceFormLayoutProps<TFieldValues extends FieldValues = FieldValues> {
  layout: IWorkspaceFormLayout;
  control: Control<TFieldValues>;
  disabled?: boolean;
  isCreateMode?: boolean;
}

export function WorkspaceFormLayout<TFieldValues extends FieldValues = FieldValues>({
  layout,
  control,
  disabled = false,
  isCreateMode = false
}: WorkspaceFormLayoutProps<TFieldValues>) {
  // Watch all form values to pass to fields that need them (like slug)
  const watchedValues = useWatch({ control });

  return (
    <div className="space-y-6">
      {layout.sections ? (
        layout.sections.map((section: any, index: number) => (
          <div key={index} className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </div>
            <div className={cn(
              'grid gap-4',
              `grid-cols-${layout.columns}`
            )}>
              {section.fields.map((fieldKey: string) => {
                const field = layout.fields.find((f: WorkspaceField) => f.key === fieldKey);
                if (!field || field.hidden) return null;

                return (
                  <WorkspaceFormField
                    key={field.key}
                    control={control}
                    name={field.key as any}
                    field={field}
                    disabled={disabled}
                    formData={watchedValues || {}}
                    isCreateMode={isCreateMode}
                  />
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className={cn(
          'grid gap-4',
          `grid-cols-${layout.columns}`
        )}>
          {layout.fields.map((field: WorkspaceField) => {
            if (field.hidden) return null;

            return (
              <WorkspaceFormField
                key={field.key}
                control={control}
                name={field.key as any}
                field={field}
                disabled={disabled}
                formData={watchedValues || {}}
                isCreateMode={isCreateMode}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
