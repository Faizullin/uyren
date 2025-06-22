"use client";

import { Heading } from "@/components/common/heading";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDataTable } from "@/hooks/use-data-table";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Post } from "@/types/post";
import { IconPlus } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Column, ColumnDef } from "@tanstack/react-table";
import { CheckCircle, MoreHorizontal, Text, XCircle } from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useCallback, useMemo, useState } from "react";



// API functions that use the Django backend
const fetchPosts = async (params: any): Promise<Post[]> => {
    try {
        const response = await api.get(`/cms/posts/`, {
            params,
        });
        if (response && typeof response === 'object' && 'results' in response) {
            return (response as { results: Post[] }).results;
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        return [];
    }
};

const createPost = async (post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<Post> => {
    // Set post_type and generic_key as required by the CMS
    const postData = {
        ...post,
        post_type: post.post_type || "post",
        generic_key: post.generic_key || "post", // Set as "post" for CMS compatibility
    };
    return await api.post<Post>(`/cms/posts/`, postData);
};

const updatePost = async (id: string, post: Partial<Post>): Promise<Post> => {
    return await api.patch<Post>(`/cms/posts/${id}/`, post);
};

const deletePost = async (id: string): Promise<void> => {
    await api.delete(`/cms/posts/${id}/`);
    console.log(`Deleting post with ID: ${id}`);
};

export default function PostListPage() {
    const queryClient = useQueryClient();
    const [title] = useQueryState("title", parseAsString.withDefault(""));
    const [postType] = useQueryState(
        "post_type",
        parseAsArrayOf(parseAsString).withDefault([]),
    );

    // State for sheet dialogs
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
    const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [editForm, setEditForm] = useState({
        title: "",
        content: "",
        slug: "",
        is_published: false,
        post_type: "post",
        generic_key: "",
    });


    const queryParams = useMemo(() => {
        const params: Record<string, string | string[]> = {};
        if (title) {
            params.title = title;
        }
        if (postType.length > 0) {
            params.post_type = postType;
        }
        return params;
    }, [title, postType]);

    // TanStack Query for fetching posts
    const {
        data: posts = [],
        isLoading,
        error,
    } = useQuery<Post[]>({
        queryKey: ["posts", queryParams],
        queryFn: () => fetchPosts(queryParams),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (postData: Omit<Post, 'id' | 'created_at' | 'updated_at'>) =>
            createPost(postData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            setIsCreateSheetOpen(false);
            console.log("Post created successfully");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, ...data }: { id: string } & Partial<Post>) =>
            updatePost(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            setIsEditSheetOpen(false);
            console.log("Post updated successfully");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deletePost(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            setIsDeleteSheetOpen(false);
            console.log("Post deleted successfully");
        },
    });

    // Handle form submissions
    const handleCreate = () => {
        createMutation.mutate(editForm);
    };

    const handleUpdate = () => {
        if (selectedPost) {
            updateMutation.mutate({ id: selectedPost.id, ...editForm });
        }
    };

    const handleDelete = () => {
        if (selectedPost) {
            deleteMutation.mutate(selectedPost.id);
        }
    };

    // Open edit sheet with selected post data
    const openEditSheet = useCallback((post: Post) => {
        setSelectedPost(post);
        setEditForm({
            title: post.title,
            content: post.content || "",
            slug: post.slug,
            is_published: post.is_published,
            post_type: post.post_type,
            generic_key: post.generic_key || "",
        });
        setIsEditSheetOpen(true);
    }, []);

    // Open delete confirmation sheet
    const openDeleteSheet = (post: Post) => {
        setSelectedPost(post);
        setIsDeleteSheetOpen(true);
    };

    // Reset form for create
    const openCreateSheet = () => {
        setEditForm({
            title: "",
            content: "",
            slug: "",
            is_published: false,
            post_type: "post",
            generic_key: "",
        });
        setIsCreateSheetOpen(true);
    }; const columns = useMemo<ColumnDef<Post>[]>(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() ||
                            (table.getIsSomePageRowsSelected() && "indeterminate")
                        }
                        onCheckedChange={(value) =>
                            table.toggleAllPageRowsSelected(!!value)
                        }
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
            },
            {
                id: "id",
                header: ({ column }: { column: Column<Post, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Id" />
                ),
                cell: ({ row }) => {
                    const post = row.original;
                    return (
                        <Button
                            variant={"link"}
                            className={cn("w-full cursor-pointer")}
                            onClick={(e) => {
                                openEditSheet(post); // Open edit sheet
                            }}
                        >
                            {post.id}
                        </Button>
                    );
                },
                size: 32,
                enableHiding: false,
            },
            {
                id: "title",
                accessorKey: "title",
                header: ({ column }: { column: Column<Post, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Title" />
                ),
                cell: ({ cell }) => <div>{cell.getValue<Post["title"]>()}</div>,
                meta: {
                    label: "Title",
                    placeholder: "Search titles...",
                    variant: "text",
                    icon: Text,
                },
                enableSorting: false,
                enableColumnFilter: true,
            },
            {
                id: "post_type",
                accessorKey: "post_type",
                header: ({ column }: { column: Column<Post, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Type" />
                ),
                cell: ({ cell }) => {
                    const postType = cell.getValue<Post["post_type"]>();
                    return (
                        <Badge
                            variant={postType === "page" ? "default" : "secondary"}
                            className="capitalize"
                        >
                            {postType}
                        </Badge>
                    );
                },
                meta: {
                    label: "Type",
                    options: [
                        { label: "Post", value: "post" },
                        { label: "Page", value: "page" },
                    ],
                    variant: "select",
                },
                enableSorting: false,
                enableColumnFilter: true,
            },
            {
                id: "is_published",
                accessorKey: "is_published",
                header: ({ column }: { column: Column<Post, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Status" />
                ),
                cell: ({ cell }) => {
                    const isPublished = cell.getValue<Post["is_published"]>();
                    return (
                        <Badge
                            variant={isPublished ? "default" : "destructive"}
                            className="flex w-fit items-center gap-1"
                        >
                            {isPublished ? (
                                <CheckCircle className="h-3 w-3" />
                            ) : (
                                <XCircle className="h-3 w-3" />
                            )}
                            {isPublished ? "Published" : "Draft"}
                        </Badge>
                    );
                },
                meta: {
                    label: "Status",
                    options: [
                        { label: "Published", value: "true" },
                        { label: "Draft", value: "false" },
                    ],
                    variant: "select",
                },
                enableSorting: false,
                enableColumnFilter: true,
            },
            {
                id: "author",
                accessorKey: "author.display_name",
                header: ({ column }: { column: Column<Post, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Author" />
                ),
                cell: ({ cell }) => {
                    const authorName = cell.getValue<string>();
                    return <div>{authorName || "Unknown"}</div>;
                },
                enableSorting: false,
                enableColumnFilter: false,
            },
            {
                id: "actions",
                cell: ({ row }) => {
                    const post = row.original;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditSheet(post)}>
                                    Edit post
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDeleteSheet(post)}>
                                    Delete post
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
                enableSorting: false,
                enableHiding: false,
            },
        ],
        [openEditSheet, openDeleteSheet]
    ); const { table } = useDataTable({
        data: posts,
        columns,
        pageCount: 1,
        initialState: {
            sorting: [{ id: "title", desc: true }],
            columnPinning: { right: ["actions"] },
        },
        getRowId: (row) => row.id,
    });

    if (error) {
        return <div className="flex justify-center p-8 text-red-500">Error loading posts</div>;
    } return (
        <>
            <div className='flex items-start justify-between'>
                <Heading
                    title='Products'
                    description='Manage products (Server side table functionalities.)'
                />
                <Button
                    onClick={openCreateSheet}
                >
                    <IconPlus className='mr-2 h-4 w-4' /> Add New
                </Button>
            </div>
            <Separator />
            <div className="data-table-container">
                {isLoading ?
                    <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
                    : (
                        <DataTable table={table} >
                            <DataTableToolbar table={table} />
                        </DataTable>)}
            </div>

            {/* Create/Edit Post Sheet */}
            <Sheet open={isCreateSheetOpen || isEditSheetOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsCreateSheetOpen(false);
                    setIsEditSheetOpen(false);
                }
            }}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>
                            {isCreateSheetOpen ? "Create New Post" : "Edit Post"}
                        </SheetTitle>
                        <SheetDescription>
                            {isCreateSheetOpen
                                ? "Fill in the details to create a new post."
                                : "Make changes to the post below."
                            }
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Post title"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={editForm.slug}
                                onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                                placeholder="post-slug"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="content">Content</Label>
                            <Input
                                id="content"
                                value={editForm.content}
                                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Post content"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="post_type">Post Type</Label>
                            <Select
                                value={editForm.post_type}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, post_type: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select post type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="post">Post</SelectItem>
                                    <SelectItem value="page">Page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="generic_key">Generic Key</Label>
                            <Input
                                id="generic_key"
                                value={editForm.generic_key}
                                onChange={(e) => setEditForm(prev => ({ ...prev, generic_key: e.target.value }))}
                                placeholder="Optional key"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_published"
                                checked={editForm.is_published}
                                onCheckedChange={(checked) =>
                                    setEditForm(prev => ({ ...prev, is_published: !!checked }))
                                }
                            />
                            <Label htmlFor="is_published">Published</Label>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button
                            type="submit"
                            onClick={isCreateSheetOpen ? handleCreate : handleUpdate}
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {isCreateSheetOpen ? "Create Post" : "Update Post"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Sheet */}
            <Sheet open={isDeleteSheetOpen} onOpenChange={setIsDeleteSheetOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Delete Post</SheetTitle>
                        <SheetDescription>
                            Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.
                        </SheetDescription>
                    </SheetHeader>
                    <SheetFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsDeleteSheetOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            Delete Post
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}