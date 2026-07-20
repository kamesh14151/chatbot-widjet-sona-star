"use client";

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { LockIcon, ArrowRightIcon, EyeIcon, EyeOffIcon, ShieldCheckIcon } from 'lucide-react';

function AdminLoginForm() {
	const router = useRouter();
	const [password, setPassword] = useState('');
	const [showPass, setShowPass] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	React.useEffect(() => {
		const isLoggedIn = sessionStorage.getItem('agent_logged_in') === 'true';
		const role = sessionStorage.getItem('agent_role');
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
				body: JSON.stringify({ password, role: 'admin' }),
			});
			const data = await res.json();
			if (!res.ok) { setError(data.error || 'Incorrect password.'); setLoading(false); return; }
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
		<div className="min-h-screen bg-[#0a0a0f] flex flex-col font-sans relative overflow-hidden">
			{/* Background glow effects */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
				<div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#003859]/30 blur-[120px]" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-900/10 blur-[80px]" />
			</div>

			{/* Grid overlay */}
			<div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}} />

			<header className="relative z-10 px-6 py-5 flex items-center justify-between">
				<span className="text-[10px] font-bold text-white/30 tracking-widest uppercase">SONA SCALE UWA</span>
				<a href="/agent/login" className="text-[10px] text-white/30 hover:text-white/60 transition-colors font-medium">
					Expert Portal →
				</a>
			</header>

			<div className="flex-1 flex items-center justify-center p-4 relative z-10">
				<div className="w-full max-w-[400px]">

					{/* Shield icon with animated ring */}
					<div className="flex justify-center mb-8">
						<div className="relative">
							<div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl animate-pulse" />
							<div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-[#003859] shadow-2xl flex items-center justify-center border border-white/10">
								<ShieldCheckIcon className="w-9 h-9 text-white" strokeWidth={1.5} />
							</div>
							{/* Orbit dot */}
							<div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-400 border-2 border-[#0a0a0f] shadow-lg shadow-violet-500/50" />
						</div>
					</div>

					{/* Heading */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-4">
							<div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
							<span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Restricted Access</span>
						</div>
						<h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
						<p className="text-sm text-white/40 mt-2 font-light">Enter your admin password to continue</p>
					</div>

					{/* Card */}
					<div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-7 shadow-2xl space-y-5">
						<form onSubmit={handleLogin} className="space-y-4">
							<div>
								<label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Admin Password</label>
								<div className="relative">
									<div className="absolute left-3.5 top-1/2 -translate-y-1/2">
										<LockIcon className="w-4 h-4 text-white/30" />
									</div>
									<input
										type={showPass ? 'text' : 'password'}
										required
										autoComplete="current-password"
										autoFocus
										value={password}
										onChange={e => setPassword(e.target.value)}
										placeholder="••••••••••••"
										className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-10 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
									/>
									<button
										type="button"
										onClick={() => setShowPass(p => !p)}
										className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer transition-colors"
									>
										{showPass ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
									</button>
								</div>
							</div>

							{/* Error */}
							{error && (
								<div className="text-[11px] text-red-400 font-semibold bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
									{error}
								</div>
							)}

							<button
								type="submit"
								disabled={loading || !password}
								className="w-full relative group bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-violet-900/50 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer active:scale-[0.98]"
							>
								{/* Shimmer */}
								<div className="absolute inset-0 rounded-2xl overflow-hidden">
									<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-700" />
								</div>
								{loading ? (
									<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								) : (
									<>Access Dashboard <ArrowRightIcon className="w-4 h-4" /></>
								)}
							</button>
						</form>
					</div>

					{/* Footer note */}
					<div className="mt-6 text-center">
						<p className="text-[10px] text-white/20">
							This portal is for system administrators only. Unauthorized access is prohibited.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function AdminLogin() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
				<div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
			</div>
		}>
			<AdminLoginForm />
		</Suspense>
	);
}
