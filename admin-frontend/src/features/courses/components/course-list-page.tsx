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
import { Course } from "@/types/course";
import { IconPlus } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Column, ColumnDef } from "@tanstack/react-table";
import { CheckCircle, Clock, DollarSign, Edit, Eye, Grid, List, MoreHorizontal, Text, Trash2, XCircle } from "lucide-react";
import Image from "next/image";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import CourseEditSheet from "./course-edit-sheet";

// Enhanced action types for better state management
type CourseActionType = 'create' | 'edit' | 'delete' | 'view';
type ViewMode = 'table' | 'grid';

interface CourseAction {
    type: CourseActionType;
    course?: Course;
    isOpen: boolean;
}

export default function CourseListPage() {
    const queryClient = useQueryClient();
    const [title] = useQueryState("title", parseAsString.withDefault(""));
    const [courseType] = useQueryState(
        "course_type",
        parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [status] = useQueryState(
        "status",
        parseAsArrayOf(parseAsString).withDefault([]),
    );
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    // Enhanced state management for different actions
    const [currentAction, setCurrentAction] = useState<CourseAction>({
        type: 'create',
        course: undefined,
        isOpen: false,
    });

    const queryParams = useMemo(() => {
        const params: Record<string, string | string[]> = {};
        if (title) {
            params.title = title;
        }
        if (courseType.length > 0) {
            params.course_type = courseType;
        }
        if (status.length > 0) {
            params.status = status;
        }
        return params;
    }, [title, courseType, status]);

    const {
        data,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["courses", queryParams],
        queryFn: () => api.get<PaginatedData<Course>>(`/lms/courses/`, {
            params: queryParams,
        }),
    });

    // Enhanced delete mutation with better error handling
    const deleteMutation = useMutation({
        mutationFn: (id: Course["id"]) => api.delete(`/lms/courses/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses", queryParams] });
            closeAction();
            showToast("success", {
                message: `Course deleted successfully`,
            });
        },
        onError: (error) => {
            DRFErrorHandler.handle(error)
            showToast("error", {
                message: 'Failed to delete course. Please try again.',
            });
        },
    });

    // Action handlers with enhanced logic
    const openCreateSheet = useCallback(() => {
        setCurrentAction({
            type: 'create',
            course: undefined,
            isOpen: true,
        });
    }, []);

    const openEditSheet = useCallback((course: Course) => {
        setCurrentAction({
            type: 'edit',
            course,
            isOpen: true,
        });
    }, []);

    const openDeleteDialog = useCallback((course: Course) => {
        setCurrentAction({
            type: 'delete',
            course,
            isOpen: true,
        });
    }, []);

    const closeAction = useCallback(() => {
        setCurrentAction(prev => ({
            ...prev,
            isOpen: false,
        }));
    }, []);

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback(async () => {
        if (currentAction.course) {
            deleteMutation.mutate(currentAction.course.id);
        }
    }, [currentAction.course, deleteMutation]);

    const columns = useMemo<ColumnDef<Course>[]>
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
                header: ({ column }: { column: Column<Course, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Id" />
                ),
                cell: ({ row }) => {
                    const course = row.original;
                    return (
                        <Button
                            variant={"link"}
                            className={cn("w-full cursor-pointer")}
                            onClick={() => openEditSheet(course)}
                        >
                            {course.id}
                        </Button>
                    );
                },
                size: 32,
                enableHiding: false,
            },
            {
                id: "title",
                accessorKey: "title",
                header: ({ column }: { column: Column<Course, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Title" />
                ),
                cell: ({ row }) => {
                    const course = row.original;
                    return (
                        <Button
                            variant="ghost"
                            className="h-auto p-0 text-left justify-start"
                            onClick={() => openEditSheet(course)}
                        >
                            <div className="truncate max-w-[200px]">
                                {course.title || 'Untitled'}
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
                id: "course_type",
                accessorKey: "course_type",
                header: ({ column }: { column: Column<Course, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Type" />
                ),
                cell: ({ cell }) => {
                    const courseType = cell.getValue<Course["course_type"]>();
                    const getTypeColor = (type: Course["course_type"]) => {
                        switch (type) {
                            case "free":
                                return "bg-green-100 text-green-800";
                            case "paid":
                                return "bg-blue-100 text-blue-800";
                            case "premium":
                                return "bg-purple-100 text-purple-800";
                            default:
                                return "bg-gray-100 text-gray-800";
                        }
                    };
                    return (
                        <Badge
                            variant="secondary"
                            className={cn("capitalize", getTypeColor(courseType))}
                        >
                            {courseType}
                        </Badge>
                    );
                },
                meta: {
                    label: "Type",
                    options: [
                        { label: "Free", value: "free" },
                        { label: "Paid", value: "paid" },
                        { label: "Premium", value: "premium" },
                    ],
                    variant: "select",
                },
                enableSorting: false,
                enableColumnFilter: true,
            },
            {
                id: "price",
                accessorKey: "price",
                header: ({ column }: { column: Column<Course, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Price" />
                ),
                cell: ({ cell }) => {
                    const price = cell.getValue<number>();
                    return (
                        <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {price ? `${price}` : 'Free'}
                        </div>
                    );
                },
                enableSorting: true,
                enableColumnFilter: false,
            },
            {
                id: "estimated_duration_hours",
                accessorKey: "estimated_duration_hours",
                header: ({ column }: { column: Column<Course, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Duration" />
                ),
                cell: ({ cell }) => {
                    const duration = cell.getValue<number>();
                    return (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {duration ? `${duration}h` : '-'}
                        </div>
                    );
                },
                enableSorting: true,
                enableColumnFilter: false,
            },
            {
                id: "status",
                accessorKey: "status",
                header: ({ column }: { column: Column<Course, unknown> }) => (
                    <DataTableColumnHeader column={column} title="Status" />
                ),
                cell: ({ cell }) => {
                    const status = cell.getValue<Course["status"]>();
                    const getStatusConfig = (status: Course["status"]) => {
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
                id: "created_at",
                accessorKey: "created_at",
                header: ({ column }: { column: Column<Course, unknown> }) => (
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
                    const course = row.original;

                    return (
                        <div className="flex items-center gap-2">
                            {/* Quick Edit Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditSheet(course)}
                                className="h-8 w-8 p-0"
                            >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit course</span>
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
                                        onSelect={() => openDeleteDialog(course)}
                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete course
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
            [openEditSheet, openDeleteDialog]
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

    // Course Card Component for Grid View
    function CourseCard({ course, onEdit, onDelete }: {
        course: Course;
        onEdit: (course: Course) => void;
        onDelete: (course: Course) => void;
    }) {
        const getStatusConfig = (status: Course["status"]) => {
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

        const getTypeColor = (type: Course["course_type"]) => {
            switch (type) {
                case "free":
                    return "bg-green-100 text-green-800";
                case "paid":
                    return "bg-blue-100 text-blue-800";
                case "premium":
                    return "bg-purple-100 text-purple-800";
                default:
                    return "bg-gray-100 text-gray-800";
            }
        }; const statusConfig = getStatusConfig(course.status);
        const StatusIcon = statusConfig.icon;

        return (
            <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Thumbnail */}
                {course.thumbnail && (
                    <div className="aspect-video w-full bg-muted relative overflow-hidden">
                        <Image
                            width={300}
                            height={200}
                            src={course.thumbnail?.url || ""}
                            alt={course.title || 'Course thumbnail'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Hide image on error
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2 overflow-hidden text-ellipsis">
                                {course.title || 'Untitled Course'}
                            </h3>
                            <div className="flex gap-2 mb-2">
                                <Badge
                                    variant="secondary"
                                    className={cn("capitalize", getTypeColor(course.course_type))}
                                >
                                    {course.course_type}
                                </Badge>
                                <Badge
                                    variant={statusConfig.variant}
                                    className={cn("flex w-fit items-center gap-1", statusConfig.className)}
                                >
                                    <StatusIcon className="h-3 w-3" />
                                    {course.status?.charAt(0).toUpperCase() + course.status?.slice(1)}
                                </Badge>
                            </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem
                                    onSelect={() => onEdit(course)}
                                    className="cursor-pointer"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Course
                                </DropdownMenuItem>                                <DropdownMenuItem
                                    onSelect={() => onDelete(course)}
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Course
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Description */}
                    {course.description && (
                        <p className="text-sm text-muted-foreground mb-4 overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {course.description}
                        </p>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {course.price !== null && course.price !== undefined ? (
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    ${course.price}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Free
                                </div>
                            )}
                            {course.estimated_duration_hours && (
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {course.estimated_duration_hours}h
                                </div>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(course)}
                            className="flex items-center gap-2"
                        >
                            <Eye className="h-3 w-3" />
                            View
                        </Button>
                    </div>
                </div>
            </div>
        );
    } if (error) {
        return <div className="flex justify-center p-8 text-red-500">Error loading courses</div>;
    }

    return (
        <>
            <div className='flex items-start justify-between'>
                <Heading
                    title='Courses'
                    description='Manage your courses with advanced filtering and actions.'
                />
                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center border border-border rounded-md p-1">
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="h-7 px-2"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="h-7 px-2"
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={openCreateSheet}>
                        <IconPlus className='mr-2 h-4 w-4' />
                        Create Course
                    </Button>
                </div>
            </div>
            <Separator />

            {viewMode === 'table' ? (
                <div className="data-table-container">
                    {isLoading ? (
                        <DataTableSkeleton columnCount={8} rowCount={8} filterCount={3} />
                    ) : (
                        <DataTable table={table}>
                            <DataTableToolbar table={table} />
                        </DataTable>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Grid View Header */}
                    <div className="flex gap-4 items-center">
                        <div className="text-sm text-muted-foreground">
                            {data?.count || 0} courses found
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-card border border-border rounded-lg p-6">
                                    <div className="space-y-4">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                        <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="flex justify-between">
                                            <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                                            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : data?.results && data.results.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data.results.map((course) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    onEdit={openEditSheet}
                                    onDelete={openDeleteDialog}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="text-muted-foreground mb-4">No courses found</div>
                            <Button onClick={openCreateSheet}>
                                <IconPlus className='mr-2 h-4 w-4' />
                                Create Your First Course
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Enhanced Create/Edit Course Sheet */}
            <CourseEditSheet
                initialRecord={currentAction.course || null}
                isOpen={currentAction.isOpen && (currentAction.type === 'create' || currentAction.type === 'edit')}
                onSaveSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["courses", queryParams] });
                    closeAction();
                }}
                onOpenChange={(v: boolean) => !v && closeAction()}
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
