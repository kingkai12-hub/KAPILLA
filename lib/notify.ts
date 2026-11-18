/**
 * One place to raise a portal alert.
 *
 * Every important event in the system (a pickup request coming in, a waybill
 * being raised, a delivery being confirmed, an invoice being issued) funnels
 * through `notifyStaff`: it writes an in-app notification for each relevant
 * user and mirrors it as an FCM push to their registered devices.
 *
 * It is deliberately fail-open — if the notification/User models are not
 * reachable the request that triggered it still succeeds.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/db';
import { sendPushToUsers } from '@/lib/push';

/** Roles that run the operations desk. */
export const STAFF_ROLES = [
  'ADMIN',
  'STAFF',
  'OPERATION_MANAGER',
  'MANAGER',
  'MD',
  'CEO',
  'ACCOUNTANT',
];

/** Everyone with a portal login, including drivers. */
export const ALL_PORTAL_ROLES = [...STAFF_ROLES, 'DRIVER'];

export interface NotifyStaffInput {
  /** Short headline shown bold in the list and as the push title. */
  title: string;
  message: string;
  /** Where the alert should take the user when tapped. */
  link?: string | null;
  /** Machine type, e.g. `PICKUP_REQUEST`, used to group alerts. */
  type: string;
  /** Who should receive it. Defaults to `STAFF_ROLES`. */
  roles?: string[];
  /**
   * Suppress duplicates for the same user. Matched on `type` + `title`, so the
   * title must carry the unique key (waybill, request id, invoice number…).
   * Used by polled flows (tracking) so the same event cannot be raised twice.
   */
  dedupe?: boolean;
  /** Users to skip — typically the person who performed the action. */
  excludeUserIds?: string[];
}

/**
 * Raise an alert for the given roles: in-app rows first, then a device push to
 * exactly those users (so a polled flow cannot spam phones).
 * Returns the ids of the users who received the in-app notification.
 */
export async function notifyStaff(input: NotifyStaffInput): Promise<string[]> {
  const notificationModel = (db as any).Notification || (db as any).notification;
  const userModel = (db as any).User || (db as any).user;

  const roles = input.roles?.length ? input.roles : STAFF_ROLES;
  const exclude = new Set(input.excludeUserIds ?? []);
  let notifiedUserIds: string[] = [];

  if (notificationModel && userModel) {
    try {
      const recipients: { id: string }[] = await userModel.findMany({
        where: { role: { in: roles }, isDisabled: false },
        select: { id: true },
      });

      let targets = recipients.map((member) => member.id).filter((id) => !exclude.has(id));

      if (input.dedupe && targets.length > 0) {
        const existing: { userId: string }[] = await notificationModel.findMany({
          where: { userId: { in: targets }, type: input.type, title: input.title },
          select: { userId: true },
        });
        const alreadyNotified = new Set(existing.map((row) => row.userId));
        targets = targets.filter((id) => !alreadyNotified.has(id));
      }

      // One bulk write instead of a round-trip per recipient — the old
      // sequential loop took ~26s for a busy alert.
      if (targets.length > 0) {
        await notificationModel.createMany({
          data: targets.map((userId) => ({
            userId,
            title: input.title,
            message: input.message,
            type: input.type,
            link: input.link ?? null,
          })),
        });
        notifiedUserIds = targets;
      }
    } catch (error) {
      console.error('[NOTIFY] in-app notification failed', error);
    }
  }

  await sendPushToUsers(notifiedUserIds, {
    title: input.title,
    body: input.message,
    link: input.link ?? null,
  });

  return notifiedUserIds;
}
