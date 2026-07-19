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

	// Feature #4: session resume state
	hasExistingSession: boolean;

	setMode: (mode: 'ai' | 'live') => void;
	initSession: (name: string, email: string, phone: string) => Promise<boolean>;
	resumeSession: () => Promise<void>;
	discardSession: () => void;
	fetchSessionState: () => Promise<void>;
	sendMessage: (text: string) => Promise<void>;
	resolveSession: () => Promise<void>;
	loadSessionFromStorage: () => void;
}

// Helper to generate a random session ID: stu-xxxxxxxx
const generateSessionId = () => {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = 'stu-';
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

// ─────────────────────────────────────────────
// Feature #2: localStorage helpers (persist across browser close)
// ─────────────────────────────────────────────
const LS_SESSION_ID_KEY    = 'live_chat_session_id';
const LS_SESSION_MODE_KEY  = 'live_chat_mode';
const LS_NAME_KEY          = 'scale_uwa_user_name';
const LS_EMAIL_KEY         = 'scale_uwa_user_email';
const LS_PHONE_KEY         = 'scale_uwa_user_phone';
const LS_LEAD_KEY          = 'scale_uwa_lead_submitted';
const LS_SESSION_TS_KEY    = 'live_chat_session_ts';
const SESSION_TTL_MS       = 24 * 60 * 60 * 1000; // 24 hours

function lsGet(key: string): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(key);
}

function lsSet(key: string, value: string) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(key, value);
}

function lsRemove(key: string) {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(key);
}

function isSessionExpired(): boolean {
	const ts = lsGet(LS_SESSION_TS_KEY);
	if (!ts) return true;
	return Date.now() - parseInt(ts, 10) > SESSION_TTL_MS;
}

function clearLocalSession() {
	lsRemove(LS_SESSION_ID_KEY);
	lsRemove(LS_SESSION_MODE_KEY);
	lsRemove(LS_LEAD_KEY);
	lsRemove(LS_SESSION_TS_KEY);
	// keep name/email/phone so the form pre-fills
}

// ─────────────────────────────────────────────

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
	isConnected: true,
	hasExistingSession: false, // Feature #4

	setMode: (mode) => set({ mode }),

	// ─── Feature #4: Session Resume ───────────────────────────
	resumeSession: async () => {
		const sid = lsGet(LS_SESSION_ID_KEY);
		if (!sid) return;

		try {
			const res = await fetch(`/api/live-agent/messages?sessionId=${sid}`);
			if (!res.ok) {
				clearLocalSession();
				set({ hasExistingSession: false });
				return;
			}
			const data = await res.json();

			// If the server still has it (not resolved), resume
			if (data.status && data.status !== 'resolved') {
				set({
					sessionId: sid,
					mode: 'live',
					sessionStatus: data.status,
					assignedAgent: data.assignedAgent,
					messages: data.messages || [],
					studentName: lsGet(LS_NAME_KEY) || data.userName || '',
					studentEmail: lsGet(LS_EMAIL_KEY) || '',
					studentPhone: lsGet(LS_PHONE_KEY) || '',
					hasExistingSession: false,
				});
				lsSet(LS_SESSION_MODE_KEY, 'live');
				lsSet(LS_SESSION_TS_KEY, String(Date.now())); // refresh TTL
			} else {
				// Session is resolved on server — clear it
				clearLocalSession();
				set({ hasExistingSession: false });
			}
		} catch {
			clearLocalSession();
			set({ hasExistingSession: false });
		}
	},

	discardSession: () => {
		clearLocalSession();
		set({ hasExistingSession: false, sessionId: null, mode: 'ai' });
	},
	// ──────────────────────────────────────────────────────────

	// Feature #2 + #4: Load and detect existing session from localStorage
	loadSessionFromStorage: () => {
		if (typeof window === 'undefined') return;

		const savedSessionId = lsGet(LS_SESSION_ID_KEY);
		const savedMode      = lsGet(LS_SESSION_MODE_KEY) as 'ai' | 'live' | null;
		const name           = lsGet(LS_NAME_KEY) || '';
		const email          = lsGet(LS_EMAIL_KEY) || '';
		const phone          = lsGet(LS_PHONE_KEY) || '';

		if (savedSessionId) {
			// Check TTL
			if (isSessionExpired()) {
				clearLocalSession();
				set({ studentName: name, studentEmail: email, studentPhone: phone });
				return;
			}

			if (savedMode === 'live') {
				// Feature #4: Show resume banner instead of auto-jumping into live mode
				set({
					sessionId: savedSessionId,
					studentName: name,
					studentEmail: email,
					studentPhone: phone,
					hasExistingSession: true, // triggers the resume banner
					mode: 'ai', // stay in ai mode until user confirms resume
				});
			} else {
				set({ studentName: name, studentEmail: email, studentPhone: phone });
			}
		} else {
			// Pre-fill form fields even without a session
			set({ studentName: name, studentEmail: email, studentPhone: phone });
		}
	},

	initSession: async (name, email, phone) => {
		set({ isConnecting: true });
		let sid = get().sessionId;
		if (!sid) {
			sid = generateSessionId();
		}

		// Feature #2: persist to localStorage (survives browser close)
		lsSet(LS_SESSION_ID_KEY, sid);
		lsSet(LS_SESSION_TS_KEY, String(Date.now()));
		lsSet(LS_NAME_KEY, name);
		lsSet(LS_EMAIL_KEY, email);
		lsSet(LS_PHONE_KEY, phone);
		lsSet(LS_LEAD_KEY, 'true');

		// Also keep sessionStorage for same-tab compatibility
		sessionStorage.setItem('live_chat_session_id', sid);
		sessionStorage.setItem('scale_uwa_user_name', name);
		sessionStorage.setItem('scale_uwa_user_email', email);
		sessionStorage.setItem('scale_uwa_user_phone', phone);
		sessionStorage.setItem('scale_uwa_lead_submitted', 'true');
		document.cookie = `scale_uwa_user_name=${encodeURIComponent(name)}; path=/; max-age=86400; SameSite=Lax`;

		try {
			const res = await fetch('/api/live-agent/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: sid, name, email, phone }),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				// Feature #3: surface rate limit message
				if (res.status === 429) {
					set({ isConnecting: false });
					throw new Error(errData.error || 'Too many sessions. Please wait before trying again.');
				}
				throw new Error('Failed to initialize session');
			}

			const session = await res.json();
			lsSet(LS_SESSION_MODE_KEY, 'live');
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
				isConnecting: false,
				hasExistingSession: false,
			});
			return true;
		} catch (error) {
			console.error('Error initiating live agent session:', error);
			set({ isConnecting: false });
			throw error; // rethrow so UI can show message
		}
	},

	fetchSessionState: async () => {
		const sid = get().sessionId;
		if (!sid) return;

		try {
			set({ isConnected: true });
			const res = await fetch(`/api/live-agent/messages?sessionId=${sid}`);
			if (!res.ok) {
				if (res.status === 404) return;
				throw new Error('Failed to fetch messages');
			}

			const data = await res.json();
			// Refresh localStorage TTL on successful poll
			lsSet(LS_SESSION_TS_KEY, String(Date.now()));

			set({
				sessionStatus: data.status,
				assignedAgent: data.assignedAgent,
				messages: data.messages || [],
				studentName: data.userName || get().studentName,
			});
		} catch (error) {
			console.error('Error polling live messages:', error);
			set({ isConnected: false });
		}
	},

	sendMessage: async (text) => {
		const sid  = get().sessionId;
		const name = get().studentName || 'Student';
		if (!sid || !text.trim()) return;

		const tempMsg: LiveMessage = {
			id: `temp-${Date.now()}`,
			sender: 'student',
			senderName: name,
			text,
			timestamp: Date.now(),
		};

		set((state) => ({ messages: [...state.messages, tempMsg] }));

		try {
			const res = await fetch('/api/live-agent/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: sid, sender: 'student', senderName: name, text }),
			});

			if (!res.ok) throw new Error('Failed to send message');
			await get().fetchSessionState();
		} catch (error) {
			console.error('Error sending message:', error);
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
				body: JSON.stringify({ sessionId: sid, status: 'resolved' }),
			});

			if (res.ok) {
				clearLocalSession();
				sessionStorage.setItem('live_chat_mode', 'ai');
				set({ mode: 'ai', sessionStatus: 'resolved', hasExistingSession: false });
			}
		} catch (error) {
			console.error('Error resolving session:', error);
		}
	},
}));
