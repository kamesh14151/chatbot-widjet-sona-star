import fs from 'fs';
import path from 'path';
import { getMongoDb } from './mongodb';

export interface ChatMessage {
	id: string;
	sender: 'student' | 'agent' | 'system' | 'ai';
	senderName: string;
	text: string;
	timestamp: number;
}

export interface ChatSession {
	id: string;
	userName: string;
	userEmail: string;
	userPhone: string;
	status: 'waiting' | 'active' | 'resolved';
	assignedAgent: string | null;
	messages: ChatMessage[];
	createdAt: number;
	lastActive: number;
}

const DB_FILE = path.join(process.cwd(), 'live-chats.json');

// Map MongoDB document structure to ChatSession
function mapMongoToSession(doc: any): ChatSession {
	return {
		id: doc.sessionId || doc.id || doc._id?.toString(),
		userName: doc.name || doc.userName || '',
		userEmail: doc.email || doc.userEmail || '',
		userPhone: doc.phone || doc.userPhone || '',
		status: doc.status || 'waiting',
		assignedAgent: doc.assignedAgent || null,
		messages: Array.isArray(doc.messages) ? doc.messages : [],
		createdAt: Number(doc.createdAt ? new Date(doc.createdAt).getTime() : (doc.created_at || Date.now())),
		lastActive: Number(doc.lastActive || doc.last_active || Date.now())
	};
}

// Map ChatSession to MongoDB document structure
function mapSessionToMongo(session: ChatSession) {
	return {
		sessionId: session.id,
		name: session.userName,
		email: session.userEmail,
		phone: session.userPhone,
		course: "MS in Data Science 1+1",
		source: "SCALE UWA Chatbot",
		status: session.status,
		assignedAgent: session.assignedAgent,
		messages: session.messages,
		createdAt: new Date(session.createdAt),
		lastActive: session.lastActive,
		updatedAt: new Date()
	};
}

export class LiveChatDb {
	// Local File Sync DB Methods
	private static getLocalSessions(): Record<string, ChatSession> {
		try {
			if (!fs.existsSync(DB_FILE)) {
				fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2), 'utf-8');
				return {};
			}
			const data = fs.readFileSync(DB_FILE, 'utf-8');
			return JSON.parse(data);
		} catch (error) {
			console.error("Error reading local live chat database:", error);
			return {};
		}
	}

	private static saveLocalSessions(sessions: Record<string, ChatSession>): void {
		try {
			fs.writeFileSync(DB_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
		} catch (error) {
			console.error("Error writing to local live chat database:", error);
		}
	}

	// Async API Methods Supporting MongoDB (Production Primary) & File (Offline Fallback)
	static async getSessions(): Promise<Record<string, ChatSession>> {
		// 1. Try MongoDB
		const db = await getMongoDb();
		if (db) {
			try {
				const collection = db.collection('uwalivechats');
				const docs = await collection.find({}).sort({ lastActive: -1 }).toArray();
				const sessions: Record<string, ChatSession> = {};
				for (const doc of docs) {
					const mapped = mapMongoToSession(doc);
					sessions[mapped.id] = mapped;
				}
				return sessions;
			} catch (err) {
				console.error("MongoDB getSessions error, falling back to local file:", err);
			}
		}

		// 2. Fallback to Local File
		return this.getLocalSessions();
	}

	static async getSession(id: string): Promise<ChatSession | null> {
		// 1. Try MongoDB
		const db = await getMongoDb();
		if (db) {
			try {
				const collection = db.collection('uwalivechats');
				const doc = await collection.findOne({ $or: [{ sessionId: id }, { id: id }] });
				if (doc) return mapMongoToSession(doc);
			} catch (err) {
				console.error("MongoDB getSession error:", err);
			}
		}

		// 2. Fallback to Local File
		return this.getLocalSessions()[id] || null;
	}

	static async createSession(id: string, name: string, email: string, phone: string): Promise<ChatSession> {
		const now = Date.now();
		const newSession: ChatSession = {
			id,
			userName: name,
			userEmail: email,
			userPhone: phone,
			status: 'waiting',
			assignedAgent: null,
			createdAt: now,
			lastActive: now,
			messages: [
				{
					id: `system-${now}`,
					sender: 'system',
					senderName: 'System',
					text: 'Session started. Ask your question about admissions, courses, fees, or cutoffs.',
					timestamp: now
				}
			]
		};

		// 1. Write to MongoDB
		const db = await getMongoDb();
		if (db) {
			try {
				const collection = db.collection('uwalivechats');
				const mongoDoc = mapSessionToMongo(newSession);
				await collection.updateOne(
					{ sessionId: id },
					{ $set: mongoDoc },
					{ upsert: true }
				);
			} catch (err) {
				console.error("MongoDB createSession error:", err);
			}
		}

		// 2. Save locally as fallback
		const sessions = this.getLocalSessions();
		sessions[id] = newSession;
		this.saveLocalSessions(sessions);

		return newSession;
	}

	static async addMessage(sessionId: string, sender: 'student' | 'agent' | 'system' | 'ai', senderName: string, text: string): Promise<ChatMessage | null> {
		const session = await this.getSession(sessionId);
		if (!session) return null;

		const now = Date.now();
		const message: ChatMessage = {
			id: `msg-${now}-${Math.random().toString(36).substr(2, 9)}`,
			sender,
			senderName,
			text,
			timestamp: now
		};

		session.messages.push(message);
		session.lastActive = now;

		// 1. Update MongoDB
		const db = await getMongoDb();
		if (db) {
			try {
				const collection = db.collection('uwalivechats');
				await collection.updateOne(
					{ $or: [{ sessionId }, { id: sessionId }] },
					{
						$push: { messages: message } as any,
						$set: { lastActive: now, updatedAt: new Date() }
					}
				);
			} catch (err) {
				console.error("MongoDB addMessage error:", err);
			}
		}

		// 2. Local file update
		const sessions = this.getLocalSessions();
		sessions[sessionId] = session;
		this.saveLocalSessions(sessions);

		return message;
	}

	static async assignAgent(sessionId: string, agentEmail: string): Promise<boolean> {
		const session = await this.getSession(sessionId);
		if (!session) return false;

		const now = Date.now();
		session.assignedAgent = agentEmail;
		session.status = 'active';
		session.lastActive = now;
		const systemMsg: ChatMessage = {
			id: `system-assign-${now}`,
			sender: 'system',
			senderName: 'System',
			text: `Agent ${agentEmail || 'Expert'} joined the conversation.`,
			timestamp: now
		};
		session.messages.push(systemMsg);

		// 1. Update MongoDB
		const db = await getMongoDb();
		if (db) {
			try {
				const collection = db.collection('uwalivechats');
				await collection.updateOne(
					{ $or: [{ sessionId }, { id: sessionId }] },
					{
						$set: { assignedAgent: agentEmail, status: 'active', lastActive: now, updatedAt: new Date() },
						$push: { messages: systemMsg } as any
					}
				);
			} catch (err) {
				console.error("MongoDB assignAgent error:", err);
			}
		}

		// 2. Local file update
		const sessions = this.getLocalSessions();
		sessions[sessionId] = session;
		this.saveLocalSessions(sessions);

		return true;
	}

	static async resolveSession(sessionId: string): Promise<boolean> {
		const session = await this.getSession(sessionId);
		if (!session) return false;

		const now = Date.now();
		session.status = 'resolved';
		session.lastActive = now;
		const resolveMsg: ChatMessage = {
			id: `system-resolve-${now}`,
			sender: 'system',
			senderName: 'System',
			text: 'This chat has been marked as resolved.',
			timestamp: now
		};
		session.messages.push(resolveMsg);

		// 1. Update MongoDB
		const db = await getMongoDb();
		if (db) {
			try {
				const collection = db.collection('uwalivechats');
				await collection.updateOne(
					{ $or: [{ sessionId }, { id: sessionId }] },
					{
						$set: { status: 'resolved', lastActive: now, updatedAt: new Date() },
						$push: { messages: resolveMsg } as any
					}
				);
			} catch (err) {
				console.error("MongoDB resolveSession error:", err);
			}
		}

		// 2. Local file update
		const sessions = this.getLocalSessions();
		sessions[sessionId] = session;
		this.saveLocalSessions(sessions);

		return true;
	}

	static async deleteSessions(sessionIds: string[]): Promise<number> {
		let count = 0;
		const db = await getMongoDb();
		if (db) {
			try {
				const collection = db.collection('uwalivechats');
				const res = await collection.deleteMany({
					$or: [
						{ sessionId: { $in: sessionIds } },
						{ id: { $in: sessionIds } }
					]
				});
				count = res.deletedCount || 0;
			} catch (err) {
				console.error("MongoDB deleteSessions error:", err);
			}
		}

		const sessions = this.getLocalSessions();
		for (const sid of sessionIds) {
			if (sessions[sid]) {
				delete sessions[sid];
				count++;
			}
		}
		this.saveLocalSessions(sessions);

		return count;
	}
}
