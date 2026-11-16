'use client';

import { useEffect } from 'react';
import { isNativeShell } from '@/lib/native-file';

/**
 * Registers this device for FCM push and hands the token to the server, so a
 * delivery alert can reach the phone even when the app is closed.
 *
 * Everything is wrapped so a shell built before the push plugin existed (or a
 * build with no google-services.json) simply does nothing instead of throwing.
 */
export default function PushRegistrar() {
  useEffect(() => {
    if (!isNativeShell()) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== 'granted') return;
        if (cancelled) return;

        const onRegistration = await PushNotifications.addListener('registration', (token) => {
          fetch('/api/notifications/device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token.value, platform: 'android' }),
          }).catch(() => {
            // Registration is best-effort; the in-app centre still works.
          });
        });

        const onError = await PushNotifications.addListener('registrationError', (error) => {
          console.error('[push] registration failed', error);
        });

        // While the app is in the foreground Android does not draw the OS
        // notification itself, so surface it as an in-app toast instead.
        const onReceived = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            window.dispatchEvent(
              new CustomEvent('kapilla:push', {
                detail: {
                  title: notification.title,
                  message: notification.body,
                  link: notification.data?.link,
                },
              })
            );
          }
        );

        // Tapping the OS notification opens the alert's target page.
        const onAction = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {
            const link = action.notification.data?.link;
            if (typeof link === 'string' && link.startsWith('/')) {
              window.location.assign(link);
            }
          }
        );

        await PushNotifications.register();

        cleanup = () => {
          onRegistration.remove();
          onError.remove();
          onReceived.remove();
          onAction.remove();
        };
      } catch (error) {
        console.error('[push] not available in this build', error);
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
