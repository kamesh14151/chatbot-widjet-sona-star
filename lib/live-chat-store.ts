import { create } from 'zustand';

export interface LiveMessage {
	id: string;
	sender: 'student' | 'agent' | 'system' | 'ai';
	senderName: string;
	text: string;
	timestamp: number;
}

interface LiveChatState {
	mode: 'ai' | 'live';
	sessionId: string | null;
	sessionStatus: 'none' | 'waiting' | 'active' | 'resolved';
	assignedAgent: string | null;
	messages: LiveMessage[];
	studentName: string;
	studentEmail: string;
	studentPhone: string;
	isConnecting: boolean;
	isConnected: boolean;

	setMode: (mode: 'ai' | 'live') => void;
	initSession: (name: string, email: string, phone: string) => Promise<boolean>;
	fetchSessionState: () => Promise<void>;
	sendMessage: (text: string) => Promise<void>;
	resolveSession: () => Promise<void>;
	loadSessionFromStorage: () => void;
}

// Helper to generate a random session ID matching the screenshot style: stu-xxxxxx
const generateSessionId = () => {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = 'stu-';
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

export const useLiveChatStore = create<LiveChatState>((set, get) => ({
	mode: 'ai',
	sessionId: null,
	sessionStatus: 'none',
	assignedAgent: null,
	messages: [],
	studentName: '',
	studentEmail: '',
	studentPhone: '',
	isConnecting: false,
	isConnected: true, // Show connected/reconnecting badge in header

	setMode: (mode) => set({ mode }),

	loadSessionFromStorage: () => {
		if (typeof window === 'undefined') return;
		const savedSessionId = sessionStorage.getItem('live_chat_session_id');
		const savedMode = sessionStorage.getItem('live_chat_mode') as 'ai' | 'live' | null;
		const name = sessionStorage.getItem('scale_uwa_user_name') || '';
		const email = sessionStorage.getItem('scale_uwa_user_email') || '';
		const phone = sessionStorage.getItem('scale_uwa_user_phone') || '';

		if (savedSessionId) {
			set({
				sessionId: savedSessionId,
				mode: savedMode || 'ai',
				studentName: name,
				studentEmail: email,
				studentPhone: phone
			});
			// Fetch state from server immediately
			get().fetchSessionState();
		}
	},

	initSession: async (name, email, phone) => {
		set({ isConnecting: true });
		let sid = get().sessionId;
		if (!sid) {
			sid = generateSessionId();
			sessionStorage.setItem('live_chat_session_id', sid);
		}

		// Save details to session storage
		sessionStorage.setItem('scale_uwa_user_name', name);
		sessionStorage.setItem('scale_uwa_user_email', email);
		sessionStorage.setItem('scale_uwa_user_phone', phone);
		document.cookie = `scale_uwa_user_name=${encodeURIComponent(name)}; path=/; max-age=86400; SameSite=Lax`;
		sessionStorage.setItem('scale_uwa_lead_submitted', 'true');

		try {
			const res = await fetch('/api/live-agent/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: sid, name, email, phone })
			});

			if (!res.ok) throw new Error("Failed to initialize session");

			const session = await res.json();
			sessionStorage.setItem('live_chat_mode', 'live');
			set({
				sessionId: sid,
				mode: 'live',
				sessionStatus: session.status,
				assignedAgent: session.assignedAgent,
				messages: session.messages || [],
				studentName: name,
				studentEmail: email,
				studentPhone: phone,
				isConnecting: false
			});
			return true;
		} catch (error) {
			console.error("Error initiating live agent session:", error);
			set({ isConnecting: false });
			return false;
		}
	},

	fetchSessionState: async () => {
		const sid = get().sessionId;
		if (!sid) return;

		try {
			set({ isConnected: true });
			const res = await fetch(`/api/live-agent/messages?sessionId=${sid}`);
			if (!res.ok) {
				if (res.status === 404) {
					// Session was cleared or not initialized
					return;
				}
				throw new Error("Failed to fetch messages");
			}

			const data = await res.json();
			set({
				sessionStatus: data.status,
				assignedAgent: data.assignedAgent,
				messages: data.messages || [],
				studentName: data.userName || get().studentName
			});
		} catch (error) {
			console.error("Error polling live messages:", error);
			set({ isConnected: false }); // Show reconnecting indicator on poll failure
		}
	},

	sendMessage: async (text) => {
		const sid = get().sessionId;
		const name = get().studentName || 'Student';
		if (!sid || !text.trim()) return;

		// Optimistic update
		const tempMsg: LiveMessage = {
			id: `temp-${Date.now()}`,
			sender: 'student',
			senderName: name,
			text,
			timestamp: Date.now()
		};

		set(state => ({
			messages: [...state.messages, tempMsg]
		}));

		try {
			const res = await fetch('/api/live-agent/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: sid,
					sender: 'student',
					senderName: name,
					text
				})
			});

			if (!res.ok) throw new Error("Failed to send message");

			// Fetch latest messages to sync
			await get().fetchSessionState();
		} catch (error) {
			console.error("Error sending message:", error);
			// Rollback optimistic update or mark as failed
			get().fetchSessionState();
		}
	},

	resolveSession: async () => {
		const sid = get().sessionId;
		if (!sid) return;

		try {
			const res = await fetch('/api/live-agent/status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: sid,
					status: 'resolved'
				})
			});

			if (res.ok) {
				sessionStorage.setItem('live_chat_mode', 'ai');
				set({
					mode: 'ai',
					sessionStatus: 'resolved'
				});
			}
		} catch (error) {
			console.error("Error resolving session:", error);
		}
	}
}));
