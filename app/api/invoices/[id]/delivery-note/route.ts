import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);
  const url = new URL(req.url);
  const target = `/api/invoices/${params.id}/pdf?type=delivery-note`;
  return NextResponse.redirect(new URL(target, url.origin));
}
