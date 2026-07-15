import { AssistantModalPrimitive } from "@assistant-ui/react";
import { XIcon, RefreshCwIcon, BellIcon, LogOutIcon, SparklesIcon, HeadphonesIcon } from "lucide-react";
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
					{/* Triangle pointer pointing down */}
					<div className="absolute -bottom-1.5 right-[23px] w-2.5 h-2.5 bg-white dark:bg-zinc-950 border-r border-b border-zinc-200 dark:border-zinc-800 rotate-45" />
				</div>
			)}
			<div
				data-state={state}
				className="absolute inset-0 m-auto size-10 rounded-full bg-white flex items-center justify-center transition-all duration-200 data-[state=open]:scale-0 data-[state=open]:rotate-90"
			>
				{/* Robot AI Icon (shown when chat is closed) */}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="size-7" fill="none" aria-label="AI Chatbot">
					{/* Head */}
					<rect x="12" y="18" width="40" height="30" rx="6" fill="#a82229" />
					{/* Antenna base */}
					<rect x="30" y="10" width="4" height="8" rx="2" fill="#a82229" />
					{/* Antenna ball */}
					<circle cx="32" cy="9" r="3.5" fill="#ffffff" stroke="#a82229" strokeWidth="1.5" />
					{/* Eyes */}
					<circle cx="23" cy="30" r="5" fill="white" />
					<circle cx="41" cy="30" r="5" fill="white" />
					<circle cx="24" cy="31" r="2.5" fill="#a82229" />
					<circle cx="42" cy="31" r="2.5" fill="#a82229" />
					{/* Mouth */}
					<rect x="21" y="39" width="22" height="3" rx="1.5" fill="white" opacity="0.6" />
					{/* Ear bolts */}
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
		sessionId,
		messages
	} = useLiveChatStore();

	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [loading, setLoading] = useState(false);
	const [alertText, setAlertText] = useState("");

	// Load session details from storage on mount
	useEffect(() => {
		loadSessionFromStorage();
	}, [loadSessionFromStorage]);

	// Sync local form state if store has name
	useEffect(() => {
		if (studentName) {
			setName(studentName);
		}
	}, [studentName]);

	const handleClose = () => {
		const closeBtn = document.querySelector('button[aria-label="Close chat assistant"]') as HTMLButtonElement | null;
		if (closeBtn) {
			closeBtn.click();
		}
	};

	const handleClear = () => {
		if (confirm("Are you sure you want to clear this conversation?")) {
			sessionStorage.clear();
			document.cookie = "scale_uwa_user_name=; path=/; max-age=0";
			window.location.reload();
		}
	};

	const handleAlerts = () => {
		setAlertText("Notifications: No new alerts.");
		setTimeout(() => setAlertText(""), 3000);
	};

	const handleLogout = () => {
		if (confirm("Are you sure you want to sign out and clear your live chat session?")) {
			sessionStorage.removeItem("live_chat_session_id");
			sessionStorage.removeItem("live_chat_mode");
			sessionStorage.removeItem("scale_uwa_lead_submitted");
			setMode("ai");
			window.location.reload();
		}
	};

	const handleLiveAgentClick = () => {
		const savedName = sessionStorage.getItem("scale_uwa_user_name") || studentName || "Guest Student";
		const savedEmail = sessionStorage.getItem("scale_uwa_user_email") || "guest@sonascaler.uwa";
		const savedPhone = sessionStorage.getItem("scale_uwa_user_phone") || "0000000000";

		initSession(savedName, savedEmail, savedPhone);
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
				className="h-[550px] w-[400px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-popover shadow-2xl duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-4"
			>
				<div className="flex h-full flex-col">
					<div className="bg-[#fffdf4] dark:bg-[#151515] border-t-4 border-[#a82229] px-4 py-3.5 shadow-sm shrink-0 flex flex-col gap-2.5">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<div className="flex size-8 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-slate-200/50">
									{/* Robot AI Icon */}
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
										SONA SCALER UWA
									</h2>
									<p className="mt-1 text-[9px] text-slate-500 dark:text-zinc-400 truncate">
										Admissions, cutoffs, scholarships, courses
									</p>
								</div>
							</div>

							{/* Header Buttons: Clear, Alerts, Logout, X */}
							<div className="flex items-center gap-1">
								<button
									onClick={handleClear}
									className="px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
									title="Clear Chat"
								>
									Clear
								</button>
								<button
									onClick={handleAlerts}
									className="px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
									title="Notifications"
								>
									Alerts
								</button>
								<button
									onClick={handleLogout}
									className="px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
									title="Logout"
								>
									Logout
								</button>
								<button
									onClick={handleClose}
									className="p-1 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
									title="Close Modal"
								>
									<XIcon className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>

						{/* Notification banner */}
						{alertText && (
							<div className="text-[9px] text-[#003859] bg-[#e6f4ea] dark:bg-emerald-950/20 px-2 py-1 rounded text-center border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in slide-in-from-top-1">
								{alertText}
							</div>
						)}

						{/* Secondary Bar: Connection Badge, Student details, Live Agent Button */}
						<div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-900 pt-2 shrink-0">
							{/* Connection Badge */}
							<div className="flex items-center gap-1.5">
								<span className="relative flex h-2 w-2">
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
								<span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
									{isConnected ? "Connected" : "Reconnecting"}
								</span>

								{/* Student Info Pill */}
								{studentName && (
									<span className="ml-1 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
										{studentName.length > 12 ? `${studentName.substr(0, 10)}...` : studentName}
									</span>
								)}
							</div>

							{/* Live Agent Button Pill */}
							<div className="flex flex-col items-end">
								<button
									onClick={handleLiveAgentClick}
									className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 ${
										mode === "live"
											? "bg-[#a82229] text-white"
											: "bg-[#003859] hover:bg-[#002b45] text-white"
									}`}
								>
									<HeadphonesIcon className="w-3 h-3" />
									Live Expert
								</button>
								<span className="text-[7.5px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-none">
									Experts available 9AM-5PM IST
								</span>
							</div>
						</div>
					</div>

					{/* Main Thread Area (Conditional) */}
					<div className="min-h-0 flex-1">
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

