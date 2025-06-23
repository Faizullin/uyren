"use client";

import { Heading } from "@/components/common/heading";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import DeleteConfirmDialog from "@/components/resource/delete-confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useDataTable } from "@/hooks/use-data-table";
import { api } from "@/lib/api";
import { DRFErrorHandler } from "@/lib/drf-error-utils";
import { showToast } from "@/lib/error-handler";
import { cn } from "@/lib/utils";
import { PaginatedData } from "@/types";
import { Post } from "@/types/post";
import { IconPlus } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Column, ColumnDef } from "@tanstack/react-table";
import { CheckCircle, Edit, MoreHorizontal, Text, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import PostEditSheet from "./post-edit-sheet";

// Enhanced action types for better state management
type PostActionType = 'create' | 'edit' | 'delete' | 'view';

interface PostAction {
    type: PostActionType;
    post?: Post;
    isOpen: boolean;
}

export default function PostListPage() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [title] = useQueryState("title", parseAsString.withDefault(""));
    const [postType] = useQueryState(
        "post_type",
        parseAsArrayOf(parseAsString).withDefault([]),
    );

    // Enhanced state management for different actions
    const [currentAction, setCurrentAction] = useState<PostAction>({
        type: 'create',
        post: undefined,
        isOpen: false,
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

    const {
        data,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["posts", queryParams],
        queryFn: () => api.get<PaginatedData<Post>>(`/cms/posts/`, {
            params: queryParams,
        }),
    });

    // Enhanced delete mutation with better error handling
    const deleteMutation = useMutation({
        mutationFn: (id: Post["id"]) => api.delete(`/cms/posts/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts", queryParams] });
            closeAction();
            showToast("success", {
                message: `Post deleted successfully`,
            });
        },
        onError: (error) => {
            DRFErrorHandler.handle(error)
            showToast("error", {
                message: 'Failed to delete post. Please try again.',
            });
        },
    });

    // Action handlers with enhanced logic
    const openCreateSheet = useCallback(() => {
        setCurrentAction({
            type: 'create',
            post: undefined,
            isOpen: true,
        });
    }, []);

    const openEditSheet = useCallback((post: Post) => {
        setCurrentAction({
            type: 'edit',
            post,
            isOpen: true,
        });
    }, []);

    const openDeleteDialog = useCallback((post: Post) => {
        setCurrentAction({
            type: 'delete',
            post,
            isOpen: true,
        });
    }, []);

    const closeAction = useCallback(() => {
        setCurrentAction(prev => ({
            ...prev,
            isOpen: false,
        }));
    }, []);

    const openEditContent = useCallback((post: Post) => {
        router.push(`/dashboard/posts/${post.id}/edit-content`);
    }, [router]);

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback(async () => {
        if (currentAction.post) {
            deleteMutation.mutate(currentAction.post.id);
        }
    }, [currentAction.post, deleteMutation]);

    const columns = useMemo<ColumnDef<Post>[]>
        (() => [
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
                            onClick={() => openEditSheet(post)}
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
                cell: ({ row }) => {
                    const post = row.original;
                    return (
                        <Button
                            variant="ghost"
                            className="h-auto p-0 text-left justify-start"
                            onClick={() => openEditSheet(post)}
                        >
                            <div className="truncate max-w-[200px]">
                                {post.title || 'Untitled'}
                            </div>
                        </Button>
                    );
                },
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
                id: "status",
                accessorKey: "status",
                header: ({ column }: { column: Column<Post, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Status" />
                ),
                cell: ({ cell }) => {
                    const status = cell.getValue<Post["status"]>();
                    const getStatusConfig = (status: Post["status"]) => {
                        switch (status) {
                            case "published":
                                return {
                                    variant: "default" as const,
                                    icon: CheckCircle,
                                    className: "text-green-700 bg-green-100",
                                };
                            case "draft":
                                return {
                                    variant: "secondary" as const,
                                    icon: XCircle,
                                    className: "text-yellow-700 bg-yellow-100",
                                };
                            case "archived":
                                return {
                                    variant: "outline" as const,
                                    icon: XCircle,
                                    className: "text-gray-700 bg-gray-100",
                                };
                            default:
                                return {
                                    variant: "secondary" as const,
                                    icon: XCircle,
                                    className: "text-gray-700 bg-gray-100",
                                };
                        }
                    };

                    const config = getStatusConfig(status);
                    const Icon = config.icon;

                    return (
                        <Badge
                            variant={config.variant}
                            className={cn("flex w-fit items-center gap-1", config.className)}
                        >
                            <Icon className="h-3 w-3" />
                            {status?.charAt(0).toUpperCase() + status?.slice(1)}
                        </Badge>
                    );
                },
                meta: {
                    label: "Status",
                    options: [
                        { label: "Published", value: "published" },
                        { label: "Draft", value: "draft" },
                        { label: "Archived", value: "archived" },
                    ],
                    variant: "select",
                },
                enableSorting: false,
                enableColumnFilter: true,
            },
            {
                id: "author",
                accessorKey: "author.username",
                header: ({ column }: { column: Column<Post, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Author" />
                ),
                cell: ({ cell }) => {
                    const authorName = cell.getValue() as string;
                    return <div>{authorName}</div>;
                },
                enableSorting: false,
                enableColumnFilter: false,
            },
            {
                id: "created_at",
                accessorKey: "created_at",
                header: ({ column }: { column: Column<Post, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Created" />
                ),
                cell: ({ cell }) => {
                    const date = cell.getValue<string>();
                    return (
                        <div className="text-sm text-muted-foreground">
                            {date ? new Date(date).toLocaleDateString() : '-'}
                        </div>
                    );
                },
                enableSorting: true,
                enableColumnFilter: false,
            },
            {
                id: "actions",
                cell: ({ row }) => {
                    const post = row.original;

                    return (
                        <div className="flex items-center gap-2">
                            {/* Quick Edit Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditSheet(post)}
                                className="h-8 w-8 p-0"
                            >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit post</span>
                            </Button>

                            {/* Dropdown Menu for More Actions */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]">
                                    <DropdownMenuItem
                                        onSelect={() => openEditContent(post)}
                                        className="cursor-pointer"
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Content
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onSelect={() => openDeleteDialog(post)}
                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete post
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
                enableSorting: false,
                enableHiding: false,
                size: 100,
            },
        ],
            [openEditSheet, openDeleteDialog, openEditContent]
        );

    const pageCount = useMemo(() => {
        return Math.ceil((data?.count ?? 0) / (data?.count ?? 10));
    }, [data]);

    const { table } = useDataTable({
        data: data?.results ?? [],
        columns,
        pageCount,
        initialState: {
            sorting: [{ id: "created_at", desc: true }],
            columnPinning: { right: ["actions"] },
        },
        getRowId: (row) => `${row.id}`,
    });

    if (error) {
        return <div className="flex justify-center p-8 text-red-500">Error loading posts</div>;
    }

    return (
        <>
            <div className='flex items-start justify-between'>
                <Heading
                    title='Posts'
                    description='Manage your posts and pages with advanced filtering and actions.'
                />
                <Button onClick={openCreateSheet}>
                    <IconPlus className='mr-2 h-4 w-4' />
                    Create Post
                </Button>
            </div>
            <Separator />

            <div className="data-table-container">
                {isLoading ? (
                    <DataTableSkeleton columnCount={7} rowCount={8} filterCount={2} />
                ) : (
                    <DataTable table={table}>
                        <DataTableToolbar table={table} />
                    </DataTable>
                )}
            </div>

            {/* Enhanced Create/Edit Post Sheet */}
            <PostEditSheet
                initialRecord={currentAction.post || null}
                isOpen={currentAction.isOpen && (currentAction.type === 'create' || currentAction.type === 'edit')}
                onSaveSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["posts", queryParams] });
                    closeAction();
                }}
                onOpenChange={(v) => !v && closeAction()}
            />

            {/* Enhanced Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                open={currentAction.isOpen && currentAction.type === 'delete'}
                onOpenChange={closeAction}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}