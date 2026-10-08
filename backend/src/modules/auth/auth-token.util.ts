import { createHash } from 'node:crypto';

export const hashAuthToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export const refreshSessionKey = (sessionId: string): string => `auth:session:${sessionId}`;

export const revokedAccessTokenKey = (token: string): string => `auth:revoked:${hashAuthToken(token)}`;
