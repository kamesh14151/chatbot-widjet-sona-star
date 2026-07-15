import { NextResponse } from 'next/server';
import { LiveChatDb } from '@/lib/live-chat-db';

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { sessionId, agentEmail } = body;

		if (!sessionId || !agentEmail) {
			return NextResponse.json({ error: 'Missing required fields (sessionId, agentEmail)' }, { status: 400 });
		}

		const success = await LiveChatDb.assignAgent(sessionId, agentEmail);
		if (!success) {
			return NextResponse.json({ error: 'Session not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error in assign agent API route:", error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
