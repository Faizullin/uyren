import { api } from "@/lib/api";
import { DocumentId } from "@/types/document";

export class PostEditorService {
    static async loadPostContent(postId: DocumentId): Promise<string> {
        // Simulate an API call to fetch post content
        // In a real application, replace this with an actual API request
        return await api.get<string>(`/cms/posts/${postId}/content`);
    }
}