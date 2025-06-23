import { DocumentBase } from "./document";

export type FileType = string; // You can make this more specific if needed

export interface Attachment extends DocumentBase {
    title: string;
    description: string;
    alt_text: string;
    name: string; // Storage filename
    original_filename: string; // Upload filename
    url: string; // Full URL with protocol
    file_type: FileType;
    file_size: number; // Size in bytes
    file_size_human: string; // Human readable size (e.g., "2.5 MB")
    mime_type: string;
    is_public: boolean;
    is_featured: boolean;
    uploaded_by?: string;
}
