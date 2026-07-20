"use client";

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from 'lucide-react';

function LoginForm() {
	const router = useRouter();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	// Check if already logged in
	React.useEffect(() => {
		const isLoggedIn = sessionStorage.getItem('agent_logged_in') === 'true';
		const role = sessionStorage.getItem('agent_role');
		if (isLoggedIn && role === 'expert') router.replace('/agent/dashboard');
		if (isLoggedIn && role === 'admin') router.replace('/admin/dashboard');
	}, [router]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password, role: 'expert' }),
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.error || 'Invalid expert credentials.');
				setLoading(false);
				return;
			}

			sessionStorage.setItem('agent_logged_in', 'true');
			sessionStorage.setItem('agent_email', data.email);
			sessionStorage.setItem('agent_role', 'expert');
			router.push('/agent/dashboard');
		} catch {
			setError('Network error. Please try again.');
			setLoading(false);
		}
	};

	const handleMicrosoftLogin = () => {
		setLoading(true);
		setTimeout(() => {
			sessionStorage.setItem('agent_logged_in', 'true');
			sessionStorage.setItem('agent_email', 'microsoft.expert@sona.com');
			sessionStorage.setItem('agent_role', 'expert');
			router.push('/agent/dashboard');
		}, 1000);
	};

	return (
		<div className="min-h-screen bg-[#fff7cd] dark:bg-zinc-950 flex flex-col font-sans">
			<header className="bg-[#fff7cd] dark:bg-zinc-900 px-6 py-4 shrink-0 flex items-center shadow-sm">
				<h1 className="text-sm font-bold text-slate-800 dark:text-zinc-100 tracking-wide uppercase">SONA SCALE UWA</h1>
			</header>

			<div className="flex-1 flex items-center justify-center p-4">
				<div className="w-full max-w-[850px] bg-white dark:bg-zinc-900 rounded-[28px] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-100 dark:border-zinc-800 min-h-[480px]">

					{/* Left Branding */}
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
							<h2 className="text-xl font-bold tracking-wide">Expert Portal</h2>
							<p className="text-xs text-white/70 leading-relaxed font-light">
								Sign in to access live student conversations and provide real-time support.
							</p>
						</div>
					</div>

					{/* Right Form */}
					<form onSubmit={handleLogin} className="flex-1 p-8 flex flex-col justify-center space-y-5">
						<div className="space-y-1">
							<span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">EXPERT ACCESS</span>
							<h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight">Expert Sign In</h2>
						</div>

						{/* Microsoft SSO */}
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

						<div className="relative flex items-center justify-center my-1.5">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-slate-100 dark:border-zinc-800" />
							</div>
							<span className="relative px-3 bg-white dark:bg-zinc-900 text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
								or continue with username
							</span>
						</div>

						{error && (
							<div className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-2.5 rounded-xl text-center">
								{error}
							</div>
						)}

						<div className="space-y-3">
							<input
								type="text"
								required
								autoComplete="username"
								value={username}
								onChange={e => setUsername(e.target.value)}
								placeholder="Expert username"
								className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs bg-slate-50 dark:bg-zinc-900/50 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#003859] transition-all"
							/>
							<input
								type="password"
								required
								autoComplete="current-password"
								value={password}
								onChange={e => setPassword(e.target.value)}
								placeholder="Password"
								className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs bg-slate-50 dark:bg-zinc-900/50 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[#003859] transition-all"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-[#005f96] hover:bg-[#003859] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
						>
							{loading ? (
								<><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Authenticating...</>
							) : (
								<>Login as Expert <ArrowRightIcon className="w-3.5 h-3.5" /></>
							)}
						</button>

						<p className="text-center text-[10px] text-slate-400 pt-1">
							Are you an admin?{' '}
							<a href="/admin/login" className="text-[#003859] font-bold hover:underline cursor-pointer">Admin login →</a>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}

export default function AgentLogin() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-[#fff7cd] flex items-center justify-center">
				<div className="w-5 h-5 border-2 border-[#003859] border-t-transparent rounded-full animate-spin" />
			</div>
		}>
			<LoginForm />
		</Suspense>
	);
}
