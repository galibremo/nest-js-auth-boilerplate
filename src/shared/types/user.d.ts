interface CurrentUser {
  id: number;
  name: string;
  publicId: string;
  email: string;
  emailVerified: boolean;
  image: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}
