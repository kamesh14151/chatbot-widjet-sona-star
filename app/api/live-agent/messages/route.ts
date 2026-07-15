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

	return NextResponse.json({
		messages: session.messages,
		status: session.status,
		assignedAgent: session.assignedAgent,
		userName: session.userName
	});
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { sessionId, sender, senderName, text } = body;

		if (!sessionId || !sender || !senderName || !text) {
			return NextResponse.json({ error: 'Missing required fields (sessionId, sender, senderName, text)' }, { status: 400 });
		}

		const message = LiveChatDb.addMessage(sessionId, sender, senderName, text);
		if (!message) {
			return NextResponse.json({ error: 'Session not found' }, { status: 404 });
		}

		return NextResponse.json(message);
	} catch (error) {
		console.error("Error in messages API route:", error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
