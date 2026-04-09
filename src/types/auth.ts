export interface AuthUser {
  id: string;
  email: string;
  email_verified?: boolean;
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

export interface AuthSignUpResult {
  user: AuthUser | null;
  session: AuthSession | null;
  verificationRequired: boolean;
  email?: string;
  message?: string;
}
