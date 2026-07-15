import fs from 'fs';
import path from 'path';

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

export class LiveChatDb {
	static getSessions(): Record<string, ChatSession> {
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

	static saveSessions(sessions: Record<string, ChatSession>): void {
		try {
			fs.writeFileSync(DB_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
		} catch (error) {
			console.error("Error writing to live chat database:", error);
		}
	}

	static getSession(id: string): ChatSession | null {
		const sessions = this.getSessions();
		return sessions[id] || null;
	}

	static createSession(id: string, name: string, email: string, phone: string): ChatSession {
		const sessions = this.getSessions();
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
		sessions[id] = newSession;
		this.saveSessions(sessions);
		return newSession;
	}

	static addMessage(sessionId: string, sender: 'student' | 'agent' | 'system' | 'ai', senderName: string, text: string): ChatMessage | null {
		const sessions = this.getSessions();
		const session = sessions[sessionId];
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
		sessions[sessionId] = session;
		this.saveSessions(sessions);
		return message;
	}

	static assignAgent(sessionId: string, agentEmail: string): boolean {
		const sessions = this.getSessions();
		const session = sessions[sessionId];
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

		sessions[sessionId] = session;
		this.saveSessions(sessions);
		return true;
	}

	static resolveSession(sessionId: string): boolean {
		const sessions = this.getSessions();
		const session = sessions[sessionId];
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

		sessions[sessionId] = session;
		this.saveSessions(sessions);
		return true;
	}
}
