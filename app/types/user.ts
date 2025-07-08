export type UserRole = 'admin' | 'user';

export interface User {
  email: string;
  role: UserRole;
}

export interface CreateUserData {
  email: string;
  role?: UserRole;
}

export interface UpdateUserData {
  role?: UserRole;
}

export interface UserValidationResult {
  isValid: boolean;
  user?: User;
  error?: string;
}

export interface UserListResponse {
  users: User[];
  count: number;
  total: number;
}

export interface UserCreateRequest {
  email: string;
  role?: UserRole;
}

export interface UserUpdateRequest {
  role?: UserRole;
} 