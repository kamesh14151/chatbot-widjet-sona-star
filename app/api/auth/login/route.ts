import { NextResponse } from 'next/server';

// Credentials are read from server-side env vars — never exposed to client
const CREDENTIALS: Record<string, { password: string; email: string }> = {
	expert: {
		password: process.env.EXPERT_PASSWORD || 'expert',
		email:    process.env.EXPERT_EMAIL    || 'expert@sona.com',
	},
	admin: {
		password: process.env.ADMIN_PASSWORD || 'admin',
		email:    process.env.ADMIN_EMAIL    || 'admin@sona.com',
	},
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { password, role } = body as { password: string; role: 'expert' | 'admin' };

		if (!password || !role) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		const creds = CREDENTIALS[role];
		if (!creds) {
			return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
		}

		if (password === creds.password) {
			return NextResponse.json({ success: true, email: creds.email, role });
		}

		return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
