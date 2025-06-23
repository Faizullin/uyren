import NiceModal, { NiceModalHocPropsExtended } from "@/contexts/nice-modal-context";
import { FieldItem } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CODE_BLOCK_LANGUAGUES } from "../editor/TiptapEditor/constants/code-languages";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "../ui/form";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export interface Settings {
    language: string;
    can_run: boolean;
    can_edit: boolean;
    can_open_editor: boolean;
    render_type?: "code" | "visual";
}

const settingsSchema = z.object({
    language: z.string().min(1, "Language is required"),
    can_run: z.boolean().default(false),
    can_edit: z.boolean().default(false),
    can_open_editor: z.boolean().default(false),
    render_type: z.enum(["code", "visual"]).optional().default("code"),
});

// Popular programming languages
const LANGUAGES: FieldItem[] = CODE_BLOCK_LANGUAGUES.map(item => ({
    label: item.label, value: item.syntax
}));

export const CodeBlockSettingsNiceDialog = NiceModal.create<NiceModalHocPropsExtended<{
    args: {
        settings: Settings;
    }
}>>(({ args }) => {
    const modal = NiceModal.useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            language: args.settings.language || "javascript",
            can_run: args.settings.can_run || false,
            can_edit: args.settings.can_edit || false,
            can_open_editor: args.settings.can_open_editor || false,
            render_type: args.settings?.render_type || "code",
        },
    });

    const handleClose = () => {
        modal.resolve()
        modal.hide();
    };

    const onSubmit = async (data: Settings) => {
        setIsSubmitting(true);
        try {
            // Resolve with the updated settings
            modal.resolve({
                result: {
                    record: data,
                },
            });
            modal.hide();
        } catch (error) {
            console.error("Error saving settings:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={modal.visible} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Code Block Settings</DialogTitle>
                    <DialogDescription>
                        Configure the settings for this code block including language, permissions, and rendering options.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Language Selection */}
                            <FormField
                                control={form.control}
                                name="language"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Programming Language</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a programming language" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {LANGUAGES.map((lang) => (
                                                    <SelectItem key={lang.value} value={lang.value}>
                                                        {lang.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Choose the programming language for syntax highlighting.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            {/* Render Type */}
                            <FormField
                                control={form.control}
                                name="render_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Render Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select render type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="code">Code View</SelectItem>
                                                <SelectItem value="visual">Visual View</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Choose how the code block should be rendered.
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            {/* Permissions Section */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium">Permissions</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Configure what actions are allowed for this code block.
                                    </p>
                                </div>

                                {/* Can Run */}
                                <FormField
                                    control={form.control}
                                    name="can_run"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Allow Code Execution</FormLabel>
                                                <FormDescription>
                                                    Users can run this code block in a sandbox environment.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                {/* Can Edit */}
                                <FormField
                                    control={form.control}
                                    name="can_edit"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Allow Inline Editing</FormLabel>
                                                <FormDescription>
                                                    Users can edit the code directly in the block.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                {/* Can Open Editor */}
                                <FormField
                                    control={form.control}
                                    name="can_open_editor"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Allow External Editor</FormLabel>
                                                <FormDescription>
                                                    Users can open this code in a full-featured editor.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Saving..." : "Save Settings"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
});