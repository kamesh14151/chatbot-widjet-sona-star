import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function GET() {
	const start = Date.now();
	const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || '';

	if (!mongoUri) {
		return NextResponse.json({
			connected: false,
			status: 'misconfigured',
			message: 'MONGODB_URI environment variable is not configured.',
			latencyMs: null,
			checkedAt: new Date().toISOString(),
		});
	}

	try {
		const db = await getMongoDb();
		if (!db) {
			return NextResponse.json({
				connected: false,
				status: 'error',
				message: 'Could not connect to MongoDB server.',
				latencyMs: null,
				checkedAt: new Date().toISOString(),
			});
		}

		// Ping database
		await db.command({ ping: 1 });
		const latencyMs = Date.now() - start;

		// Check if uwalivechats collection exists
		const collections = await db.listCollections({ name: 'uwalivechats' }).toArray();
		const hasTable = collections.length > 0;

		return NextResponse.json({
			connected: true,
			status: hasTable ? 'ready' : 'no_tables',
			message: hasTable
				? 'MongoDB connected and uwalivechats collection is ready.'
				: 'MongoDB connected. uwalivechats collection will be created on first chat session.',
			latencyMs,
			checkedAt: new Date().toISOString(),
		});
	} catch (error: any) {
		return NextResponse.json({
			connected: false,
			status: 'error',
			message: error.message || 'Error connecting to MongoDB database.',
			latencyMs: Date.now() - start,
			checkedAt: new Date().toISOString(),
		});
	}
}
