export type UserRole = "reader" | "admin" | "creator";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  exp: number;
}
