import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { subscribe, unsubscribe } from '@/lib/chatBus';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const sub = {
        send(payload: any) {
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
