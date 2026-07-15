import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

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

const getInitialMockSessions = (): Record<string, ChatSession> => {
	const now = Date.now();
	const oneHour = 60 * 60 * 1000;
	const oneDay = 24 * oneHour;

	return {
		"stu-4cuo0w4c": {
			id: "stu-4cuo0w4c",
			userName: "Stu-4cuo0w4c",
			userEmail: "student1@sona.edu",
			userPhone: "9876543210",
			status: "active",
			assignedAgent: "agent@sona.com",
			createdAt: now - 3 * oneHour,
			lastActive: now,
			messages: [
				{
					id: "msg-1",
					sender: "system",
					senderName: "System",
					text: "Session started. Ask your question about admissions, courses, fees, or cutoffs.",
					timestamp: now - 3 * oneHour
				},
				{
					id: "msg-2",
					sender: "student",
					senderName: "Student",
					text: "welcome Student",
					timestamp: now - 2 * oneHour
				},
				{
					id: "msg-3",
					sender: "system",
					senderName: "System",
					text: "Agent agent joined the conversation.",
					timestamp: now - 1 * oneHour
				}
			]
		},
		"stu-N7zmvoka": {
			id: "stu-N7zmvoka",
			userName: "Stu-N7zmvoka",
			userEmail: "student2@sona.edu",
			userPhone: "9876543211",
			status: "active",
			assignedAgent: "agent@sona.com",
			createdAt: now - 1 * oneDay,
			lastActive: now - 4 * oneHour,
			messages: [
				{
					id: "msg-4",
					sender: "system",
					senderName: "System",
					text: "Session started. Ask your question about admissions, courses, fees, or cutoffs.",
					timestamp: now - 1 * oneDay
				},
				{
					id: "msg-5",
					sender: "system",
					senderName: "System",
					text: "Agent agent joined the conversation.",
					timestamp: now - 20 * oneHour
				}
			]
		},
		"stu-Wf2wzqv2": {
			id: "stu-Wf2wzqv2",
			userName: "Stu-Wf2wzqv2",
			userEmail: "student3@sona.edu",
			userPhone: "9876543212",
			status: "active",
			assignedAgent: "agent@sona.com",
			createdAt: now - 2 * oneDay,
			lastActive: now - 8 * oneHour,
			messages: [
				{
					id: "msg-6",
					sender: "system",
					senderName: "System",
					text: "Session started. Ask your question about admissions, courses, fees, or cutoffs.",
					timestamp: now - 2 * oneDay
				},
				{
					id: "msg-7",
					sender: "system",
					senderName: "System",
					text: "Agent agent joined the conversation.",
					timestamp: now - 1 * oneDay
				}
			]
		},
		"stu-T7mwfp2": {
			id: "stu-T7mwfp2",
			userName: "Stu-T7mwfp2",
			userEmail: "student4@sona.edu",
			userPhone: "9876543213",
			status: "waiting",
			assignedAgent: null,
			createdAt: now - 10 * oneHour,
			lastActive: now - 10 * oneHour,
			messages: [
				{
					id: "msg-8",
					sender: "system",
					senderName: "System",
					text: "Session started. Ask your question about admissions, courses, fees, or cutoffs.",
					timestamp: now - 10 * oneHour
				},
				{
					id: "msg-9",
					sender: "student",
					senderName: "Student",
					text: "I am a college admissions assistant.",
					timestamp: now - 9 * oneHour
				}
			]
		},
		"stu-28cfqamf": {
			id: "stu-28cfqamf",
			userName: "Stu-28cfqamf",
			userEmail: "student5@sona.edu",
			userPhone: "9876543214",
			status: "active",
			assignedAgent: "agent@sona.com",
			createdAt: now - 12 * oneHour,
			lastActive: now - 6 * oneHour,
			messages: [
				{
					id: "msg-10",
					sender: "system",
					senderName: "System",
					text: "Session started. Ask your question about admissions, courses, fees, or cutoffs.",
					timestamp: now - 12 * oneHour
				},
				{
					id: "msg-11",
					sender: "system",
					senderName: "System",
					text: "Agent agent joined the conversation.",
					timestamp: now - 11 * oneHour
				}
			]
		}
	};
};

const isSupabaseEnabled = () => {
	return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

// Map database snake_case columns to ChatSession properties
function mapDbToSession(row: any): ChatSession {
	return {
		id: row.id,
		userName: row.user_name,
		userEmail: row.user_email,
		userPhone: row.user_phone,
		status: row.status,
		assignedAgent: row.assigned_agent,
		messages: Array.isArray(row.messages) ? row.messages : [],
		createdAt: Number(row.created_at),
		lastActive: Number(row.last_active)
	};
}

// Map ChatSession properties to database snake_case columns
function mapSessionToDb(session: ChatSession) {
	return {
		id: session.id,
		user_name: session.userName,
		user_email: session.userEmail,
		user_phone: session.userPhone,
		status: session.status,
		assigned_agent: session.assignedAgent,
		messages: session.messages,
		created_at: session.createdAt,
		last_active: session.lastActive
	};
}

export class LiveChatDb {
	// Local File Sync DB Methods
	private static getLocalSessions(): Record<string, ChatSession> {
		try {
			if (!fs.existsSync(DB_FILE)) {
				const mockSessions = getInitialMockSessions();
				fs.writeFileSync(DB_FILE, JSON.stringify(mockSessions, null, 2), 'utf-8');
				return mockSessions;
			}
			const data = fs.readFileSync(DB_FILE, 'utf-8');
			return JSON.parse(data);
		} catch (error) {
			console.error("Error reading live chat database:", error);
			return {};
		}
	}

	private static saveLocalSessions(sessions: Record<string, ChatSession>): void {
		try {
			fs.writeFileSync(DB_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
		} catch (error) {
			console.error("Error writing to live chat database:", error);
		}
	}

	// Async API Methods Supporting Supabase & File Fallback
	static async getSessions(): Promise<Record<string, ChatSession>> {
		if (isSupabaseEnabled()) {
			try {
				const { data, error } = await supabase
					.from('chat_sessions')
					.select('*');
				
				if (error) {
					console.error("Error fetching sessions from Supabase:", error);
					return this.getLocalSessions();
				}

				const sessions: Record<string, ChatSession> = {};
				for (const row of data || []) {
					sessions[row.id] = mapDbToSession(row);
				}
				return sessions;
			} catch (error) {
				console.error("Failed to query Supabase, falling back to local file:", error);
				return this.getLocalSessions();
			}
		} else {
			return this.getLocalSessions();
		}
	}

	static async getSession(id: string): Promise<ChatSession | null> {
		if (isSupabaseEnabled()) {
			try {
				const { data, error } = await supabase
					.from('chat_sessions')
					.select('*')
					.eq('id', id)
					.maybeSingle();

				if (error) {
					console.error("Error fetching session from Supabase:", error);
					return this.getLocalSessions()[id] || null;
				}

				return data ? mapDbToSession(data) : null;
			} catch (error) {
				console.error("Failed to query Supabase, falling back to local file:", error);
				return this.getLocalSessions()[id] || null;
			}
		} else {
			return this.getLocalSessions()[id] || null;
		}
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

		if (isSupabaseEnabled()) {
			try {
				const dbRecord = mapSessionToDb(newSession);
				const { error } = await supabase
					.from('chat_sessions')
					.upsert(dbRecord);

				if (error) {
					console.error("Error creating session in Supabase:", error);
					// Save to local file as fallback
					const sessions = this.getLocalSessions();
					sessions[id] = newSession;
					this.saveLocalSessions(sessions);
				}
			} catch (error) {
				console.error("Failed to save to Supabase, falling back to local file:", error);
				const sessions = this.getLocalSessions();
				sessions[id] = newSession;
				this.saveLocalSessions(sessions);
			}
		} else {
			const sessions = this.getLocalSessions();
			sessions[id] = newSession;
			this.saveLocalSessions(sessions);
		}

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

		if (isSupabaseEnabled()) {
			try {
				const { error } = await supabase
					.from('chat_sessions')
					.update({
						messages: session.messages,
						last_active: now
					})
					.eq('id', sessionId);

				if (error) {
					console.error("Error adding message in Supabase:", error);
					// Save to local file as fallback
					const sessions = this.getLocalSessions();
					sessions[sessionId] = session;
					this.saveLocalSessions(sessions);
				}
			} catch (error) {
				console.error("Failed to save message to Supabase, falling back to local file:", error);
				const sessions = this.getLocalSessions();
				sessions[sessionId] = session;
				this.saveLocalSessions(sessions);
			}
		} else {
			const sessions = this.getLocalSessions();
			sessions[sessionId] = session;
			this.saveLocalSessions(sessions);
		}

		return message;
	}

	static async assignAgent(sessionId: string, agentEmail: string): Promise<boolean> {
		const session = await this.getSession(sessionId);
		if (!session) return false;

		const now = Date.now();
		session.assignedAgent = agentEmail;
		session.status = 'active';
		session.lastActive = now;
		session.messages.push({
			id: `system-assign-${now}`,
			sender: 'system',
			senderName: 'System',
			text: `Agent agent joined the conversation.`,
			timestamp: now
		});

		if (isSupabaseEnabled()) {
			try {
				const { error } = await supabase
					.from('chat_sessions')
					.update({
						assigned_agent: agentEmail,
						status: 'active',
						last_active: now,
						messages: session.messages
					})
					.eq('id', sessionId);

				if (error) {
					console.error("Error assigning agent in Supabase:", error);
					// Save to local file as fallback
					const sessions = this.getLocalSessions();
					sessions[sessionId] = session;
					this.saveLocalSessions(sessions);
					return false;
				}
				return true;
			} catch (error) {
				console.error("Failed to update Supabase, falling back to local file:", error);
				const sessions = this.getLocalSessions();
				sessions[sessionId] = session;
				this.saveLocalSessions(sessions);
				return false;
			}
		} else {
			const sessions = this.getLocalSessions();
			sessions[sessionId] = session;
			this.saveLocalSessions(sessions);
			return true;
		}
	}

	static async resolveSession(sessionId: string): Promise<boolean> {
		const session = await this.getSession(sessionId);
		if (!session) return false;

		const now = Date.now();
		session.status = 'resolved';
		session.lastActive = now;
		session.messages.push({
			id: `system-resolve-${now}`,
			sender: 'system',
			senderName: 'System',
			text: 'This chat has been marked as resolved.',
			timestamp: now
		});

		if (isSupabaseEnabled()) {
			try {
				const { error } = await supabase
					.from('chat_sessions')
					.update({
						status: 'resolved',
						last_active: now,
						messages: session.messages
					})
					.eq('id', sessionId);

				if (error) {
					console.error("Error resolving session in Supabase:", error);
					// Save to local file as fallback
					const sessions = this.getLocalSessions();
					sessions[sessionId] = session;
					this.saveLocalSessions(sessions);
					return false;
				}
				return true;
			} catch (error) {
				console.error("Failed to update Supabase, falling back to local file:", error);
				const sessions = this.getLocalSessions();
				sessions[sessionId] = session;
				this.saveLocalSessions(sessions);
				return false;
			}
		} else {
			const sessions = this.getLocalSessions();
			sessions[sessionId] = session;
			this.saveLocalSessions(sessions);
			return true;
		}
	}
}
