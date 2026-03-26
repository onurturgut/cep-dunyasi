export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  roles?: string[];
  permissions?: string[];
  is_active?: boolean;
}

export interface AuthSession {
  user: AuthUser;
}
