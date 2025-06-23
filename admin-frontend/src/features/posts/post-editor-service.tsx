import { api } from "@/lib/api";
import { DocumentId } from "@/types/document";
import { Post, PublicationStatus } from "@/types/post";

interface EditorApiResponse {
    content: string; // JSON string that needs to be parsed
    instance: Post;
}

export class PostEditorService {
    static async loadPostContent(postId: DocumentId): Promise<EditorApiResponse> {
        const response = await api.get(`/cms/posts/${postId}/content/`);
        return response;
    }

    static async savePostContent(postId: DocumentId, content: string): Promise<EditorApiResponse> {
        const response = await api.post(`/cms/posts/${postId}/content/`, {content});
        return response;
    }

    static async publishPost(postId: DocumentId, status: PublicationStatus): Promise<Post> {
        const response = await api.post(`/cms/posts/${postId}/publish/`, { status });
        return response;
    }
}