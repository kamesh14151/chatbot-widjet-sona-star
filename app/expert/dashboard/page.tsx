"use client";

// Expert Dashboard — same functionality as Agent Dashboard
// but branded for "Expert" role and redirects to /expert/login
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SearchIcon, Loader2Icon, SendIcon, CheckCircleIcon, UsersIcon, DatabaseIcon } from 'lucide-react';
import { ChatSession, ChatMessage } from '@/lib/live-chat-db';

interface DbStatus {
	connected: boolean;
	status: 'ready' | 'no_tables' | 'misconfigured' | 'error' | 'checking';
	message: string;
	latencyMs: number | null;
	checkedAt: string;
}

export default function ExpertDashboard() {
	const router = useRouter();
	const [sessions, setSessions] = useState<ChatSession[]>([]);
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
	const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
	const [replyText, setReplyText] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [lastSyncTime, setLastSyncTime] = useState('');
	const [sending, setSending] = useState(false);
	const [expertEmail, setExpertEmail] = useState('expert@sona.com');
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [dbStatus, setDbStatus] = useState<DbStatus>({
		connected: false,
		status: 'checking',
		message: 'Checking connection…',
		latencyMs: null,
		checkedAt: '',
	});

	// Auth check — expert role required
	useEffect(() => {
		const isLoggedIn = sessionStorage.getItem('agent_logged_in') === 'true';
		const role = sessionStorage.getItem('agent_role');
		if (!isLoggedIn || (role !== 'expert' && role !== 'admin')) {
			router.push('/agent/login?role=expert');
			return;
		}
		const email = sessionStorage.getItem('agent_email') || 'expert@sona.com';
		setExpertEmail(email);
	}, [router]);

	const checkDbStatus = async () => {
		try {
			const res = await fetch('/api/db-status');
			if (!res.ok) throw new Error('Failed to reach DB status API');
			const data: DbStatus = await res.json();
			setDbStatus(data);
		} catch {
			setDbStatus(prev => ({
				...prev,
				connected: false,
				status: 'error',
				message: 'Could not reach status endpoint.',
				checkedAt: new Date().toISOString(),
			}));
		}
	};

	useEffect(() => {
		checkDbStatus();
		const interval = setInterval(checkDbStatus, 10000);
		return () => clearInterval(interval);
	}, []);

	const fetchSessions = async (selectFirst = false) => {
		try {
			const res = await fetch('/api/live-agent/list');
			if (!res.ok) throw new Error('Failed to fetch sessions');
			const list: ChatSession[] = await res.json();
			setSessions(list);
			setLastSyncTime(new Date().toLocaleString());
			if (selectFirst && list.length > 0 && !selectedSessionId) {
				setSelectedSessionId(list[0].id);
			}
		} catch (error) {
			console.error('Error fetching sessions list:', error);
		}
	};

	useEffect(() => {
		fetchSessions(true);
		const interval = setInterval(() => fetchSessions(), 2000);
		return () => clearInterval(interval);
	}, [selectedSessionId]);

	const fetchActiveSessionDetail = async () => {
		if (!selectedSessionId) {
			setActiveSession(null);
			return;
		}
		try {
			const res = await fetch(`/api/live-agent/messages?sessionId=${selectedSessionId}`);
			if (!res.ok) throw new Error('Failed to fetch session messages');
			const data = await res.json();
			const meta = sessions.find(s => s.id === selectedSessionId);
			if (meta) {
				setActiveSession({ ...meta, messages: data.messages, status: data.status, assignedAgent: data.assignedAgent });
			} else {
				setActiveSession({
					id: selectedSessionId,
					userName: data.userName || selectedSessionId,
					userEmail: '',
					userPhone: '',
					status: data.status,
					assignedAgent: data.assignedAgent,
					messages: data.messages,
					createdAt: Date.now(),
					lastActive: Date.now(),
				});
			}
		} catch (error) {
			console.error('Error loading active session details:', error);
		}
	};

	useEffect(() => { fetchActiveSessionDetail(); }, [selectedSessionId, sessions]);
	useEffect(() => {
		if (!selectedSessionId) return;
		const interval = setInterval(() => fetchActiveSessionDetail(), 1000);
		return () => clearInterval(interval);
	}, [selectedSessionId]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [activeSession?.messages]);

	const handleSendReply = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedSessionId || !replyText.trim() || !activeSession) return;
		if (activeSession.assignedAgent !== expertEmail) await handleAssign();
		setSending(true);
		const text = replyText;
		setReplyText('');
		try {
			await fetch('/api/live-agent/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: selectedSessionId, sender: 'agent', senderName: 'Expert', text }),
			});
			await fetchActiveSessionDetail();
		} catch (error) {
			console.error('Error sending reply:', error);
		} finally {
			setSending(false);
		}
	};

	const handleAssign = async () => {
		if (!selectedSessionId) return;
		await fetch('/api/live-agent/assign', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId: selectedSessionId, agentEmail: expertEmail }),
		});
		fetchSessions();
	};

	const handleMarkResolved = async () => {
		if (!selectedSessionId) return;
		await fetch('/api/live-agent/status', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId: selectedSessionId, status: 'resolved' }),
		});
		fetchSessions();
		setSelectedSessionId(null);
		setActiveSession(null);
	};

	const handleLogout = () => {
		sessionStorage.clear();
		router.push('/expert');
	};

	const filteredSessions = sessions.filter(s => {
		const q = searchQuery.toLowerCase();
		return s.id.toLowerCase().includes(q) || s.userName.toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q);
	});

	const waitingCount = sessions.filter(s => s.status === 'waiting').length;
	const activeCount = sessions.filter(s => s.status === 'active').length;

	const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	const formatDate = (ts: number) => new Date(ts).toLocaleString();
	const getWaitTime = (s: ChatSession) => `${Math.floor((Date.now() - s.createdAt) / 60000)}m`;

	return (
		<div className="min-h-screen bg-[#edf3f6] dark:bg-zinc-950 flex flex-col font-sans text-slate-800 dark:text-zinc-100">
			<header className="bg-[#fff7cd] dark:bg-zinc-900 border-b border-[#ebd7a3] dark:border-zinc-800 px-6 py-4 flex items-center shrink-0">
				<h1 className="text-sm font-bold tracking-wide uppercase">SONA SCALE UWA — Expert Console</h1>
			</header>

			<div className="flex-1 flex flex-col md:flex-row overflow-hidden">
				{/* Sidebar */}
				<aside className="w-full md:w-[350px] bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 overflow-hidden">
					<div className="p-5 border-b border-slate-100 dark:border-zinc-850 flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<div>
								<span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">EXPERT PORTAL</span>
								<h2 className="text-xl font-bold text-[#003859] dark:text-zinc-200 leading-none mt-1">Expert Console</h2>
								<p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">Manage live conversations.</p>
							</div>
							<div className="flex items-center gap-1.5 shrink-0">
								<button
									onClick={checkDbStatus}
									className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#003859] hover:bg-[#002b45] rounded-lg transition-all cursor-pointer shadow-sm"
									title="Refresh DB status"
								>
									Status
								</button>
								<button
									onClick={handleLogout}
									className="px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
								>
									Logout
								</button>
							</div>
						</div>

						{/* Metrics */}
						<div className="grid grid-cols-2 gap-2.5">
							<div className="bg-slate-50 dark:bg-zinc-800 border border-slate-100 p-2.5 rounded-xl text-left shadow-sm">
								<div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">QUEUE</div>
								<div className="text-lg font-black text-slate-800 dark:text-zinc-100 leading-none mt-1">{waitingCount + activeCount}</div>
							</div>
							<div className="bg-slate-50 dark:bg-zinc-800 border border-slate-100 p-2.5 rounded-xl text-left shadow-sm flex flex-col justify-between">
								<div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">SOCKET</div>
								<div className="flex items-center gap-1.5 mt-1">
									<span className="relative flex h-2 w-2">
										<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
										<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
									</span>
									<span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Online</span>
								</div>
							</div>
							{/* DB Status */}
							<div
								title={dbStatus.message}
								className={`col-span-2 p-2.5 rounded-xl text-left shadow-sm border flex items-center justify-between gap-2 cursor-default transition-colors ${
									dbStatus.status === 'checking' ? 'bg-slate-50 dark:bg-zinc-800 border-slate-100' :
									dbStatus.connected && dbStatus.status === 'ready' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200' :
									'bg-red-50 dark:bg-red-950/30 border-red-200'
								}`}
							>
								<div className="flex items-center gap-2">
									<DatabaseIcon className={`w-3.5 h-3.5 shrink-0 ${dbStatus.connected ? 'text-emerald-500' : 'text-red-500'}`} />
									<div>
										<div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">DATABASE</div>
										<div className={`text-[10px] font-bold mt-0.5 ${dbStatus.connected ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
											{dbStatus.status === 'ready' ? 'Connected & Ready' : dbStatus.status === 'checking' ? 'Checking…' : 'Disconnected'}
										</div>
									</div>
								</div>
								{dbStatus.latencyMs !== null && (
									<span className="text-[8px] text-slate-400 font-mono">{dbStatus.latencyMs}ms</span>
								)}
							</div>
						</div>

						{/* Search */}
						<div className="relative">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search sessions..."
								className="w-full bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#003859]"
							/>
							<SearchIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
						</div>

						<div className="text-[9px] text-slate-400 text-center pt-1">Last sync: {lastSyncTime || 'Loading...'}</div>
					</div>

					{/* Session List */}
					<div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-850">
						{filteredSessions.length === 0 ? (
							<div className="p-8 text-center text-xs text-slate-400">No active conversations found.</div>
						) : filteredSessions.map(session => {
							const isSelected = session.id === selectedSessionId;
							const lastMessage = session.messages?.length ? session.messages[session.messages.length - 1].text : 'No messages yet.';
							return (
								<button
									key={session.id}
									onClick={() => setSelectedSessionId(session.id)}
									className={`w-full text-left p-4 transition-all duration-150 flex flex-col gap-1.5 cursor-pointer relative hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 ${
										isSelected ? 'bg-gradient-to-r from-sky-50 to-white dark:from-zinc-850 dark:to-zinc-900 border-l-4 border-[#003859]' : 'border-l-4 border-transparent'
									}`}
								>
									<div className="flex items-center justify-between">
										<span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{session.userName || session.id}</span>
										<span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
											session.status === 'waiting' ? 'bg-amber-100 text-amber-800' :
											session.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
											'bg-slate-100 text-slate-600'
										}`}>{session.status}</span>
									</div>
									<p className="text-[10px] text-slate-500 line-clamp-1">{lastMessage}</p>
									<div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
										<span>{formatDate(session.createdAt)}</span>
										<span>{getWaitTime(session)}</span>
									</div>
								</button>
							);
						})}
					</div>
				</aside>

				{/* Main Chat Panel */}
				<main className="flex-1 bg-slate-50 dark:bg-zinc-950 flex flex-col overflow-hidden">
					{activeSession ? (
						<div className="flex-1 flex flex-col overflow-hidden">
							<div className="bg-white dark:bg-zinc-900 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
								<div>
									<h2 className="text-sm font-black text-slate-800 dark:text-zinc-100">{activeSession.userName || activeSession.id}</h2>
									<p className="text-[9.5px] text-slate-500 mt-1">
										{activeSession.assignedAgent || 'Unassigned'} • {activeSession.status} • {getWaitTime(activeSession)} wait
									</p>
								</div>
								<button
									onClick={handleMarkResolved}
									className="bg-[#003859] hover:bg-[#002b45] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
								>
									<CheckCircleIcon className="w-3.5 h-3.5" /> Mark Resolved
								</button>
							</div>

							<div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-zinc-950/80">
								{activeSession.messages?.length ? activeSession.messages.map((msg: ChatMessage) => {
									if (msg.sender === 'system') {
										return (
											<div key={msg.id} className="flex flex-col items-center my-3 mx-auto max-w-[80%]">
												<div className="bg-[#fff3cd] text-[#856404] px-4 py-2.5 border border-[#ffeeba] rounded-2xl text-[10px] text-center leading-relaxed shadow-sm font-medium">
													{msg.text}
													<div className="text-[8px] text-[#856404]/70 mt-0.5">{formatTime(msg.timestamp)}</div>
												</div>
											</div>
										);
									}
									const isAgent = msg.sender === 'agent';
									return (
										<div key={msg.id} className={`flex items-end gap-2.5 ${isAgent ? 'justify-end' : 'justify-start'}`}>
											{!isAgent && (
												<div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
													{activeSession.userName ? activeSession.userName.charAt(0).toUpperCase() : 'S'}
												</div>
											)}
											<div className="flex flex-col max-w-[70%]">
												<div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
													isAgent ? 'bg-[#003859] text-white rounded-br-none' : 'bg-white dark:bg-zinc-900 text-slate-800 border border-slate-100 rounded-bl-none'
												}`}>
													{msg.text}
												</div>
												<span className={`text-[8.5px] text-slate-400 mt-1 px-1 ${isAgent ? 'text-right' : 'text-left'}`}>
													{isAgent ? 'You (Expert)' : msg.senderName} • {formatTime(msg.timestamp)}
												</span>
											</div>
											{isAgent && (
												<div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">EX</div>
											)}
										</div>
									);
								}) : (
									<div className="text-center text-xs text-slate-400 py-12">No messages in this session yet.</div>
								)}
								<div ref={messagesEndRef} />
							</div>

							{activeSession.status !== 'resolved' ? (
								<form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 bg-white dark:bg-zinc-900 flex items-center gap-3 shrink-0">
									<input
										type="text"
										value={replyText}
										onChange={(e) => setReplyText(e.target.value)}
										placeholder="Reply to student..."
										className="flex-1 bg-slate-50 border border-slate-100 rounded-full px-5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#003859]"
									/>
									<button
										type="submit"
										disabled={sending || !replyText.trim()}
										className="w-10 h-10 rounded-full bg-[#003859] text-white flex items-center justify-center hover:bg-[#002b45] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shrink-0"
									>
										{sending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
									</button>
								</form>
							) : (
								<div className="p-4 bg-slate-100 dark:bg-zinc-900 border-t text-center text-xs text-slate-400 select-none shrink-0 font-medium">
									This chat session is marked resolved and closed.
								</div>
							)}
						</div>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
							<div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center border border-slate-200/50">
								<UsersIcon className="w-6 h-6 text-slate-400" />
							</div>
							<div>
								<h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Select a Student Conversation</h3>
								<p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">Choose a session from the sidebar to start responding.</p>
							</div>
						</div>
					)}
				</main>
			</div>
		</div>
	);
}
