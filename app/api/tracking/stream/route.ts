import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams, origin, pathname } = new URL(req.url);
  const waybillNumber = searchParams.get('waybillNumber');
  if (!waybillNumber) {
    return new Response('Missing waybillNumber', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let timer: NodeJS.Timeout | null = null;
      let lastData: string | null = null; // Track last sent data
      
      const send = async () => {
        try {
          const url = `${origin}${pathname.replace('/stream', '')}?waybillNumber=${encodeURIComponent(waybillNumber)}&t=${Date.now()}`;
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) {
            controller.enqueue(encoder.encode(`event: error\ndata: {"status":${res.status}}\n\n`));
            return;
          }
          const data = await res.text();
          
          // BANDWIDTH OPTIMIZATION: Only send if data changed
          if (data !== lastData) {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            lastData = data;
          }
        } catch (e: any) {
          controller.enqueue(encoder.encode(`event: error\ndata: {"message":"stream fetch failed"}\n\n`));
        }
      };
      
      // BANDWIDTH OPTIMIZATION: Send immediately, then every 5s (was 1s)
      // This reduces bandwidth by 80% while still feeling real-time
      send();
      timer = setInterval(send, 5000); // Changed from 1000ms to 5000ms
      
      // BANDWIDTH OPTIMIZATION: Keep-alive every 30s (was 15s)
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 30000);
      
      // Handle client disconnect
      (req as any).signal?.addEventListener?.('abort', () => {
        if (timer) clearInterval(timer);
        clearInterval(keepAlive);
        try { controller.close(); } catch {}
      });
    },
    cancel() {
      // no-op
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
