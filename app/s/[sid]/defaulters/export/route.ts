import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDefaulters } from '@/lib/defaulters';

export async function GET(request: NextRequest, { params }: { params: { sid: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  const { data: allowed } = await supabase.rpc('is_society_staff', { sid: params.sid });
  if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const all = request.nextUrl.searchParams.get('all') === '1';
  const rows = await getDefaulters(supabase, params.sid, !all);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['Block', 'Gali', 'Ghar', 'Owner', 'Mobile', 'Fund', 'Period', 'Due date', 'Amount', 'Paid', 'Balance', 'Status'];
  const lines = rows.map((r) =>
    [r.house.block, r.house.street, r.house.house_no, r.owner?.owner_name, r.owner?.owner_phone, r.plan?.name, r.period, r.due_date, r.amount_due, r.paid_amount, r.balance, r.status]
      .map(esc)
      .join(','),
  );
  const csv = '﻿' + [header.map(esc).join(','), ...lines].join('\r\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="defaulters-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
