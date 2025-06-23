"use client";

import AttachmentUpload from '@/components/forms/attachment-upload';
import { ModelEditSheet, ModelEditSheetConfig, useModelEditSheetContext } from '@/components/forms/model-edit-sheet';
import { Badge } from '@/components/ui/badge';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FormMode } from '@/types';
import { Course, CourseStatus } from '@/types/course';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Zod validation schema for course
const courseSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must be less than 200 characters'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .min(3, 'Slug must be at least 3 characters')
        .max(200, 'Slug must be less than 200 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
    description: z
        .string()
        .max(1000, 'Description must be less than 1000 characters')
        .optional(),
    category: z
        .string()
        .max(100, 'Category must be less than 100 characters')
        .optional(),
    course_type: z.enum(["free", "paid", "premium"]),
    price: z
        .number()
        .min(0, 'Price must be 0 or greater')
        .optional()
        .nullable(),
    estimated_duration_hours: z
        .number()
        .min(0, 'Duration must be 0 or greater')
        .optional()
        .nullable(),
    thumbnail_id: z
        .number()
        .optional()
        .nullable(),
});

type CourseFormData = z.infer<typeof courseSchema>;

const getStatusColor = (status: CourseStatus) => {
    switch (status) {
        case 'published':
            return 'bg-green-100 text-green-800';
        case 'draft':
            return 'bg-yellow-100 text-yellow-800';
        case 'archived':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

interface CourseEditSheetProps {
    initialRecord: Course | null;
    isOpen: boolean;
    onSaveSuccess?: (record: Course, meta: {
        mode: FormMode;
        message?: string;
        response?: any;
    }) => void;
    onOpenChange?: (state: boolean) => void;
}

// Course form fields component
function CourseFormFields() {
    const { form, isLoading, mode, localRecord } = useModelEditSheetContext<Course, CourseFormData>();

    const watchCourseType = form.watch('course_type');

    return (
        <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Course Details</TabsTrigger>
                <TabsTrigger value="thumbnail">Thumbnail</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
                {/* Title Field */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter course title..."
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormDescription>
                                The main title of your course (3-200 characters)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Slug Field */}
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug *</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="auto-generated-from-title"
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormDescription>
                                URL-friendly version of the title (auto-generated)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Description Field */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Brief description of the course..."
                                    className="resize-none"
                                    rows={4}
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormDescription>
                                Detailed description of the course (max 1000 characters)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Category Field */}
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g., Programming, Design, Business..."
                                    {...field}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormDescription>
                                Course category for organization (max 100 characters)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Course Type Field */}
                <FormField
                    control={form.control}
                    name="course_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Course Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select course type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                Choose the type of course offering
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Price Field - only show for paid/premium courses */}
                {(watchCourseType === 'paid' || watchCourseType === 'premium') && (
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Price ($)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="99.99"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                        value={field.value ?? ''}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Course price in USD
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Duration Field */}
                <FormField
                    control={form.control}
                    name="estimated_duration_hours"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estimated Duration (hours)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    placeholder="10"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                    value={field.value ?? ''}
                                    disabled={isLoading}
                                />
                            </FormControl>
                            <FormDescription>
                                Estimated time to complete the course
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </TabsContent>

            <TabsContent value="thumbnail" className="space-y-4 mt-4">
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Course Thumbnail</h4>
                    <p className="text-sm text-muted-foreground">
                        Upload a high-quality image that represents your course. This will be displayed on course cards and listings.
                    </p>
                </div>
                {mode === 'edit' && localRecord?.id ? (
                    <AttachmentUpload
                        uploadEndpoint={`/lms/courses/${localRecord.id}/upload-file/`}
                        trasnformToBody={(data) => {
                            data.append('attachment_type', "thumbnail");
                            return data;
                        }}
                        acceptedFileTypes={{
                            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg']
                        }}
                        maxFileSize={5 * 1024 * 1024} // 5MB
                        maxFiles={1}
                        multiple={false}
                        disabled={isLoading}
                        label="Upload Course Thumbnail"
                        description="Upload a high-quality image for your course (JPEG, PNG, WebP, SVG)"
                        onUploadSuccess={(attachments) => {
                            if (attachments.length !== 1) {
                                throw new Error('Expected exactly one attachment for thumbnail upload');
                            }
                            form.setValue('thumbnail_id', attachments[0].id, { shouldValidate: true });
                        }}
                        onUploadError={(error: string) => {
                            form.setError('thumbnail_id', { type: 'manual', message: error });
                        }}
                    />
                ) : (
                    <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                        Save the course first to upload thumbnail
                    </div>
                )}
            </TabsContent>
        </Tabs>
    );
}

// Course header component that uses the context
function CourseHeader() {
    const { mode, localRecord } = useModelEditSheetContext<Course, CourseFormData>();

    return (
        <>
            <SheetTitle className="flex items-center gap-2">
                {mode === 'create' ? (
                    <>
                        <Plus className="w-5 h-5" />
                        Create New Course
                    </>
                ) : (
                    <>
                        <Edit className="w-5 h-5" />
                        Edit Course
                        {localRecord && (
                            <Badge className={getStatusColor(localRecord.status)}>
                                {localRecord.status}
                            </Badge>
                        )}
                    </>
                )}
            </SheetTitle>
            <SheetDescription>
                {mode === 'create'
                    ? 'Fill in the details below to create a new course.'
                    : 'Update the course details below.'}
            </SheetDescription>
        </>
    );
}

const CourseEditSheet: React.FC<CourseEditSheetProps> = ({
    initialRecord = null,
    isOpen,
    onSaveSuccess,
    onOpenChange,
}) => {
    const mode = useMemo(() => {
        return initialRecord ? 'edit' : 'create';
    }, [initialRecord]);
    const ready = true;

    const form = useForm<CourseFormData>({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            category: '',
            course_type: 'free',
            price: null,
            estimated_duration_hours: null,
            thumbnail_id: null,
        },
        mode: 'onSubmit',
    });

    // Auto-generate slug from title (only when ready and in create mode)
    const watchTitle = form.watch('title');
    useEffect(() => {
        if (ready && mode === 'create' && watchTitle) {
            const slug = watchTitle
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            if (slug !== form.getValues('slug')) {
                form.setValue('slug', slug, { shouldValidate: true });
            }
        }
    }, [watchTitle, mode, ready, form]);

    // Handle form reset for edit mode
    useEffect(() => {
        if (mode === 'edit' && initialRecord) {
            form.reset({
                title: initialRecord.title || '',
                slug: initialRecord.slug || '',
                description: initialRecord.description || '',
                category: initialRecord.category || '',
                course_type: initialRecord.course_type || 'free',
                price: initialRecord.price || null,
                estimated_duration_hours: initialRecord.estimated_duration_hours || null,
                thumbnail_id: initialRecord.thumbnail?.id || null,
            });
        }
    }, [form, initialRecord, mode]);

    const config: ModelEditSheetConfig<Course, CourseFormData> = {
        apiEndpoint: '/lms/courses/',
        getItemId: (course) => course.id,
        form,
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            category: '',
            course_type: 'free',
            price: null,
            estimated_duration_hours: null,
        },
        title: {
            create: 'Create New Course',
            edit: 'Edit Course',
        },
        description: {
            create: 'Fill in the details below to create a new course.',
            edit: 'Update the course details below.',
        },
        fieldNames: ['title', 'slug', 'description', 'category', 'course_type', 'price', 'estimated_duration_hours'],
        sheetConfig: {
            side: 'right',
        },
    };

    return (
        <ModelEditSheet.Root
            config={config}
            initialRecord={initialRecord}
            isOpen={isOpen}
            onSaveSuccess={onSaveSuccess}
            onOpenChange={onOpenChange}
        >
            <ModelEditSheet.Sheet isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModelEditSheet.Sheet.Header>
                    <CourseHeader />
                </ModelEditSheet.Sheet.Header>

                <ModelEditSheet.FormContent>
                    <CourseFormFields />
                </ModelEditSheet.FormContent>

                <ModelEditSheet.Sheet.Footer />
            </ModelEditSheet.Sheet>
        </ModelEditSheet.Root>
    );
};

export default CourseEditSheet;
