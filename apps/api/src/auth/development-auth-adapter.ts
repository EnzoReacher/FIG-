import type { AuthAdapter, AuthenticatedUser } from './auth-adapter.js';

export const DEVELOPMENT_USER_ID = '00000000-0000-4000-8000-000000000001';

export class DevelopmentAuthAdapter implements AuthAdapter {
  constructor(private readonly userId = DEVELOPMENT_USER_ID) {}

  async getCurrentUser(): Promise<AuthenticatedUser> {
    return { id: this.userId };
  }
}
