import { NextResponse, NextRequest } from 'next/server';
import { LiveChatDb } from '@/lib/live-chat-db';

// ─────────────────────────────────────────────────────────
// Feature #3: In-memory rate limiter
// Limits: max 3 session creations per IP per 10 minutes
// (Works for single-instance deployments; for multi-instance
//  production, use Redis / Upstash instead)
// ─────────────────────────────────────────────────────────
const RATE_WINDOW_MS  = 10 * 60 * 1000; // 10 minutes
const RATE_MAX        = 3;              // max sessions per window per IP
const rateMap         = new Map<string, { count: number; windowStart: number }>();

function getClientIp(req: NextRequest): string {
	return (
		req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		req.headers.get('x-real-ip') ||
		'unknown'
	);
}

function isRateLimited(ip: string): boolean {
	if (process.env.NODE_ENV === 'development' || ip === '127.0.0.1' || ip === '::1' || ip === 'unknown' || ip === 'localhost') {
		return false;
	}

	const now    = Date.now();
	const record = rateMap.get(ip);

	if (!record || now - record.windowStart > RATE_WINDOW_MS) {
		rateMap.set(ip, { count: 1, windowStart: now });
		return false;
	}

	if (record.count >= RATE_MAX) return true;

	record.count++;
	return false;
}
// ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const sessionId = searchParams.get('sessionId');

	if (!sessionId) {
		return NextResponse.json({ error: 'Missing sessionId parameter' }, { status: 400 });
	}

	const session = await LiveChatDb.getSession(sessionId);
	if (!session) {
		return NextResponse.json({ error: 'Session not found' }, { status: 404 });
	}

	return NextResponse.json(session);
}

export async function POST(request: NextRequest) {
	try {
		// ── Rate limit check ──────────────────────────────────
		const ip = getClientIp(request);
		if (isRateLimited(ip)) {
			return NextResponse.json(
				{ error: 'Too many sessions created from your network. Please wait 10 minutes.' },
				{
					status: 429,
					headers: {
						'Retry-After': '600',
						'X-RateLimit-Limit': String(RATE_MAX),
						'X-RateLimit-Window': '600',
					},
				}
			);
		}
		// ─────────────────────────────────────────────────────

		const body = await request.json();
		const { sessionId, name, email, phone } = body;

		if (!sessionId || !name || !email || !phone) {
			return NextResponse.json(
				{ error: 'Missing required fields (sessionId, name, email, phone)' },
				{ status: 400 }
			);
		}

		// If session already exists and is NOT resolved, return it (session resume)
		const existingSession = await LiveChatDb.getSession(sessionId);
		if (existingSession && existingSession.status !== 'resolved') {
			return NextResponse.json(existingSession);
		}

		const session = await LiveChatDb.createSession(sessionId, name, email, phone);
		return NextResponse.json(session);
	} catch (error) {
		console.error('Error in session API route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
