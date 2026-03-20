export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  roles?: string[];
}

export interface AuthSession {
  user: AuthUser;
}
