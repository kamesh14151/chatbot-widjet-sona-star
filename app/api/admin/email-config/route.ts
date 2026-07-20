import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Email config stored in a local JSON file (works on Vercel with ephemeral FS on free tier;
// for persistence across deployments, store in Supabase or use env vars directly)
const CONFIG_FILE = path.join(process.cwd(), 'email-config.json');

export interface EmailConfig {
	provider: 'gmail' | 'smtp';
	smtpHost: string;
	smtpPort: string;
	smtpUser: string;   // Gmail address or SMTP username
	smtpPass: string;   // Gmail App Password or SMTP password
	fromName: string;   // Display name shown in From field
	// Recipient for lead notifications
	leadEmailTo: string;
	// Email subject prefix
	subjectPrefix: string;
}

const DEFAULT_CONFIG: EmailConfig = {
	provider:      (process.env.SMTP_HOST && !process.env.SMTP_HOST.includes('gmail')) ? 'smtp' : 'gmail',
	smtpHost:      process.env.SMTP_HOST      || 'smtp.gmail.com',
	smtpPort:      process.env.SMTP_PORT      || '465',
	smtpUser:      process.env.SMTP_USER      || process.env.GMAIL_USER || '',
	smtpPass:      process.env.SMTP_PASS      || process.env.GMAIL_PASS || '',
	fromName:      process.env.EMAIL_FROM_NAME || 'SCALE UWA Assistant',
	leadEmailTo:   process.env.LEAD_EMAIL_TO  || 'kamesh6592@gmail.com',
	subjectPrefix: process.env.EMAIL_SUBJECT_PREFIX || 'New User Lead',
};

export function readEmailConfig(): EmailConfig {
	try {
		if (fs.existsSync(CONFIG_FILE)) {
			const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
			const saved = JSON.parse(raw) as Partial<EmailConfig>;
			// Merge saved values over defaults (env vars as baseline)
			return { ...DEFAULT_CONFIG, ...saved };
		}
	} catch (e) {
		console.error('Error reading email config file:', e);
	}
	return DEFAULT_CONFIG;
}

function writeEmailConfig(config: EmailConfig): void {
	try {
		fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
	} catch (e) {
		console.error('Error writing email config file:', e);
	}
}

export async function GET() {
	const config = readEmailConfig();
	return NextResponse.json(config);
}

export async function POST(request: Request) {
	try {
		const body = await request.json() as Partial<EmailConfig>;

		const current = readEmailConfig();
		const updated: EmailConfig = {
			provider:      body.provider      ?? current.provider ?? 'gmail',
			smtpHost:      body.smtpHost      ?? current.smtpHost,
			smtpPort:      body.smtpPort      ?? current.smtpPort,
			smtpUser:      body.smtpUser      ?? current.smtpUser,
			smtpPass:      body.smtpPass      ?? current.smtpPass,
			fromName:      body.fromName      ?? current.fromName,
			leadEmailTo:   body.leadEmailTo   ?? current.leadEmailTo,
			subjectPrefix: body.subjectPrefix ?? current.subjectPrefix,
		};

		writeEmailConfig(updated);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error saving email config:', error);
		return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
	}
}

