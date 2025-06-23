"use client";

import { Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ReactNode, useMemo, useTransition } from "react";


interface DeleteConfirmDialogProps
    extends React.ComponentPropsWithoutRef<typeof Dialog> {
    onConfirm: () => Promise<void>;
    items?: any[];
    options?: {
        multiple?: boolean;
        message?: string | ReactNode;
        title?: string;
    }
}

export default function DeleteConfirmDialog({
    onConfirm,
    items,
    options,
    ...props
}: DeleteConfirmDialogProps) {
    const [isDeletePending, startDeleteTransition] = useTransition();
    const isDesktop = useMediaQuery();

    function onDelete() {
        startDeleteTransition(async () => {
            onConfirm();
        });
    }

    const titleMsg = options?.title || "Are you absolutely sure?";
    const descriptionMsg = useMemo(() => {
        if (options?.message) {
            return options.message;
        }
        if (options?.multiple && items && items.length > 0) {
            return `This action cannot be undone. This will permanently delete your ${items.length} ${items.length === 1 ? "item" : "items"
                } from our servers.`;
        }
        return "This action cannot be undone. This will permanently delete the selected items from our servers.";
    }, [options, items]);

    if (isDesktop) {
        return (
            <Dialog {...props}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{titleMsg}</DialogTitle>
                        <DialogDescription>
                            {descriptionMsg}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:space-x-0">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            aria-label="Delete selected rows"
                            variant="destructive"
                            onClick={onDelete}
                            disabled={isDeletePending}
                        >
                            {isDeletePending && (
                                <Loader
                                    className="mr-2 size-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer {...props}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>{titleMsg}</DrawerTitle>
                    <DrawerDescription>
                        {descriptionMsg}
                    </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter className="gap-2 sm:space-x-0">
                    <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                    <Button
                        aria-label="Delete selected rows"
                        variant="destructive"
                        onClick={onDelete}
                        disabled={isDeletePending}
                    >
                        {isDeletePending && (
                            <Loader className="mr-2 size-4 animate-spin" aria-hidden="true" />
                        )}
                        Delete
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}