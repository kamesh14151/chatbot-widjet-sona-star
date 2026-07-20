"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Legacy redirect — admin panel moved to /admin/dashboard
export default function LegacyAdminRedirect() {
	const router = useRouter();
	useEffect(() => {
		router.replace('/admin/dashboard');
	}, [router]);

	return (
		<div className="min-h-screen bg-[#edf3f6] flex items-center justify-center">
			<div className="w-5 h-5 border-2 border-[#003859] border-t-transparent rounded-full animate-spin" />
		</div>
	);
}
