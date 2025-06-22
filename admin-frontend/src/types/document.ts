export type DocumentId = number;
export interface DocumentBase {
    id: DocumentId;
    created_at?: string;
    updated_at?: string;
}