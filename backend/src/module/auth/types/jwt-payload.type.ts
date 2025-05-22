export interface JwtPayload {
  sub: string;          // MongoDB ObjectId as string
  username: string;     // Username of the user
  iat?: number;         // Issued at timestamp
  exp?: number;         // Expiration timestamp
} 