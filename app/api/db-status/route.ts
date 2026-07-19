import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
// Prevent caching so every call is a fresh check
export const dynamic = 'force-dynamic';

export async function GET() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

	if (!url || !key) {
		return NextResponse.json({
			connected: false,
			status: 'misconfigured',
			message: 'Supabase environment variables are missing.',
			latencyMs: null,
			checkedAt: new Date().toISOString(),
		});
	}

	const start = Date.now();
	try {
		const client = createClient(url, key);

		// A lightweight query: fetch 1 row from chat_sessions.
		// If the table doesn't exist we still get a DB-level response → connected.
		const { error } = await client
			.from('chat_sessions')
			.select('id')
			.limit(1);

		const latencyMs = Date.now() - start;

		// PGRST205 / 42P01 = table missing but DB is reachable → still connected
		const tableExists =
			!error || error.code === 'PGRST205' || error.code === '42P01';

		if (!tableExists && error) {
			return NextResponse.json({
				connected: false,
				status: 'error',
				message: error.message,
				latencyMs,
				checkedAt: new Date().toISOString(),
			});
		}

		const tablesReady = !error; // no error → table exists and is queryable

		return NextResponse.json({
			connected: true,
			status: tablesReady ? 'ready' : 'no_tables',
			message: tablesReady
				? 'Supabase connected and tables are ready.'
				: 'Supabase connected but chat_sessions table not yet created.',
			latencyMs,
			checkedAt: new Date().toISOString(),
		});
	} catch (err: unknown) {
		const latencyMs = Date.now() - start;
		const message = err instanceof Error ? err.message : 'Unknown error';
		return NextResponse.json({
			connected: false,
			status: 'error',
			message,
			latencyMs,
			checkedAt: new Date().toISOString(),
		});
	}
}
