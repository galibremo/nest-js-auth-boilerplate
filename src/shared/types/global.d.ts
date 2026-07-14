/**
 * Global type declarations — available everywhere without explicit import.
 */

declare global {
  /**
   * Represents the authenticated user attached to a request context.
   * Populated from the session returned by better-auth.
   */
  interface CurrentUser {
    id: number;
    publicId: string;
    name: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
}

export {};
