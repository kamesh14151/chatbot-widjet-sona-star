"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRoot() {
	const router = useRouter();
	useEffect(() => {
		const isLoggedIn = sessionStorage.getItem('agent_logged_in') === 'true';
		const role = sessionStorage.getItem('agent_role');
		if (isLoggedIn && role === 'admin') {
			router.replace('/admin/dashboard');
		} else {
			router.replace('/admin/login');
		}
	}, [router]);

	return (
		<div className="min-h-screen bg-[#fff7cd] flex items-center justify-center">
			<div className="w-5 h-5 border-2 border-[#003859] border-t-transparent rounded-full animate-spin" />
		</div>
	);
}
