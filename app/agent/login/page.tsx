"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRightIcon } from 'lucide-react';

type Role = 'expert' | 'admin';

export default function AgentLogin() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Pre-select role from ?role= query param (e.g. /agent/login?role=admin)
	const rawRole = searchParams.get('role');
	const defaultRole: Role = rawRole === 'admin' ? 'admin' : 'expert';

	const [activeTab, setActiveTab] = useState<Role>(defaultRole);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleTabChange = (role: Role) => {
		setActiveTab(role);
		setUsername('');
		setPassword('');
		setError('');
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password, role: activeTab }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || 'Login failed. Please try again.');
				setLoading(false);
				return;
			}

			// Persist session info
			sessionStorage.setItem('agent_logged_in', 'true');
			sessionStorage.setItem('agent_email', data.email);
			sessionStorage.setItem('agent_role', data.role);

			// Both expert and admin go to the agent dashboard
			router.push('/agent/dashboard');
		} catch {
			setError('Network error. Please try again.');
			setLoading(false);
		}
	};

	const handleMicrosoftLogin = async () => {
		setLoading(true);
		// Simulated — replace with real Microsoft OAuth in production
		setTimeout(() => {
			sessionStorage.setItem('agent_logged_in', 'true');
			sessionStorage.setItem('agent_email', 'microsoft.agent@sona.com');
			sessionStorage.setItem('agent_role', 'agent');
			router.push('/agent/dashboard');
		}, 1000);
	};

	const tabs: Role[] = ['expert', 'admin'];
	const tabLabels: Record<Role, string> = { expert: 'Expert', admin: 'Admin' };

	return (
		<div className="min-h-screen bg-[#fff7cd] dark:bg-zinc-950 flex flex-col font-sans">
			<header className="bg-[#fff7cd] dark:bg-zinc-900 px-6 py-4 shrink-0 flex items-center shadow-sm">
				<h1 className="text-sm font-bold text-slate-800 dark:text-zinc-100 tracking-wide uppercase">
					SONA SCALE UWA
				</h1>
			</header>

			<div className="flex-1 flex items-center justify-center p-4">
				<div className="w-full max-w-[850px] bg-white dark:bg-zinc-900 rounded-[28px] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-100 dark:border-zinc-800 min-h-[480px]">

					{/* Left Branding Pane */}
					<div className="md:w-[45%] bg-gradient-to-br from-[#003859] via-[#004e7c] to-[#005f96] p-8 flex flex-col justify-between text-white relative">
						<div className="flex items-center gap-2">
							<div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-4 h-4 fill-white">
									<rect x="12" y="18" width="40" height="30" rx="6" />
									<rect x="30" y="10" width="4" height="8" rx="2" />
									<circle cx="32" cy="9" r="3.5" />
								</svg>
							</div>
							<span className="text-sm font-bold tracking-wide">Sona AI Desk</span>
						</div>

						<div className="my-8 flex items-center justify-center">
							<div className="w-44 h-44 bg-white/5 border border-white/10 rounded-3xl relative flex items-center justify-center overflow-hidden backdrop-blur-sm">
								<div className="w-24 h-24 bg-white/10 rounded-2xl rotate-12 transition-transform hover:rotate-45 duration-500 shadow-lg" />
								<div className="absolute top-4 right-4 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
									<div className="w-4 h-4 rounded-full bg-emerald-400 animate-ping absolute" />
									<div className="w-4 h-4 rounded-full bg-emerald-400" />
								</div>
								<div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />
							</div>
						</div>

						<div className="space-y-2">
							<h2 className="text-xl font-bold tracking-wide">Secure Portal Login</h2>
							<p className="text-xs text-white/70 leading-relaxed font-light">
								Use your authorized account to access live student conversations and admin controls.
							</p>
						</div>
					</div>

					{/* Right Login Form */}
					<form onSubmit={handleLogin} className="flex-1 p-8 flex flex-col justify-center space-y-5">
						<div className="space-y-1">
							<span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
								SUPPORT ACCESS
							</span>
							<h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight">
								{tabLabels[activeTab]} Sign In
							</h2>
						</div>

						{/* Role Tabs */}
						<div className="p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl flex gap-1">
							{tabs.map(role => (
								<button
									key={role}
									type="button"
									onClick={() => handleTabChange(role)}
									className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
										activeTab === role
											? 'bg-[#003859] text-white shadow-sm'
											: 'text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
									}`}
								>
									{tabLabels[role]}
								</button>
							))}
						</div>

						{/* Microsoft Sign In */}
						<button
							type="button"
							onClick={handleMicrosoftLogin}
							disabled={loading}
							className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl py-2 px-4 text-xs font-bold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
						>
							<svg className="w-4 h-4" viewBox="0 0 21 21">
								<rect x="1" y="1" width="9" height="9" fill="#F25022" />
								<rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
								<rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
								<rect x="11" y="11" width="9" height="9" fill="#FFB900" />
							</svg>
							Continue with Microsoft
						</button>

						{/* Separator */}
						<div className="relative flex items-center justify-center my-1.5">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-slate-100 dark:border-zinc-800" />
							</div>
							<span className="relative px-3 bg-white dark:bg-zinc-900 text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-semibold">
								or continue with username
							</span>
						</div>

						{/* Error */}
						{error && (
							<div className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-2.5 rounded-xl text-center">
								{error}
							</div>
						)}

						{/* Input Fields — no prefilled values */}
						<div className="space-y-3">
							<input
								type="text"
								required
								autoComplete="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder={`${tabLabels[activeTab]} username`}
								className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs bg-slate-50 dark:bg-zinc-900/50 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#003859] transition-all"
							/>
							<input
								type="password"
								required
								autoComplete="current-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Password"
								className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs bg-slate-50 dark:bg-zinc-900/50 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#003859] transition-all"
							/>
						</div>

						{/* Submit */}
						<button
							type="submit"
							disabled={loading}
							className="w-full bg-[#005f96] hover:bg-[#003859] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
						>
							{loading ? (
								<>
									<span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									Authenticating...
								</>
							) : (
								<>
									Login as {tabLabels[activeTab]}
									<ArrowRightIcon className="w-3.5 h-3.5" />
								</>
							)}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
