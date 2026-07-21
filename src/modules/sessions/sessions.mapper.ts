import type { SessionResponse } from '../sessions/schemas/sessions.schema';
import type { SessionRow } from './sessions.types';

function parseDeviceInfo(userAgent: string | null): {
  deviceName: string;
  deviceType: string;
} {
  if (!userAgent) return { deviceName: 'Unknown', deviceType: 'unknown' };

  const ua = userAgent.toLowerCase();

  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipod|windows phone/i.test(ua))
    deviceType = 'mobile';
  else if (/tablet|ipad|playbook|silk/i.test(ua)) deviceType = 'tablet';

  const osParts: string[] = [];
  if (/windows nt 11/i.test(ua)) osParts.push('Windows 11');
  else if (/windows nt 10/i.test(ua)) osParts.push('Windows 10');
  else if (/mac os x/i.test(ua)) osParts.push('macOS');
  else if (/linux/i.test(ua) && !/android/i.test(ua)) osParts.push('Linux');
  else if (/android/i.test(ua)) osParts.push('Android');
  else if (/iphone|ipad|ipod/i.test(ua)) osParts.push('iOS');
  else osParts.push('Unknown OS');

  const browserParts: string[] = [];
  if (/edg/i.test(ua)) browserParts.push('Edge');
  else if (/chrome/i.test(ua) && !/edg/i.test(ua)) browserParts.push('Chrome');
  else if (/firefox/i.test(ua)) browserParts.push('Firefox');
  else if (/safari/i.test(ua) && !/chrome/i.test(ua))
    browserParts.push('Safari');
  else browserParts.push('Unknown Browser');

  return {
    deviceName: `${osParts.join(', ')} - ${browserParts.join(', ')}`,
    deviceType,
  };
}

function truncate(value: string | null, max: number): string | null {
  if (!value) return value;
  return value.length > max ? value.slice(0, max) + '…' : value;
}

export function mapSessionResponse(
  row: SessionRow,
  currentToken: string,
): SessionResponse {
  const now = new Date();
  const isExpired = row.expiresAt <= now;
  const isCurrent = row.token === currentToken;
  const { deviceName, deviceType } = parseDeviceInfo(row.userAgent);

  return {
    id: row.publicId,
    deviceName,
    deviceType,
    ipAddress: row.ipAddress,
    userAgent: truncate(row.userAgent, 200),
    loginMethod: row.loginMethod,
    status: isExpired ? 'expired' : 'active',
    isCurrent,
    isRevoked: false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
  };
}
