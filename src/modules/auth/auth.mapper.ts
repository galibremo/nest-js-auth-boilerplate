import { UserSession } from '@thallesp/nestjs-better-auth';
import { AuthInstance } from './auth.factory';

export function mapUserResponse(
  session: UserSession<AuthInstance>,
): CurrentUser {
  return {
    id: Number(session.user.id),
    publicId: session.user.publicId as string,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    emailVerified: session.user.emailVerified,
    createdAt: session.user.createdAt,
    updatedAt: session.user.updatedAt,
  };
}
