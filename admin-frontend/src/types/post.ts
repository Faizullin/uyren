import { DocumentBase } from "./document";

export interface Author extends DocumentBase {
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
}

export type PublicationStatus = "draft" | "published" | "archived";

export interface Post extends DocumentBase {
    title: string;
    slug: string;
    content?: string;
    excerpt?: string;
    status: PublicationStatus;
    post_type: string;
    generic_key?: string;
    author?: Author;
}