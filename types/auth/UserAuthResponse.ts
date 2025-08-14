
export interface UserData {
    email: string;
    email_verified: boolean;
    mfa: boolean;
    profile_picture_url : string | null;
    role: string;
    status: string;
    sub_plan: string;
    sub_status: string;
    user_id: number;
    username: string;
}