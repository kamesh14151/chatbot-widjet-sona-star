import { AssistantModalPrimitive } from "@assistant-ui/react";
import { XIcon, BellIcon, HeadphonesIcon, RotateCcwIcon, Trash2Icon, RefreshCwIcon, LogOutIcon } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";
import { Thread } from "@/components/assistant-ui/thread";
import { useLiveChatStore } from "@/lib/live-chat-store";
import { LiveAgentChat } from "@/components/assistant-ui/live-agent-chat";

const ModalButton = forwardRef<
	HTMLButtonElement,
	React.ComponentPropsWithoutRef<"button"> & { "data-state"?: string }
>(({ "data-state": state, ...props }, ref) => {
	useEffect(() => {
		if (typeof window !== "undefined" && window.parent !== window) {
			window.parent.postMessage(
				{ type: "CHATBOT_STATE_CHANGE", isOpen: state === "open" },
				"*"
			);
		}
	}, [state]);

	return (
		<button
			ref={ref}
			type="button"
			aria-label={state === "open" ? "Close chat assistant" : "Open chat assistant"}
			className="relative size-full rounded-full bg-[#003859] hover:bg-[#002b45] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center border-2 border-white/10"
			{...props}
		>
			{state !== "open" && (
				<div className="absolute bottom-[68px] right-0 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 px-4 py-2 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 animate-pulse select-none pointer-events-none">
					<span className="relative flex h-2 w-2">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
						<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
					</span>
					Chat with me
					<div className="absolute -bottom-1.5 right-[23px] w-2.5 h-2.5 bg-white dark:bg-zinc-950 border-r border-b border-zinc-200 dark:border-zinc-800 rotate-45" />
				</div>
			)}
			<div
				data-state={state}
				className="absolute inset-0 m-auto size-10 rounded-full bg-white flex items-center justify-center transition-all duration-200 data-[state=open]:scale-0 data-[state=open]:rotate-90"
			>
				{/* Robot AI Icon */}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="size-7" fill="none" aria-label="AI Chatbot">
					<rect x="12" y="18" width="40" height="30" rx="6" fill="#a82229" />
					<rect x="30" y="10" width="4" height="8" rx="2" fill="#a82229" />
					<circle cx="32" cy="9" r="3.5" fill="#ffffff" stroke="#a82229" strokeWidth="1.5" />
					<circle cx="23" cy="30" r="5" fill="white" />
					<circle cx="41" cy="30" r="5" fill="white" />
					<circle cx="24" cy="31" r="2.5" fill="#a82229" />
					<circle cx="42" cy="31" r="2.5" fill="#a82229" />
					<rect x="21" y="39" width="22" height="3" rx="1.5" fill="white" opacity="0.6" />
					<rect x="8" y="26" width="4" height="8" rx="2" fill="#a82229" />
					<rect x="52" y="26" width="4" height="8" rx="2" fill="#a82229" />
				</svg>
			</div>
			<XIcon
				data-state={state}
				className="absolute inset-0 m-auto size-6 transition-all duration-200 data-[state=closed]:scale-0 data-[state=closed]:-rotate-90"
			/>
		</button>
	);
});

ModalButton.displayName = "ModalButton";

export const AssistantModal = () => {
	const {
		mode,
		setMode,
		isConnected,
		studentName,
		initSession,
		loadSessionFromStorage,
		resumeSession,
		discardSession,
		hasExistingSession,
		sessionId,
		messages
	} = useLiveChatStore();

	const [loading, setLoading] = useState(false);
	const [alertText, setAlertText] = useState("");
	const [errorText, setErrorText] = useState("");

	// Load session details from storage on mount
	useEffect(() => {
		loadSessionFromStorage();
	}, [loadSessionFromStorage]);

	const handleClose = () => {
		const closeBtn = document.querySelector('button[aria-label="Close chat assistant"]') as HTMLButtonElement | null;
		if (closeBtn) closeBtn.click();
	};

	const handleClear = () => {
		if (confirm("Are you sure you want to clear this conversation?")) {
			sessionStorage.clear();
			['live_chat_session_id','live_chat_mode','scale_uwa_lead_submitted','live_chat_session_ts']
				.forEach(k => localStorage.removeItem(k));
			document.cookie = "scale_uwa_user_name=; path=/; max-age=0";
			window.location.reload();
		}
	};

	const handleAlerts = () => {
		setAlertText("No new alerts at this time.");
		setTimeout(() => setAlertText(""), 3000);
	};

	const handleLogout = () => {
		if (confirm("Sign out and clear your live chat session?")) {
			['live_chat_session_id','live_chat_mode','scale_uwa_lead_submitted','live_chat_session_ts']
				.forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
			setMode("ai");
			window.location.reload();
		}
	};

	const handleLiveExpertClick = async () => {
		const savedName  = localStorage.getItem("scale_uwa_user_name")  || sessionStorage.getItem("scale_uwa_user_name")  || studentName || "Guest Student";
		const savedEmail = localStorage.getItem("scale_uwa_user_email") || sessionStorage.getItem("scale_uwa_user_email") || "guest@sonascale.uwa";
		const savedPhone = localStorage.getItem("scale_uwa_user_phone") || sessionStorage.getItem("scale_uwa_user_phone") || "0000000000";
		try {
			setLoading(true);
			await initSession(savedName, savedEmail, savedPhone);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : "Could not connect. Please try again.";
			setErrorText(msg);
			setTimeout(() => setErrorText(""), 6000);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AssistantModalPrimitive.Root>
			<AssistantModalPrimitive.Anchor className="fixed right-4 bottom-8 z-50 size-14 bg-transparent shadow-none border-none">
				<AssistantModalPrimitive.Trigger asChild>
					<ModalButton />
				</AssistantModalPrimitive.Trigger>
			</AssistantModalPrimitive.Anchor>

			<AssistantModalPrimitive.Content
				dissmissOnInteractOutside
				sideOffset={16}
				className="h-[580px] w-[400px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-4"
			>
				<div className="flex h-full flex-col overflow-hidden">

					{/* ── HEADER ─────────────────────────────────────── */}
					<div className="bg-[#fffdf4] dark:bg-[#151515] border-t-4 border-[#a82229] px-3 pt-3 pb-2 shadow-sm shrink-0">

						{/* Row 1: Logo + title + icon actions */}
						<div className="flex items-center justify-between gap-2">
							{/* Left: avatar + name */}
							<div className="flex items-center gap-2 min-w-0">
								<div className="flex size-8 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-slate-200/50">
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="size-5" fill="none" aria-label="AI Chatbot">
										<rect x="12" y="18" width="40" height="30" rx="6" fill="#a82229" />
										<rect x="30" y="10" width="4" height="8" rx="2" fill="#a82229" />
										<circle cx="32" cy="9" r="3.5" fill="#ffffff" stroke="#a82229" strokeWidth="1.5" />
										<circle cx="23" cy="30" r="5" fill="white" />
										<circle cx="41" cy="30" r="5" fill="white" />
										<circle cx="24" cy="31" r="2.5" fill="#a82229" />
										<circle cx="42" cy="31" r="2.5" fill="#a82229" />
										<rect x="21" y="39" width="22" height="3" rx="1.5" fill="white" opacity="0.6" />
										<rect x="8" y="26" width="4" height="8" rx="2" fill="#a82229" />
										<rect x="52" y="26" width="4" height="8" rx="2" fill="#a82229" />
									</svg>
								</div>
								<div className="min-w-0">
									<h2 className="text-xs font-bold leading-none text-slate-800 dark:text-zinc-100 tracking-wide uppercase truncate">
										SONA SCALE UWA
									</h2>
									<p className="mt-0.5 text-[9px] text-slate-500 dark:text-zinc-400 truncate">
										Admissions · Cutoffs · Scholarships · Courses
									</p>
								</div>
							</div>

							{/* Right: icon-only action buttons — always fit */}
							<div className="flex items-center gap-1 shrink-0">
								<button
									onClick={handleClear}
									className="p-1.5 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
									title="Clear Chat"
								>
									<RefreshCwIcon className="w-3.5 h-3.5" />
								</button>
								<button
									onClick={handleAlerts}
									className="p-1.5 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
									title="Notifications"
								>
									<BellIcon className="w-3.5 h-3.5" />
								</button>
								<button
									onClick={handleLogout}
									className="p-1.5 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
									title="Sign Out"
								>
									<LogOutIcon className="w-3.5 h-3.5" />
								</button>
								<button
									onClick={handleClose}
									className="p-1.5 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer"
									title="Close"
								>
									<XIcon className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>

						{/* Notification / alert banners */}
						{alertText && (
							<div className="mt-2 text-[9px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in slide-in-from-top-1">
								🔔 {alertText}
							</div>
						)}
						{errorText && (
							<div className="mt-2 text-[9px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800/40 animate-in fade-in slide-in-from-top-1 leading-relaxed">
								⚠️ {errorText}
							</div>
						)}

						{/* Session Resume Banner */}
						{hasExistingSession && (
							<div className="mt-2 flex items-center justify-between gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2 animate-in fade-in slide-in-from-top-1">
								<div className="min-w-0">
									<p className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Previous Session Found</p>
									<p className="text-[9px] text-amber-700 dark:text-amber-400 mt-0.5">
										Resume your live chat with the expert?
									</p>
								</div>
								<div className="flex items-center gap-1.5 shrink-0">
									<button
										onClick={() => resumeSession()}
										className="flex items-center gap-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold rounded-lg transition-all cursor-pointer"
										title="Resume previous session"
									>
										<RotateCcwIcon className="w-2.5 h-2.5" />
										Resume
									</button>
									<button
										onClick={() => discardSession()}
										className="flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
										title="Discard and start fresh"
									>
										<Trash2Icon className="w-2.5 h-2.5" />
										Discard
									</button>
								</div>
							</div>
						)}

						{/* Row 2: Connection status + student pill + Live Expert button */}
						<div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
							{/* Connection + name */}
							<div className="flex items-center gap-1.5 min-w-0">
								<span className="relative flex h-2 w-2 shrink-0">
									{isConnected ? (
										<>
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
											<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
										</>
									) : (
										<>
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
											<span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
										</>
									)}
								</span>
								<span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0">
									{isConnected ? "Connected" : "Reconnecting"}
								</span>
								{studentName && (
									<span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wide truncate max-w-[80px]">
										{studentName.length > 12 ? `${studentName.substring(0, 10)}…` : studentName}
									</span>
								)}
							</div>

							{/* Live Expert button */}
							<div className="flex flex-col items-end shrink-0">
								<button
									onClick={handleLiveExpertClick}
									disabled={loading}
									className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-60 ${
										mode === "live"
											? "bg-[#a82229] text-white"
											: "bg-[#003859] hover:bg-[#002b45] text-white"
									}`}
								>
									<HeadphonesIcon className="w-3 h-3" />
									{mode === "live" ? "Expert Mode" : "Live Expert"}
								</button>
								<span className="text-[7.5px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-none">
									Available 9AM–5PM IST
								</span>
							</div>
						</div>
					</div>
					{/* ── END HEADER ─────────────────────────────────── */}

					{/* Main Thread Area */}
					<div className="min-h-0 flex-1 overflow-hidden">
						{mode === "live" ? (
							<LiveAgentChat />
						) : (
							<Thread />
						)}
					</div>

				</div>
			</AssistantModalPrimitive.Content>
		</AssistantModalPrimitive.Root>
	);
};
