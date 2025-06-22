import { DocumentBase } from "./document";

export interface AuthUser extends DocumentBase {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_verified: boolean;
    profile_picture_url?: string; 
}