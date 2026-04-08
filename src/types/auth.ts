export type UserRole = "reader" | "admin" | "creator";

export interface UserPublicRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  exp: number;
}
