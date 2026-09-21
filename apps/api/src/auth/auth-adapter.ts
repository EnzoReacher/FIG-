export interface AuthenticatedUser {
  id: string;
}

export interface AuthAdapter {
  getCurrentUser(): Promise<AuthenticatedUser | null>;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized');
  }
}

export async function requireCurrentUser(auth: AuthAdapter) {
  const user = await auth.getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
