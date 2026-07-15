import { NextResponse } from 'next/server';
import { LiveChatDb } from '@/lib/live-chat-db';

export async function GET() {
	try {
		const sessions = Object.values(LiveChatDb.getSessions());
		const activeCount = sessions.filter(s => s.status === 'active').length;
		const waitingCount = sessions.filter(s => s.status === 'waiting').length;
		const resolvedCount = sessions.filter(s => s.status === 'resolved').length;

		// Create a simple CSV report content
		let csvContent = `Live Support Queue Report\n`;
		csvContent += `Generated At,${new Date().toLocaleString()}\n`;
		csvContent += `Active Chats,${activeCount}\n`;
		csvContent += `Waiting Chats,${waitingCount}\n`;
		csvContent += `Resolved Chats,${resolvedCount}\n\n`;
		csvContent += `Session ID,Student Name,Email,Phone,Status,Assigned Agent,Messages Count,Created At\n`;

		for (const session of sessions) {
			csvContent += `"${session.id}","${session.userName}","${session.userEmail}","${session.userPhone}","${session.status}","${session.assignedAgent || 'None'}",${session.messages.length},"${new Date(session.createdAt).toLocaleString()}"\n`;
		}

		return new Response(csvContent, {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': 'attachment; filename="sona-live-support-report.csv"',
			},
		});
	} catch (error) {
		console.error("Error generating live chat report:", error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
