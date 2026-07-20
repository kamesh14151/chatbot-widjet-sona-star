import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

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

// Synchronous fallback read (from local file or env defaults)
export function readEmailConfig(): EmailConfig {
	try {
		if (fs.existsSync(CONFIG_FILE)) {
			const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
			const saved = JSON.parse(raw) as Partial<EmailConfig>;
			return { ...DEFAULT_CONFIG, ...saved };
		}
	} catch (e) {
		console.error('Error reading local email config file:', e);
	}
	return DEFAULT_CONFIG;
}

// Asynchronous read (tries Supabase first for production persistence across Vercel deployments, then local file)
export async function readEmailConfigAsync(): Promise<EmailConfig> {
	try {
		if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
			const { data, error } = await supabase
				.from('app_settings')
				.select('value')
				.eq('key', 'email_config')
				.maybeSingle();

			if (!error && data?.value) {
				return { ...DEFAULT_CONFIG, ...(data.value as Partial<EmailConfig>) };
			}
		}
	} catch (e) {
		console.warn('Could not read email config from Supabase, falling back to local storage:', e);
	}
	return readEmailConfig();
}

// Asynchronous write (saves to local JSON file AND Supabase for production persistence)
export async function writeEmailConfigAsync(config: EmailConfig): Promise<void> {
	// 1. Save locally
	try {
		fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
	} catch (e) {
		console.error('Error writing local email config file:', e);
	}

	// 2. Persist to Supabase if configured
	try {
		if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
			const { error } = await supabase
				.from('app_settings')
				.upsert({
					key: 'email_config',
					value: config,
					updated_at: new Date().toISOString(),
				}, { onConflict: 'key' });

			if (error) {
				console.warn('Supabase upsert for email_config failed (app_settings table might need creation):', error.message);
			} else {
				console.log('Email configuration successfully persisted to Supabase database.');
			}
		}
	} catch (e) {
		console.error('Error writing email config to Supabase:', e);
	}
}

export async function GET() {
	const config = await readEmailConfigAsync();
	return NextResponse.json(config);
}

export async function POST(request: Request) {
	try {
		const body = await request.json() as Partial<EmailConfig>;
		const current = await readEmailConfigAsync();

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

		await writeEmailConfigAsync(updated);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error saving email config:', error);
		return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
	}
}
