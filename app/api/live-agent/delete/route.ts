import { NextRequest, NextResponse } from 'next/server';
import { LiveChatDb } from '@/lib/live-chat-db';

export async function DELETE(req: NextRequest) {
	try {
		const { sessionIds } = await req.json();

		if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
			return NextResponse.json(
				{ error: 'sessionIds array is required' },
				{ status: 400 }
			);
		}

		const deletedCount = await LiveChatDb.deleteSessions(sessionIds);

		return NextResponse.json({
			success: true,
			deleted: deletedCount,
		});
	} catch (error: any) {
		console.error('Error in DELETE session endpoint:', error);
		return NextResponse.json(
			{ error: error.message || 'Failed to delete sessions' },
			{ status: 500 }
		);
	}
}
