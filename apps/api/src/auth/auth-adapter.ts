export interface AuthenticatedUser {
  id: string;
}

export interface AuthAdapter {
  getCurrentUser(): Promise<AuthenticatedUser>;
}
