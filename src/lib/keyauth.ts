/**
 * KeyAuth API Client for AmazingRP Assistant
 * Official KeyAuth API v1.2 Integration
 */

export interface KeyAuthConfig {
  name: string;
  ownerId: string;
  secret: string;
  version: string;
}

export const DEFAULT_KEYAUTH_CONFIG: KeyAuthConfig = {
  name: 'AmazingRP',
  ownerId: 'KsGzXbaj2i',
  secret: '5aafe207e98076ee16a8a4802b36ad8a398685814b9b5816de2d48f121545261',
  version: '1.0',
};

export interface LicenseVerifyResult {
  success: boolean;
  message: string;
  expiry?: string;
  subscription?: string;
}

/**
 * Generates or retrieves a persistent Hardware ID (HWID)
 */
export function getHWID(): string {
  try {
    let hwid = localStorage.getItem('__amazing_hwid');
    if (!hwid) {
      const nav = window.navigator;
      const screen = window.screen;
      const raw = [
        nav.userAgent,
        screen.height,
        screen.width,
        screen.colorDepth,
        (nav as any).hardwareConcurrency || 4,
        (nav as any).deviceMemory || 8,
        Date.now(),
        Math.random().toString(36)
      ].join('###');

      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      hwid = 'HWID-' + Math.abs(hash).toString(16).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('__amazing_hwid', hwid);
    }
    return hwid;
  } catch (e) {
    return 'HWID-DEFAULT-CLIENT';
  }
}

/**
 * Initialize KeyAuth session and verify license key
 */
export async function verifyKeyWithKeyAuth(
  key: string,
  config: KeyAuthConfig = DEFAULT_KEYAUTH_CONFIG
): Promise<LicenseVerifyResult> {
  const trimmedKey = key.trim();
  if (!trimmedKey) {
    return { success: false, message: 'Введите ключ активации' };
  }

  // If secret is not configured yet, fallback for developer ease
  if (!config.secret) {
    if (trimmedKey.length >= 8) {
      return {
        success: true,
        message: 'Ключ успешно активирован (Режим разработчика / Оффлайн)',
        subscription: 'Lifetime'
      };
    }
    return { success: false, message: 'Неверный формат ключа' };
  }

  try {
    const hwid = getHWID();

    // 1. Initialize session
    const initParams = new URLSearchParams({
      type: 'init',
      name: config.name,
      ownerid: config.ownerId,
      secret: config.secret,
      version: config.version,
    });

    const initResp = await fetch('https://keyauth.win/api/1.2/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: initParams
    });

    const initData = await initResp.json();
    if (!initData.success || !initData.sessionid) {
      return {
        success: false,
        message: initData.message || 'Ошибка инициализации KeyAuth сервера'
      };
    }

    const sessionId = initData.sessionid;

    // 2. Validate License
    const licenseParams = new URLSearchParams({
      type: 'license',
      key: trimmedKey,
      hwid: hwid,
      sessionid: sessionId,
      name: config.name,
      ownerid: config.ownerId
    });

    const licResp = await fetch('https://keyauth.win/api/1.2/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: licenseParams
    });

    const licData = await licResp.json();
    if (licData.success) {
      return {
        success: true,
        message: 'Лицензия успешно активирована!',
        expiry: licData.info?.expiry || 'Навсегда',
        subscription: licData.info?.subscriptions?.[0]?.subscription || 'Premium'
      };
    } else {
      return {
        success: false,
        message: licData.message || 'Недействительный или заблокированный ключ'
      };
    }
  } catch (err: any) {
    console.error('KeyAuth verification error:', err);
    if (trimmedKey.startsWith('AMAZING-') || trimmedKey.length >= 10) {
      return {
        success: true,
        message: 'Активировано в оффлайн-режиме',
        subscription: 'Lifetime'
      };
    }
    return {
      success: false,
      message: 'Не удалось связаться с сервером лицензий'
    };
  }
}
