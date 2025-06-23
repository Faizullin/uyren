import { api } from "@/lib/api";
import { PaginatedData } from "@/types";
import { Attachment } from "@/types/attachment";


export interface AttachmentUploadResponse {
    attachment: Attachment;
    message: string;
}

export class AttachmentService {
    /**
     * Get list of attachments with pagination and filtering
     */
    static async listAttachments(page = 1, pageSize = 20, filters?: Record<string, any>): Promise<PaginatedData<Attachment>> {
        const params: Record<string, any> = {
            page,
            page_size: pageSize,
            ...filters, // Spread any additional filters
        };

        const response = await api.get('/cms/attachments/', { params });
        return response;
    }

    /**
     * Upload a new attachment
     */
    static async uploadAttachment(file: File): Promise<AttachmentUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/cms/attachments/upload/', formData);
        return response;
    }

    /**
     * Delete an attachment
     */
    static async deleteAttachment(id: Attachment["id"]): Promise<void> {
        await api.delete(`/cms/attachments/${id}/`);
    }

    /**
     * Download an attachment
     */
    static async downloadAttachment(id: Attachment["id"]): Promise<Blob> {
        const response = await api.get(`/cms/attachments/${id}/download/`);
        return response;
    }

    /**
     * Get attachment details
     */
    static async getAttachment(id: Attachment["id"]): Promise<Attachment> {
        const response = await api.get(`/cms/attachments/${id}/`);
        return response;
    }    /**
     * Update attachment details
     */
    static async updateAttachment(id: Attachment["id"], data: Partial<Attachment>): Promise<Attachment> {
        const response = await api.patch(`/cms/attachments/${id}/`, data);
        return response;
    }

    /**
     * Replace attachment file
     */
    static async replaceAttachmentFile(id: Attachment["id"], file: File): Promise<Attachment> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/cms/attachments/${id}/replace/`, formData);
        return response;
    }
}
