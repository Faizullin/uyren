"use client";

import TiptapEditor, { TiptapEditorRef } from "@/components/editor/TiptapEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/lib/error-handler";
import { Log } from "@/lib/log";
import { DocumentId } from "@/types/document";
import { PublicationStatus } from "@/types/post";
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from "@tanstack/react-query";
import { FileText, Globe, Loader2, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { PostEditorService } from "../post-editor-service";
import "./styles.css";
import { CodeExecutionProvider } from "@/components/code/code-block/context";

const formSchema = z.object({
  content: z.string().optional(),
});


const loadJSONContent = (content: string) => {
  try {
    const str = JSON.parse(content);
    return {
      content: str.content || "",
      success: true,
    };
  } catch (error) {
    Log.error('Failed to parse content as JSON, treating as plain text:', error);
    showToast("error", {
      message: "Failed to load post content. Please try again."
    });
    return {
      content: "",
      success: false,
    };
  }
}

const saveJSONContent = (content: any) => {
  try {
    const jsonContent = JSON.stringify({ content, render_type: 'json' });
    return jsonContent;
  } catch (error) {
    Log.error('Failed to convert content to JSON:', error);
    showToast("error", {
      message: "Failed to save post content. Please try again."
    });
    return "";
  }
}


interface PostContentEditorPageProps {
  postId: DocumentId;
}

// Skeleton component for the editor
function EditorSkeleton() {
  return (
    <div className="flex flex-col space-y-4 p-6 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-40 w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-32 w-full rounded-md" />
    </div>
  );
}

export default function PostContentEditorPage(props: PostContentEditorPageProps) {
  const editorRef = useRef<TiptapEditorRef>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [postStatus, setPostStatus] = useState<PublicationStatus>('draft');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: ""
    }
  });
  // Load post content mutation
  const loadPostMutation = useMutation({
    mutationFn: () => PostEditorService.loadPostContent(props.postId), onSuccess: (response) => {
      if (response && response.content) {
        const result = loadJSONContent(response.content);
        if (result.success) {
          editorRef.current!.getInstance()!.commands.setContent(result.content, true);
          setPostStatus(response.instance.status);
        }
      } else {
        form.reset({ content: '' });
      }
      setContentLoaded(true);
    },
    onError: (error) => {
      Log.error('Load error:', error);
      showToast("error", {
        message: "Failed to load post content. Please try again."
      });
      setContentLoaded(true);
    },
  });
  // Save post content mutation
  const savePostMutation = useMutation({
    mutationFn: (content: string) => PostEditorService.savePostContent(props.postId, content),
    onSuccess: () => {
      showToast("success", {
        message: "Post content saved successfully!"
      });
    },
    onError: (error) => {
      Log.error('Save error:', error);
      showToast("error", {
        message: "Failed to save post content. Please try again."
      });
    },
  });

  // Publish post mutation
  const publishPostMutation = useMutation({
    mutationFn: (status: PublicationStatus) => PostEditorService.publishPost(props.postId, status),
    onSuccess: (updatedPost) => {
      setPostStatus(updatedPost.status);
      const statusText = updatedPost.status === 'published' ? 'published' :
        updatedPost.status === 'draft' ? 'saved as draft' : 'archived';
      showToast("success", {
        message: `Post ${statusText} successfully!`
      });
    },
    onError: (error) => {
      Log.error('Publish error:', error);
      showToast("error", {
        message: "Failed to update post status. Please try again."
      });
    },
  });

  const { mutateAsync: loadPostMutateAsync } = loadPostMutation;
  useEffect(() => {
    if (props.postId && !contentLoaded) {
      loadPostMutateAsync();
    }
  }, [props.postId, contentLoaded, loadPostMutateAsync]);

  const { mutateAsync: savePostMutateAsync } = savePostMutation;


  const handleContentChange = useCallback((content: any) => {
    form.setValue('content', content);
  }, [form]);

  const handleManualSave = () => {
    const content = form.getValues('content');
    if (content) {
      const jsonContent = editorRef.current!.getInstance()?.getJSON();
      const result = saveJSONContent(jsonContent);
      savePostMutateAsync(result);
    }
  };

  // Handle publish/unpublish action
  const handlePublishToggle = () => {
    const newStatus: PublicationStatus = postStatus === 'published' ? 'draft' : 'published';
    publishPostMutation.mutate(newStatus);
  };

  // Handle retry loading
  const handleRetryLoad = () => {
    setContentLoaded(false);
    loadPostMutation.mutate();
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header with save button */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Post Content Editor</h1>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${postStatus === 'published'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : postStatus === 'draft'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              }`}>
              {postStatus === 'published' ? 'Published' :
                postStatus === 'draft' ? 'Draft' :
                  'Archived'}
            </span>
            {/* <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {renderType.toUpperCase()}
          </span> */}
          </div>
        </div><div className="flex items-center gap-2">
          {/* Reload content button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryLoad}
            disabled={loadPostMutation.isPending}
            className="flex items-center gap-2"
          >
            {loadPostMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Reload
          </Button>

          {/* Publish/Unpublish button */}
          <Button
            variant={postStatus === 'published' ? "destructive" : "default"}
            size="sm"
            onClick={handlePublishToggle}
            disabled={publishPostMutation.isPending || loadPostMutation.isPending}
            className="flex items-center gap-2"
          >
            {publishPostMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : postStatus === 'published' ? (
              <>
                <FileText className="w-4 h-4" />
                Unpublish
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Publish
              </>
            )}
          </Button>

          {/* Save button */}
          <Button
            onClick={handleManualSave}
            disabled={savePostMutation.isPending || loadPostMutation.isPending}
            className="flex items-center gap-2"
          >
            {savePostMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 p-4">
        {(loadPostMutation.isPending || !contentLoaded) && (
          <EditorSkeleton />
        )}
        <div className={`${contentLoaded ? 'block' : 'hidden'}`}>
          <Controller
            control={form.control}
            name="content"
            render={({ field }) => (
              <CodeExecutionProvider>
                <TiptapEditor
                  ref={editorRef}
                  ssr={true}
                  output="html"
                  placeholder={{
                    paragraph: "Type your content here...",
                    imageCaption: "Type caption for image (optional)",
                  }}
                  contentMinHeight={256}
                  contentMaxHeight={640}
                  onContentChange={handleContentChange}
                  initialContent={field.value}
                />
              </CodeExecutionProvider>
            )}
          />
        </div>
      </div>
    </div>
  );
}