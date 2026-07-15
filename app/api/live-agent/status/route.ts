import { NextResponse } from 'next/server';
import { LiveChatDb } from '@/lib/live-chat-db';

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { sessionId, status } = body;

		if (!sessionId || !status) {
			return NextResponse.json({ error: 'Missing required fields (sessionId, status)' }, { status: 400 });
		}

		if (status === 'resolved') {
			const success = LiveChatDb.resolveSession(sessionId);
			if (!success) {
				return NextResponse.json({ error: 'Session not found' }, { status: 404 });
			}
			return NextResponse.json({ success: true, status: 'resolved' });
		}

		return NextResponse.json({ error: 'Invalid status update action' }, { status: 400 });
	} catch (error) {
		console.error("Error in status update API route:", error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
