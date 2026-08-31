export type Role = "rep" | "manager";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  fields?: Array<{ field: string; message: string }>;
}
