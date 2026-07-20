import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'live-chats.json');

export async function DELETE(request: Request) {
	try {
		const body = await request.json();
		const { sessionIds } = body;

		if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
			return NextResponse.json({ error: 'Missing or invalid sessionIds array' }, { status: 400 });
		}

		const isSupabaseEnabled =
			!!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		if (isSupabaseEnabled) {
			const { error } = await supabase
				.from('chat_sessions')
				.delete()
				.in('id', sessionIds);

			if (error) {
				console.error('Error deleting sessions from Supabase:', error);
				return NextResponse.json({ error: 'Failed to delete sessions' }, { status: 500 });
			}
		} else {
			// Local file fallback
			try {
				if (fs.existsSync(DB_FILE)) {
					const data = fs.readFileSync(DB_FILE, 'utf-8');
					const sessions = JSON.parse(data);
					for (const id of sessionIds) {
						delete sessions[id];
					}
					fs.writeFileSync(DB_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
				}
			} catch (err) {
				console.error('Error deleting from local file:', err);
				return NextResponse.json({ error: 'Failed to delete sessions from local store' }, { status: 500 });
			}
		}

		return NextResponse.json({ success: true, deleted: sessionIds.length });
	} catch (error) {
		console.error('Error in delete sessions API route:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
