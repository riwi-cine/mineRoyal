import type { Request } from 'express';

export interface AuthenticatedUserPayload {
  sub: number;
  email: string;
  sid: string;
  tokenUse: 'access';
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  accessToken?: string;
  user?: AuthenticatedUserPayload;
}
