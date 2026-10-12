import { db } from './db';

const MAINTENANCE_KEY = 'maintenance_mode';
const MAINTENANCE_MESSAGE_KEY = 'maintenance_message';
const DEFAULT_MESSAGE =
  'The system is currently under maintenance. Please check back in a few minutes.';

export interface MaintenanceStatus {
  enabled: boolean;
  message: string;
}

export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  try {
    const [modeConfig, messageConfig] = await Promise.all([
      db.systemConfig.findUnique({ where: { key: MAINTENANCE_KEY } }),
      db.systemConfig.findUnique({ where: { key: MAINTENANCE_MESSAGE_KEY } }),
    ]);

    return {
      enabled: modeConfig?.value === 'true',
      message: messageConfig?.value || DEFAULT_MESSAGE,
    };
  } catch (error) {
    console.error('[MAINTENANCE] Failed to read status:', error);
    return { enabled: false, message: DEFAULT_MESSAGE };
  }
}

export async function setMaintenanceMode(
  enabled: boolean,
  message?: string
): Promise<MaintenanceStatus> {
  const finalMessage = message?.trim() || DEFAULT_MESSAGE;

  await db.systemConfig.upsert({
    where: { key: MAINTENANCE_KEY },
    update: { value: enabled ? 'true' : 'false' },
    create: {
      key: MAINTENANCE_KEY,
      value: enabled ? 'true' : 'false',
      category: 'system',
    },
  });

  await db.systemConfig.upsert({
    where: { key: MAINTENANCE_MESSAGE_KEY },
    update: { value: finalMessage },
    create: {
      key: MAINTENANCE_MESSAGE_KEY,
      value: finalMessage,
      category: 'system',
    },
  });

  return { enabled, message: finalMessage };
}
