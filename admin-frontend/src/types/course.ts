import { Attachment } from "./attachment";
import { DocumentBase } from "./document";

export type CourseStatus = "draft" | "published" | "archived";
export type CourseType = "free" | "paid" | "premium";

export interface Course extends DocumentBase {
    title: string;
    slug: string;
    description?: string;
    thumbnail?: Attachment;
    category?: string;
    tags?: string[];
    status: CourseStatus;
    course_type: CourseType;
    price?: number;
    estimated_duration_hours?: number;
}
