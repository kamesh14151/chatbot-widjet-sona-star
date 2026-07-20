"use client";

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon, ShieldIcon } from 'lucide-react';

function AdminLoginForm() {
	const router = useRouter();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password, role: 'admin' }),
			});
			const data = await res.json();

			if (!res.ok) {
				setError(data.error || 'Invalid admin credentials.');
				setLoading(false);
				return;
			}

			sessionStorage.setItem('agent_logged_in', 'true');
			sessionStorage.setItem('agent_email', data.email);
			sessionStorage.setItem('agent_role', 'admin');

			router.push('/admin/dashboard');
		} catch {
			setError('Network error. Please try again.');
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#fff7cd] dark:bg-zinc-950 flex flex-col font-sans">
			<header className="bg-[#fff7cd] dark:bg-zinc-900 px-6 py-4 flex items-center shadow-sm">
				<h1 className="text-sm font-bold text-slate-800 dark:text-zinc-100 tracking-wide uppercase">SONA SCALE UWA</h1>
			</header>

			<div className="flex-1 flex items-center justify-center p-4">
				<div className="w-full max-w-[850px] bg-white dark:bg-zinc-900 rounded-[28px] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-100 dark:border-zinc-800 min-h-[420px]">

					{/* Left Branding */}
					<div className="md:w-[45%] bg-gradient-to-br from-[#1a0033] via-[#2d0057] to-[#003859] p-8 flex flex-col justify-between text-white relative">
						<div className="flex items-center gap-2">
							<div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
								<ShieldIcon className="w-4 h-4 text-white" />
							</div>
							<span className="text-sm font-bold tracking-wide">Admin Portal</span>
						</div>

						<div className="my-8 flex items-center justify-center">
							<div className="w-44 h-44 bg-white/5 border border-white/10 rounded-3xl relative flex items-center justify-center overflow-hidden backdrop-blur-sm">
								<div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
									<ShieldIcon className="w-8 h-8 text-white/80" />
								</div>
								<div className="absolute top-4 right-4 w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
									<div className="w-4 h-4 rounded-full bg-violet-400 animate-ping absolute" />
									<div className="w-4 h-4 rounded-full bg-violet-400" />
								</div>
								<div className="absolute -bottom-8 -left-8 w-24 h-24 bg-violet-500/10 rounded-full blur-xl" />
							</div>
						</div>

						<div className="space-y-2">
							<h2 className="text-xl font-bold tracking-wide">Admin Access</h2>
							<p className="text-xs text-white/70 leading-relaxed font-light">
								Full administrative access: manage sessions, configure email, and view all system stats.
							</p>
						</div>
					</div>

					{/* Right Form */}
					<form onSubmit={handleLogin} className="flex-1 p-8 flex flex-col justify-center space-y-5">
						<div className="space-y-1">
							<span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">ADMIN ACCESS</span>
							<h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight">Administrator Sign In</h2>
						</div>

						{/* Error */}
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
								placeholder="Admin username"
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
							className="w-full bg-gradient-to-r from-[#2d0057] to-[#003859] hover:from-[#1a0033] hover:to-[#002b45] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
						>
							{loading ? (
								<><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Authenticating...</>
							) : (
								<>Login as Admin <ArrowRightIcon className="w-3.5 h-3.5" /></>
							)}
						</button>

						<p className="text-center text-[10px] text-slate-400">
							Not an admin?{' '}
							<a href="/agent/login" className="text-[#003859] font-bold hover:underline cursor-pointer">Expert login →</a>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}

export default function AdminLogin() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-[#fff7cd] flex items-center justify-center">
				<div className="w-5 h-5 border-2 border-[#003859] border-t-transparent rounded-full animate-spin" />
			</div>
		}>
			<AdminLoginForm />
		</Suspense>
	);
}
