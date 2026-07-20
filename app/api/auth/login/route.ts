import { NextResponse } from 'next/server';

// Credentials are read from server-side env vars — never exposed to client
const CREDENTIALS: Record<string, { username: string; password: string; email: string }> = {
	expert: {
		username: process.env.EXPERT_USERNAME || 'expert',
		password: process.env.EXPERT_PASSWORD || 'expert',
		email:    process.env.EXPERT_EMAIL    || 'expert@sona.com',
	},
	admin: {
		username: process.env.ADMIN_USERNAME || 'admin',
		password: process.env.ADMIN_PASSWORD || 'admin',
		email:    process.env.ADMIN_EMAIL    || 'admin@sona.com',
	},
};

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { username, password, role } = body as {
			username: string;
			password: string;
			role: 'agent' | 'admin' | 'expert';
		};

		if (!username || !password || !role) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		const creds = CREDENTIALS[role];
		if (!creds) {
			return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
		}

		if (username === creds.username && password === creds.password) {
			return NextResponse.json({ success: true, email: creds.email, role });
		}

		return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
	} catch {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
