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
      
      // EMERGENCY BANDWIDTH FIX: Send immediately, then every 15s (was 5s)
      // This reduces bandwidth by 67% - necessary due to hitting 10GB limit
      send();
      timer = setInterval(send, 15000); // Changed from 5000ms to 15000ms
      
      // EMERGENCY: Keep-alive every 45s (was 30s)
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 45000);
      
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
