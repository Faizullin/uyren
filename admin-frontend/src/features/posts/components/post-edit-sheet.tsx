"use client";

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
import { SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { FormMode } from '@/types';
import { Post, PublicationStatus } from '@/types/post';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Zod validation schema for post
const postSchema = z.object({
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
    excerpt: z
        .string()
        .max(500, 'Excerpt must be less than 500 characters')
        .optional(),
});

type PostFormData = z.infer<typeof postSchema>;

const getStatusColor = (status: PublicationStatus) => {
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

interface PostEditSheetProps {
    initialRecord: Post | null;
    isOpen: boolean;
    onSaveSuccess?: (record: Post, meta: {
        mode: FormMode;
        message?: string;
        response?: any;
    }) => void;
    onOpenChange?: (state: boolean) => void;
}

// Post form fields component
function PostFormFields() {
    const { form, isLoading } = useModelEditSheetContext<Post, PostFormData>();

    return (
        <>
            {/* Title Field */}
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Enter post title..."
                                {...field}
                                disabled={isLoading}
                            />
                        </FormControl>
                        <FormDescription>
                            The main title of your post (3-200 characters)
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

            {/* Excerpt Field */}
            <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Excerpt</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Brief description of the post..."
                                className="resize-none"
                                rows={3}
                                {...field}
                                disabled={isLoading}
                            />
                        </FormControl>
                        <FormDescription>
                            Short description of the post (max 500 characters)
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    );
}

// Post header component that uses the context
function PostHeader() {
    const { mode, localRecord } = useModelEditSheetContext<Post, PostFormData>();

    return (
        <>
            <SheetTitle className="flex items-center gap-2">
                {mode === 'create' ? (
                    <>
                        <Plus className="w-5 h-5" />
                        Create New Post
                    </>
                ) : (
                    <>
                        <Edit className="w-5 h-5" />
                        Edit Post
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
                    ? 'Fill in the details below to create a new post.'
                    : 'Update the post details below.'}
            </SheetDescription>
        </>
    );
}

const PostEditSheet: React.FC<PostEditSheetProps> = ({
    initialRecord = null,
    isOpen,
    onSaveSuccess,
    onOpenChange,
}) => {
    const mode = useMemo(() => {
        return initialRecord ? 'edit' : 'create';
    }, [initialRecord]);
    const ready = true;
    const form = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: '',
            slug: '',
            excerpt: '',
        },
        mode: 'onSubmit',
    });    // Auto-generate slug from title (only when ready and in create mode)
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
    }, [watchTitle, mode, ready]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle form reset for edit mode
    useEffect(() => {
        if (mode === 'edit' && initialRecord) {
            form.reset({
                title: initialRecord.title || '',
                slug: initialRecord.slug || '',
                excerpt: initialRecord.excerpt || '',
            });
        }
    }, [form, initialRecord, mode]);


    const config: ModelEditSheetConfig<Post, PostFormData> = {
        apiEndpoint: '/cms/posts/',
        getItemId: (post) => post.id,
        form,
        defaultValues: {
            title: '',
            slug: '',
            excerpt: '',
        },
        title: {
            create: 'Create New Post',
            edit: 'Edit Post',
        },
        description: {
            create: 'Fill in the details below to create a new post.',
            edit: 'Update the post details below.',
        },
        fieldNames: ['title', 'slug', 'excerpt',],
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
                    <PostHeader />
                </ModelEditSheet.Sheet.Header>

                <ModelEditSheet.FormContent>
                    <PostFormFields />
                </ModelEditSheet.FormContent>

                <ModelEditSheet.Sheet.Footer />
            </ModelEditSheet.Sheet>
        </ModelEditSheet.Root>
    );
};

export default PostEditSheet;
