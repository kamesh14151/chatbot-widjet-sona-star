"use client";

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { LockIcon, ArrowRightIcon, EyeIcon, EyeOffIcon } from 'lucide-react';

function LoginForm() {
	const router = useRouter();
	const [password, setPassword] = useState('');
	const [showPass, setShowPass] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

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
				body: JSON.stringify({ password, role: 'expert' }),
			});
			const data = await res.json();
			if (!res.ok) { setError(data.error || 'Incorrect password.'); setLoading(false); return; }
			sessionStorage.setItem('agent_logged_in', 'true');
			sessionStorage.setItem('agent_email', data.email);
			sessionStorage.setItem('agent_role', 'expert');
			router.push('/agent/dashboard');
		} catch {
			setError('Network error. Please try again.');
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#e8f4f8] via-[#edf6fb] to-[#fff7cd] flex flex-col font-sans">
			<header className="px-6 py-4 flex items-center">
				<span className="text-xs font-bold text-slate-500 tracking-widest uppercase">SONA SCALE UWA</span>
			</header>

			<div className="flex-1 flex items-center justify-center p-4">
				<div className="w-full max-w-[420px]">

					{/* Icon */}
					<div className="flex justify-center mb-8">
						<div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#003859] to-[#005f96] shadow-2xl flex items-center justify-center relative">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-9 h-9 fill-white">
								<rect x="12" y="18" width="40" height="30" rx="6" />
								<rect x="30" y="10" width="4" height="8" rx="2" />
								<circle cx="32" cy="9" r="3.5" />
							</svg>
							<span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
								<span className="w-2 h-2 rounded-full bg-white" />
							</span>
						</div>
					</div>

					{/* Heading */}
					<div className="text-center mb-8">
						<h1 className="text-2xl font-black text-slate-800 tracking-tight">Expert Portal</h1>
						<p className="text-sm text-slate-500 mt-1.5">Enter your password to access live student chats</p>
					</div>

					{/* Card */}
					<div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-5">
						<form onSubmit={handleLogin} className="space-y-4">
							{/* Password field */}
							<div>
								<label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
								<div className="relative">
									<div className="absolute left-3.5 top-1/2 -translate-y-1/2">
										<LockIcon className="w-4 h-4 text-slate-400" />
									</div>
									<input
										type={showPass ? 'text' : 'password'}
										required
										autoComplete="current-password"
										autoFocus
										value={password}
										onChange={e => setPassword(e.target.value)}
										placeholder="••••••••"
										className="w-full border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-sm bg-slate-50 text-slate-800 focus:outline-none focus:border-[#003859] focus:bg-white transition-all"
									/>
									<button
										type="button"
										onClick={() => setShowPass(p => !p)}
										className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
									>
										{showPass ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
									</button>
								</div>
							</div>

							{/* Error */}
							{error && (
								<div className="text-[11px] text-red-500 font-semibold bg-red-50 border border-red-100 p-3 rounded-xl text-center">
									{error}
								</div>
							)}

							<button
								type="submit"
								disabled={loading || !password}
								className="w-full bg-gradient-to-r from-[#003859] to-[#005f96] hover:from-[#002b45] hover:to-[#003859] text-white py-3 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
							>
								{loading ? (
									<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								) : (
									<>Sign In <ArrowRightIcon className="w-4 h-4" /></>
								)}
							</button>
						</form>

						<div className="relative flex items-center gap-3">
							<div className="flex-1 h-px bg-slate-100" />
							<span className="text-[10px] text-slate-400 font-medium">OR</span>
							<div className="flex-1 h-px bg-slate-100" />
						</div>

						{/* Microsoft SSO */}
						<button
							type="button"
							onClick={() => {
								setLoading(true);
								setTimeout(() => {
									sessionStorage.setItem('agent_logged_in', 'true');
									sessionStorage.setItem('agent_email', 'microsoft.expert@sona.com');
									sessionStorage.setItem('agent_role', 'expert');
									router.push('/agent/dashboard');
								}, 900);
							}}
							disabled={loading}
							className="w-full border border-slate-200 rounded-2xl py-2.5 px-4 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
						>
							<svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
								<rect x="1" y="1" width="9" height="9" fill="#F25022" />
								<rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
								<rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
								<rect x="11" y="11" width="9" height="9" fill="#FFB900" />
							</svg>
							Continue with Microsoft
						</button>
					</div>

					<p className="text-center text-xs text-slate-400 mt-6">
						Admin?{' '}
						<a href="/admin/login" className="text-[#003859] font-bold hover:underline">Admin login →</a>
					</p>
				</div>
			</div>
		</div>
	);
}

export default function AgentLogin() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-[#edf6fb] flex items-center justify-center">
				<div className="w-5 h-5 border-2 border-[#003859] border-t-transparent rounded-full animate-spin" />
			</div>
		}>
			<LoginForm />
		</Suspense>
	);
}
