"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
	ArrowLeftIcon,
	DownloadIcon,
	Trash2Icon,
	RefreshCwIcon,
	UsersIcon,
	CheckCircleIcon,
	ClockIcon,
	BarChart3Icon,
	DatabaseIcon,
	ShieldIcon,
	AlertCircleIcon,
	ChevronDownIcon,
	MailIcon,
	SaveIcon,
	SendIcon,
	EyeIcon,
	EyeOffIcon,
} from 'lucide-react';
import { ChatSession } from '@/lib/live-chat-db';

interface DbStatus {
	connected: boolean;
	status: 'ready' | 'no_tables' | 'misconfigured' | 'error' | 'checking';
	message: string;
	latencyMs: number | null;
	checkedAt: string;
}

interface EmailConfig {
	provider: 'gmail' | 'smtp';
	smtpHost: string;
	smtpPort: string;
	smtpUser: string;
	smtpPass: string;
	fromName: string;
	leadEmailTo: string;
	subjectPrefix: string;
}

type FilterType = 'all' | 'waiting' | 'active' | 'resolved';
type ActiveTab = 'sessions' | 'email';

export default function AdminPanel() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<ActiveTab>('sessions');

	// ── Sessions state ──────────────────────────────────────────
	const [sessions, setSessions] = useState<ChatSession[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [filter, setFilter] = useState<FilterType>('all');
	const [deleting, setDeleting] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState(false);

	// ── Email config state ───────────────────────────────────────
	const [emailConfig, setEmailConfig] = useState<EmailConfig>({
		provider: 'gmail',
		smtpHost: 'smtp.gmail.com',
		smtpPort: '465',
		smtpUser: '',
		smtpPass: '',
		fromName: 'SCALE UWA Assistant',
		leadEmailTo: '',
		subjectPrefix: 'New User Lead',
	});
	const [emailSaving, setEmailSaving] = useState(false);
	const [emailTesting, setEmailTesting] = useState(false);
	const [showPass, setShowPass] = useState(false);

	// ── Shared state ─────────────────────────────────────────────
	const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
	const [agentRole, setAgentRole] = useState('expert');
	const [dbStatus, setDbStatus] = useState<DbStatus>({
		connected: false,
		status: 'checking',
		message: 'Checking connection…',
		latencyMs: null,
		checkedAt: '',
	});

	// Auth guard — admin only
	useEffect(() => {
		const isLoggedIn = sessionStorage.getItem('agent_logged_in') === 'true';
		if (!isLoggedIn) { router.push('/admin/login'); return; }
		const role = sessionStorage.getItem('agent_role') || 'expert';
		if (role !== 'admin') { router.push('/admin/login'); return; }
		setAgentRole(role);
	}, [router]);

	const showToast = (type: 'success' | 'error', message: string) => {
		setToast({ type, message });
		setTimeout(() => setToast(null), 3500);
	};

	const fetchDbStatus = useCallback(async () => {
		try {
			const res = await fetch('/api/db-status');
			if (!res.ok) throw new Error();
			setDbStatus(await res.json());
		} catch {
			setDbStatus(prev => ({ ...prev, connected: false, status: 'error', message: 'Could not reach status endpoint.', checkedAt: new Date().toISOString() }));
		}
	}, []);

	const fetchSessions = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/live-agent/list');
			if (!res.ok) throw new Error();
			setSessions(await res.json());
		} catch {
			showToast('error', 'Failed to load sessions from server.');
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchEmailConfig = useCallback(async () => {
		try {
			const res = await fetch('/api/admin/email-config');
			if (!res.ok) throw new Error();
			setEmailConfig(await res.json());
		} catch {
			showToast('error', 'Failed to load email config.');
		}
	}, []);

	useEffect(() => {
		fetchSessions();
		fetchDbStatus();
		fetchEmailConfig();
	}, [fetchSessions, fetchDbStatus, fetchEmailConfig]);

	// Stats
	const totalSessions = sessions.length;
	const waitingCount = sessions.filter(s => s.status === 'waiting').length;
	const activeCount = sessions.filter(s => s.status === 'active').length;
	const resolvedCount = sessions.filter(s => s.status === 'resolved').length;
	const filteredSessions = sessions.filter(s => filter === 'all' || s.status === filter);

	const toggleSelect = (id: string) => {
		setSelectedIds(prev => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id); else next.add(id);
			return next;
		});
	};
	const toggleSelectAll = () => {
		if (selectedIds.size === filteredSessions.length) setSelectedIds(new Set());
		else setSelectedIds(new Set(filteredSessions.map(s => s.id)));
	};

	const handleDelete = async () => {
		if (selectedIds.size === 0) return;
		setDeleting(true);
		try {
			const res = await fetch('/api/live-agent/delete', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionIds: Array.from(selectedIds) }),
			});
			if (!res.ok) throw new Error();
			const { deleted } = await res.json();
			showToast('success', `${deleted} session${deleted !== 1 ? 's' : ''} deleted.`);
			setSelectedIds(new Set());
			setDeleteConfirm(false);
			fetchSessions();
		} catch {
			showToast('error', 'Failed to delete sessions.');
		} finally {
			setDeleting(false);
		}
	};

	const handleSaveEmailConfig = async () => {
		setEmailSaving(true);
		try {
			const res = await fetch('/api/admin/email-config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(emailConfig),
			});
			if (!res.ok) throw new Error();
			showToast('success', 'Email settings saved successfully.');
			fetchEmailConfig(); // reload to get masked password
		} catch {
			showToast('error', 'Failed to save email settings.');
		} finally {
			setEmailSaving(false);
		}
	};

	const handleTestEmail = async () => {
		setEmailTesting(true);
		try {
			const res = await fetch('/api/send-details', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'Test Lead', email: emailConfig.smtpUser || 'test@test.com', phone: '+0000000000' }),
			});
			if (!res.ok) throw new Error();
			showToast('success', `Test email sent to ${emailConfig.leadEmailTo}`);
		} catch {
			showToast('error', 'Test email failed. Check SMTP credentials.');
		} finally {
			setEmailTesting(false);
		}
	};

	const formatDate = (ts: number) => new Date(ts).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	const statusColors: Record<string, string> = {
		waiting: 'bg-amber-100 text-amber-800 border border-amber-200/60',
		active: 'bg-emerald-100 text-emerald-800 border border-emerald-200/60',
		resolved: 'bg-slate-100 text-slate-600 border border-slate-200/60',
	};

	const inputCls = "w-full border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#003859] transition-all";
	const labelCls = "block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5";

	return (
		<div className="min-h-screen bg-[#edf3f6] dark:bg-zinc-950 font-sans text-slate-800 dark:text-zinc-100 flex flex-col">

			{/* Toast */}
			{toast && (
				<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
					{toast.type === 'success' ? <CheckCircleIcon className="w-4 h-4 shrink-0" /> : <AlertCircleIcon className="w-4 h-4 shrink-0" />}
					{toast.message}
				</div>
			)}

			{/* Delete Modal */}
			{deleteConfirm && (
				<div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 dark:border-zinc-800">
						<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
							<Trash2Icon className="w-5 h-5 text-red-600" />
						</div>
						<h3 className="text-base font-black text-center">Delete {selectedIds.size} session{selectedIds.size !== 1 ? 's' : ''}?</h3>
						<p className="text-xs text-center text-slate-500 mt-2 mb-5 leading-relaxed">This action is permanent and cannot be undone.</p>
						<div className="flex gap-2">
							<button onClick={() => setDeleteConfirm(false)} className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">Cancel</button>
							<button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1">
								{deleting ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Trash2Icon className="w-3.5 h-3.5" /> Delete</>}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Header */}
			<header className="bg-[#fff7cd] dark:bg-zinc-900 border-b border-[#ebd7a3] dark:border-zinc-800 px-6 py-4 flex items-center gap-4 shrink-0">
				<div>
					<h1 className="text-sm font-bold tracking-wide uppercase">SONA SCALE UWA — Admin Dashboard</h1>
					<p className="text-[10px] text-slate-400 mt-0.5">Session management, email settings & system stats</p>
				</div>
				<div className="ml-auto flex items-center gap-2">
					<button onClick={() => { fetchSessions(); fetchDbStatus(); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer">
						<RefreshCwIcon className="w-3 h-3" /> Refresh
					</button>
					<a href="/api/live-agent/report" download className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-[#003859] hover:bg-[#002b45] rounded-lg transition-all cursor-pointer shadow-sm">
						<DownloadIcon className="w-3 h-3" /> Export CSV
					</a>
					<button
						onClick={() => { sessionStorage.clear(); router.push('/admin/login'); }}
						className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
					>
						Logout
					</button>
				</div>
			</header>

			<div className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">

				{/* Stats Cards */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[
						{ label: 'Total Sessions', value: totalSessions, icon: BarChart3Icon, color: 'text-slate-700 dark:text-zinc-200', bg: 'bg-white dark:bg-zinc-900' },
						{ label: 'Waiting', value: waitingCount, icon: ClockIcon, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
						{ label: 'Active', value: activeCount, icon: UsersIcon, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
						{ label: 'Resolved', value: resolvedCount, icon: CheckCircleIcon, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
					].map(({ label, value, icon: Icon, color, bg }) => (
						<div key={label} className={`${bg} rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-zinc-800`}>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{label}</p>
									<p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
								</div>
								<Icon className={`w-6 h-6 ${color} opacity-60`} />
							</div>
						</div>
					))}
				</div>

				{/* DB Status */}
				<div className={`rounded-2xl p-4 shadow-sm border flex items-center justify-between gap-4 ${
					dbStatus.status === 'checking' ? 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800' :
					dbStatus.connected && dbStatus.status === 'ready' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' :
					'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50'
				}`}>
					<div className="flex items-center gap-3">
						<DatabaseIcon className={`w-5 h-5 ${dbStatus.status === 'checking' ? 'text-slate-400' : dbStatus.connected ? 'text-emerald-600' : 'text-red-500'}`} />
						<div>
							<p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Supabase Database</p>
							<p className={`text-xs font-bold mt-0.5 ${dbStatus.status === 'checking' ? 'text-slate-500' : dbStatus.connected ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
								{dbStatus.status === 'checking' && 'Checking…'}
								{dbStatus.status === 'ready' && 'Connected & Ready'}
								{dbStatus.status === 'no_tables' && 'Connected — Tables Missing'}
								{dbStatus.status === 'misconfigured' && 'Not Configured'}
								{dbStatus.status === 'error' && 'Disconnected'}
							</p>
							<p className="text-[9px] text-slate-400 mt-0.5">{dbStatus.message}</p>
						</div>
					</div>
					<div className="flex items-center gap-3 shrink-0">
						{dbStatus.latencyMs !== null && <span className="text-[10px] text-slate-400 font-mono">{dbStatus.latencyMs}ms</span>}
						<button onClick={fetchDbStatus} className="px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1">
							<RefreshCwIcon className="w-3 h-3" /> Recheck
						</button>
					</div>
				</div>

				{/* Tab Bar */}
				<div className="flex gap-1 p-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 w-fit">
					<button
						onClick={() => setActiveTab('sessions')}
						className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'sessions' ? 'bg-[#003859] text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
					>
						<UsersIcon className="w-3.5 h-3.5" /> Sessions
					</button>
					<button
						onClick={() => setActiveTab('email')}
						className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'email' ? 'bg-[#003859] text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
					>
						<MailIcon className="w-3.5 h-3.5" /> Email Settings
					</button>
				</div>

				{/* ── SESSIONS TAB ── */}
				{activeTab === 'sessions' && (
					<>
						{agentRole !== 'admin' && (
							<div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
								<ShieldIcon className="w-5 h-5 text-amber-600 shrink-0" />
								<p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
									You are logged in as <strong>expert</strong>, not admin. Deletion is restricted to admin accounts.
								</p>
							</div>
						)}

						<div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden">
							<div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-4 flex-wrap">
								<div>
									<h2 className="text-sm font-black">All Sessions</h2>
									<p className="text-[10px] text-slate-400 mt-0.5">{filteredSessions.length} sessions{selectedIds.size > 0 && ` · ${selectedIds.size} selected`}</p>
								</div>
								<div className="flex items-center gap-2">
									<div className="relative">
										<select value={filter} onChange={e => { setFilter(e.target.value as FilterType); setSelectedIds(new Set()); }} className="appearance-none text-[10px] font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl pl-3 pr-7 py-1.5 text-slate-700 dark:text-zinc-300 outline-none cursor-pointer">
											<option value="all">All Statuses</option>
											<option value="waiting">Waiting</option>
											<option value="active">Active</option>
											<option value="resolved">Resolved</option>
										</select>
										<ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
									</div>
									{agentRole === 'admin' && selectedIds.size > 0 && (
										<button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all cursor-pointer shadow-sm">
											<Trash2Icon className="w-3 h-3" /> Delete {selectedIds.size} selected
										</button>
									)}
								</div>
							</div>

							{loading ? (
								<div className="p-12 text-center">
									<div className="w-6 h-6 border-2 border-[#003859] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
									<p className="text-xs text-slate-400">Loading sessions…</p>
								</div>
							) : filteredSessions.length === 0 ? (
								<div className="p-12 text-center text-xs text-slate-400">No sessions found for the selected filter.</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-left">
										<thead className="bg-slate-50 dark:bg-zinc-850 border-b border-slate-100 dark:border-zinc-800">
											<tr>
												{agentRole === 'admin' && <th className="px-4 py-3 w-10"><input type="checkbox" checked={selectedIds.size === filteredSessions.length && filteredSessions.length > 0} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded accent-[#003859] cursor-pointer" /></th>}
												<th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Session ID</th>
												<th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Student</th>
												<th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Status</th>
												<th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Assigned Expert</th>
												<th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Messages</th>
												<th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Created At</th>
												<th className="px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Last Active</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
											{filteredSessions.map(session => (
												<tr key={session.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.has(session.id) ? 'bg-sky-50/60 dark:bg-sky-950/20' : ''}`}>
													{agentRole === 'admin' && <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(session.id)} onChange={() => toggleSelect(session.id)} className="w-3.5 h-3.5 rounded accent-[#003859] cursor-pointer" /></td>}
													<td className="px-4 py-3 text-[10px] font-mono text-slate-500">{session.id}</td>
													<td className="px-4 py-3">
														<div className="text-xs font-bold text-slate-800 dark:text-zinc-200">{session.userName}</div>
														<div className="text-[9px] text-slate-400">{session.userEmail}</div>
													</td>
													<td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${statusColors[session.status]}`}>{session.status}</span></td>
													<td className="px-4 py-3 text-[10px] text-slate-600">{session.assignedAgent || <span className="text-slate-300">—</span>}</td>
													<td className="px-4 py-3 text-[10px] font-bold text-slate-600">{session.messages?.length ?? 0}</td>
													<td className="px-4 py-3 text-[10px] text-slate-500">{formatDate(session.createdAt)}</td>
													<td className="px-4 py-3 text-[10px] text-slate-500">{formatDate(session.lastActive)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</>
				)}

				{/* ── EMAIL SETTINGS TAB ── */}
				{activeTab === 'email' && (
					<div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden">
						<div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
							<div>
								<h2 className="text-sm font-black text-slate-800 dark:text-zinc-100">Email Settings</h2>
								<p className="text-[10px] text-slate-400 mt-0.5">Configure lead notifications via Gmail or Custom SMTP server.</p>
							</div>
						</div>

						<div className="p-6 space-y-6">
							{/* Provider Choice */}
							<div>
								<label className={labelCls}>Email Service Type</label>
								<div className="flex gap-2 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl w-fit">
									<button
										type="button"
										onClick={() => setEmailConfig(p => ({ ...p, provider: 'gmail', smtpHost: 'smtp.gmail.com', smtpPort: '465' }))}
										className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
											(emailConfig.provider === 'gmail' || !emailConfig.provider)
												? 'bg-[#003859] text-white shadow-sm'
												: 'text-slate-600 dark:text-zinc-400 hover:text-slate-800'
										}`}
									>
										Gmail (App Password)
									</button>
									<button
										type="button"
										onClick={() => setEmailConfig(p => ({ ...p, provider: 'smtp' }))}
										className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
											emailConfig.provider === 'smtp'
												? 'bg-[#003859] text-white shadow-sm'
												: 'text-slate-600 dark:text-zinc-400 hover:text-slate-800'
										}`}
									>
										Custom SMTP Server
									</button>
								</div>
							</div>

							<hr className="border-slate-100 dark:border-zinc-800" />

							{/* Recipient */}
							<div>
								<h3 className="text-xs font-black text-slate-700 dark:text-zinc-200 mb-4 flex items-center gap-2">
									<span className="w-5 h-5 rounded-full bg-[#003859] text-white flex items-center justify-center text-[9px] font-black">1</span>
									Recipient Settings
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className={labelCls}>Lead Notification Email (To)</label>
										<input
											type="email"
											value={emailConfig.leadEmailTo}
											onChange={e => setEmailConfig(p => ({ ...p, leadEmailTo: e.target.value }))}
											placeholder="admin@yourdomain.com"
											className={inputCls}
										/>
										<p className="text-[9px] text-slate-400 mt-1">New lead notifications will be sent to this email address.</p>
									</div>
									<div>
										<label className={labelCls}>Email Subject Prefix</label>
										<input
											type="text"
											value={emailConfig.subjectPrefix}
											onChange={e => setEmailConfig(p => ({ ...p, subjectPrefix: e.target.value }))}
											placeholder="New User Lead"
											className={inputCls}
										/>
										<p className="text-[9px] text-slate-400 mt-1">E.g. "New User Lead" → Subject: "New User Lead: John Doe"</p>
									</div>
								</div>
							</div>

							<hr className="border-slate-100 dark:border-zinc-800" />

							{/* Sender Settings according to provider */}
							<div>
								<h3 className="text-xs font-black text-slate-700 dark:text-zinc-200 mb-4 flex items-center gap-2">
									<span className="w-5 h-5 rounded-full bg-[#003859] text-white flex items-center justify-center text-[9px] font-black">2</span>
									{emailConfig.provider === 'smtp' ? 'Custom SMTP Credentials' : 'Gmail Sender Credentials'}
								</h3>

								{emailConfig.provider === 'gmail' || !emailConfig.provider ? (
									/* Gmail Configuration */
									<div className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className={labelCls}>Gmail Address (Sender)</label>
												<input
													type="email"
													value={emailConfig.smtpUser}
													onChange={e => setEmailConfig(p => ({ ...p, smtpUser: e.target.value }))}
													placeholder="yourname@gmail.com"
													className={inputCls}
												/>
											</div>
											<div>
												<label className={labelCls}>Gmail App Password</label>
												<div className="relative">
													<input
														type={showPass ? 'text' : 'password'}
														value={emailConfig.smtpPass}
														onChange={e => setEmailConfig(p => ({ ...p, smtpPass: e.target.value }))}
														placeholder="16-character App Password"
														className={`${inputCls} pr-10 font-mono`}
													/>
													<button
														type="button"
														onClick={() => setShowPass(p => !p)}
														className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
														title={showPass ? "Hide password" : "Show password"}
													>
														{showPass ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
													</button>
												</div>
												<p className="text-[9px] text-slate-400 mt-1">
													Click the eye icon to view or verify your 16-character App Password.
												</p>
											</div>
											<div className="md:col-span-2">
												<label className={labelCls}>From Display Name</label>
												<input
													type="text"
													value={emailConfig.fromName}
													onChange={e => setEmailConfig(p => ({ ...p, fromName: e.target.value }))}
													placeholder="SCALE UWA Assistant"
													className={inputCls}
												/>
											</div>
										</div>

										{/* Gmail instructions tip */}
										<div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl">
											<h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">How to generate a Gmail App Password:</h4>
											<ol className="text-[10px] text-blue-700 dark:text-blue-300/80 list-decimal list-inside space-y-1 leading-relaxed">
												<li>Go to your <strong>Google Account</strong> settings (myaccount.google.com).</li>
												<li>Select <strong>Security</strong> and ensure <strong>2-Step Verification</strong> is enabled.</li>
												<li>Search for <strong>App Passwords</strong> and create a new key named "Chatbot".</li>
												<li>Copy the generated 16-character password and paste it into the field above.</li>
											</ol>
										</div>
									</div>
								) : (
									/* Custom SMTP Configuration */
									<div className="space-y-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label className={labelCls}>SMTP Host</label>
												<input
													type="text"
													value={emailConfig.smtpHost}
													onChange={e => setEmailConfig(p => ({ ...p, smtpHost: e.target.value }))}
													placeholder="smtp.example.com"
													className={inputCls}
												/>
											</div>
											<div>
												<label className={labelCls}>SMTP Port</label>
												<input
													type="text"
													value={emailConfig.smtpPort}
													onChange={e => setEmailConfig(p => ({ ...p, smtpPort: e.target.value }))}
													placeholder="587 or 465"
													className={inputCls}
												/>
											</div>
											<div>
												<label className={labelCls}>SMTP Username / Email</label>
												<input
													type="text"
													value={emailConfig.smtpUser}
													onChange={e => setEmailConfig(p => ({ ...p, smtpUser: e.target.value }))}
													placeholder="user@example.com"
													className={inputCls}
												/>
											</div>
											<div>
												<label className={labelCls}>SMTP Password</label>
												<div className="relative">
													<input
														type={showPass ? 'text' : 'password'}
														value={emailConfig.smtpPass}
														onChange={e => setEmailConfig(p => ({ ...p, smtpPass: e.target.value }))}
														placeholder="SMTP password"
														className={`${inputCls} pr-10`}
													/>
													<button
														type="button"
														onClick={() => setShowPass(p => !p)}
														className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
														title={showPass ? "Hide password" : "Show password"}
													>
														{showPass ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
													</button>
												</div>
											</div>
											<div className="md:col-span-2">
												<label className={labelCls}>From Display Name</label>
												<input
													type="text"
													value={emailConfig.fromName}
													onChange={e => setEmailConfig(p => ({ ...p, fromName: e.target.value }))}
													placeholder="SCALE UWA Assistant"
													className={inputCls}
												/>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex items-center gap-3 pt-2">
								<button
									onClick={handleSaveEmailConfig}
									disabled={emailSaving}
									className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#003859] hover:bg-[#002b45] rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
								>
									{emailSaving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />}
									Save Settings
								</button>
								<button
									onClick={handleTestEmail}
									disabled={emailTesting || !emailConfig.smtpUser || !emailConfig.leadEmailTo}
									className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#003859] bg-white hover:bg-slate-50 border border-slate-200 dark:border-zinc-700 rounded-xl transition-all cursor-pointer disabled:opacity-40"
								>
									{emailTesting ? <span className="w-3.5 h-3.5 border-2 border-[#003859] border-t-transparent rounded-full animate-spin" /> : <SendIcon className="w-3.5 h-3.5" />}
									Send Test Email
								</button>
								<p className="text-[9px] text-slate-400 ml-2">
									Changes are saved to the server. Env var values are used as defaults if no saved config exists.
								</p>
							</div>
						</div>
					</div>
				)}

			</div>
		</div>
	);
}
