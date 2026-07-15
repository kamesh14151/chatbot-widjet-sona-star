"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentPage() {
	const router = useRouter();

	useEffect(() => {
		const isLoggedIn = sessionStorage.getItem('agent_logged_in') === 'true';
		if (isLoggedIn) {
			router.replace('/agent/dashboard');
		} else {
			router.replace('/agent/login');
		}
	}, [router]);

	return (
		<div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
			<span className="w-6 h-6 border-2 border-[#003859] border-t-transparent rounded-full animate-spin" />
		</div>
	);
}
