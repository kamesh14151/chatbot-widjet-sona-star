import { NextResponse } from 'next/server';
import { LiveChatDb } from '@/lib/live-chat-db';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const sessionId = searchParams.get('sessionId');

	if (!sessionId) {
		return NextResponse.json({ error: 'Missing sessionId parameter' }, { status: 400 });
	}

	const session = LiveChatDb.getSession(sessionId);
	if (!session) {
		return NextResponse.json({ error: 'Session not found' }, { status: 404 });
	}

	return NextResponse.json(session);
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { sessionId, name, email, phone } = body;

		if (!sessionId || !name || !email || !phone) {
			return NextResponse.json({ error: 'Missing required fields (sessionId, name, email, phone)' }, { status: 400 });
		}

		// Check if session exists and is resolved, if so we can re-create or reactivate it
		const existingSession = LiveChatDb.getSession(sessionId);
		if (existingSession && existingSession.status !== 'resolved') {
			return NextResponse.json(existingSession);
		}

		const session = LiveChatDb.createSession(sessionId, name, email, phone);
		return NextResponse.json(session);
	} catch (error) {
		console.error("Error in session API route:", error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
