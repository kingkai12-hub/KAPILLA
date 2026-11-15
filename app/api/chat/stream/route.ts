import type { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { subscribe, unsubscribe } from '@/lib/chatBus';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  // Subscribe as the authenticated user, never a client-supplied id.
  const userId = auth.user.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const sub = {
        send(payload: unknown) {
          const data = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(data));
        },
      };
      subscribe(userId, sub);

      // Keep-alive ping
      const pingId = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 25000);

      // Cleanup on cancel
      const cancel = () => {
        clearInterval(pingId);
        unsubscribe(userId, sub);
        try {
          controller.close();
        } catch {}
      };

      // @ts-expect-error internal
      controller.cancel = cancel;
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
