import {
	ActionBarMorePrimitive,
	ActionBarPrimitive,
	AuiIf,
	BranchPickerPrimitive,
	ComposerPrimitive,
	ErrorPrimitive,
	MessagePrimitive,
	SuggestionPrimitive,
	ThreadPrimitive,
	useAuiState,
	useComposerRuntime,
	useThread,
	useThreadRuntime,
} from "@assistant-ui/react";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	CheckIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CopyIcon,
	DownloadIcon,
	MicIcon,
	MicOffIcon,
	MoreHorizontalIcon,
	PencilIcon,
	RefreshCwIcon,
	SquareIcon,
} from "lucide-react";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import {
	ComposerAddAttachment,
	ComposerAttachments,
	UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { Reasoning, ReasoningGroup } from "@/components/assistant-ui/reasoning";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LanguageSelector: FC = () => {
	const thread = useThread();
	const threadRuntime = useThreadRuntime();
	const messages = thread.messages;
	const lastMessage = messages[messages.length - 1];

	if (!lastMessage || lastMessage.role !== "assistant") return null;

	const contentText = typeof lastMessage.content === "string"
		? lastMessage.content
		: Array.isArray(lastMessage.content)
			? lastMessage.content.map((p: any) => p.text || "").join(" ")
			: "";

	// Detect if the assistant is asking for language selection
	const isLanguagePrompt =
		contentText.toLowerCase().includes("in which language") ||
		contentText.toLowerCase().includes("which language would you like");

	if (!isLanguagePrompt) return null;

	const languages = [
		{ label: "🇬🇧 English", value: "English" },
		{ label: "🇮🇳 Kannada", value: "Kannada" },
		{ label: "🇮🇳 Tamil", value: "Tamil" },
		{ label: "🇮🇳 Hindi", value: "Hindi" },
	];

	return (
		<div className="flex flex-col gap-2 px-3 py-2.5 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 animate-in fade-in slide-in-from-bottom-2 duration-200">
			<p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center select-none">
				Select your preferred language
			</p>
			<div className="flex flex-wrap gap-2 justify-center">
				{languages.map((lang) => (
					<button
						key={lang.value}
						type="button"
						onClick={() => {
							threadRuntime.append({
								role: "user",
								content: [{ type: "text", text: lang.value }],
							});
						}}
						className="px-3 py-1.5 text-xs font-semibold rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
					>
						{lang.label}
					</button>
				))}
			</div>
		</div>
	);
};

const LeadCaptureForm: FC<{ onSubmit: () => void; onSkip: () => void }> = ({ onSubmit, onSkip }) => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Allow ESC key to skip the form
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onSkip();
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [onSkip]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !email.trim() || !phone.trim()) {
			setError("All fields are required.");
			return;
		}
		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/send-details", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name, email, phone }),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Submission failed.");
			}
			sessionStorage.setItem("scale_uwa_lead_submitted", "true");
			onSubmit();
		} catch (err: any) {
			setError(err.message || "Failed to submit details.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="w-full flex flex-col gap-3 p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200"
		>
			<div className="relative text-center">
				{/* ESC / Skip button */}
				<button
					type="button"
					onClick={onSkip}
					title="Skip (ESC)"
					aria-label="Skip contact form"
					className="absolute -top-1 right-0 flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer select-none"
				>
					<svg xmlns="http://www.w3.org/2000/svg" className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
					<span className="font-semibold">ESC</span>
				</button>
				<h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
					Contact Details Required
				</h3>
				<p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
					Please share your contact details to continue the conversation.
				</p>
			</div>

			{error && (
				<p className="text-[10px] text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 p-2 rounded-lg border border-red-200 dark:border-red-900/50 text-center">
					{error}
				</p>
			)}

			<div className="flex flex-col gap-2">
				<input
					type="text"
					required
					placeholder="Full Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-primary/50 transition-all placeholder:text-zinc-400"
				/>
				<input
					type="email"
					required
					placeholder="Email Address"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-primary/50 transition-all placeholder:text-zinc-400"
				/>
				<input
					type="tel"
					required
					placeholder="Phone Number"
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-primary/50 transition-all placeholder:text-zinc-400"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="w-full bg-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
			>
				{loading ? (
					<>
						<span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
						Submitting...
					</>
				) : (
					"Submit & Continue"
				)}
			</button>
		</form>
	);
};

export const Thread: FC = () => {
	const thread = useThread();
	const messages = thread.messages;
	const [hasSubmittedDetails, setHasSubmittedDetails] = useState(false);

	useEffect(() => {
		const isSubmitted = sessionStorage.getItem("scale_uwa_lead_submitted") === "true";
		setHasSubmittedDetails(isSubmitted);
	}, []);

	useEffect(() => {
		if (messages.length === 0) {
			setHasSubmittedDetails(false);
			sessionStorage.removeItem("scale_uwa_lead_submitted");
		}
	}, [messages.length]);

	const userMessages = messages.filter((m) => m.role === "user");
	const shouldShowForm = userMessages.length >= 3 && !hasSubmittedDetails;

	return (
		<ThreadPrimitive.Root
			className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
			style={{
				["--thread-max-width" as string]: "44rem",
				["--composer-radius" as string]: "24px",
				["--composer-padding" as string]: "10px",
			}}
		>
			<ThreadPrimitive.Viewport
				turnAnchor="top"
				className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
			>
				<AuiIf condition={(s) => s.thread.isEmpty}>
					<ThreadWelcome />
				</AuiIf>

				<ThreadPrimitive.Messages>
					{() => <ThreadMessage />}
				</ThreadPrimitive.Messages>

				<ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible rounded-t-(--composer-radius) bg-background pb-4 md:pb-6">
					<ThreadScrollToBottom />
					{!shouldShowForm && <LanguageSelector />}
					{shouldShowForm ? (
						<LeadCaptureForm
							onSubmit={() => setHasSubmittedDetails(true)}
							onSkip={() => setHasSubmittedDetails(true)}
						/>
					) : (
						<Composer />
					)}
				</ThreadPrimitive.ViewportFooter>
			</ThreadPrimitive.Viewport>
		</ThreadPrimitive.Root>
	);
};

const ThreadMessage: FC = () => {
	const role = useAuiState((s) => s.message.role);
	const isEditing = useAuiState((s) => s.message.composer.isEditing);
	if (isEditing) return <EditComposer />;
	if (role === "user") return <UserMessage />;
	return <AssistantMessage />;
};

const ThreadScrollToBottom: FC = () => {
	return (
		<ThreadPrimitive.ScrollToBottom asChild>
			<TooltipIconButton
				tooltip="Scroll to bottom"
				variant="outline"
				className="aui-thread-scroll-to-bottom absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:border-border dark:bg-background dark:hover:bg-accent"
			>
				<ArrowDownIcon />
			</TooltipIconButton>
		</ThreadPrimitive.ScrollToBottom>
	);
};

const ThreadWelcome: FC = () => {
	return (
		<div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
			<div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
				<div className="aui-thread-welcome-message flex size-full flex-col justify-center px-4">
					<h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both font-bold text-3xl text-[#a82229] duration-200">
						SCALE UWA
					</h1>
					<p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground text-xl delay-75 duration-200">
						Ask about MS in Data Science 1+1 pathway, admissions, and careers.
					</p>
				</div>
			</div>
			<ThreadSuggestions />
		</div>
	);
};

const ThreadSuggestions: FC = () => {
	return (
		<div className="aui-thread-welcome-suggestions grid w-full @md:grid-cols-2 gap-2 pb-4">
			<ThreadPrimitive.Suggestions>
				{() => <ThreadSuggestionItem />}
			</ThreadPrimitive.Suggestions>
		</div>
	);
};

const ThreadSuggestionItem: FC = () => {
	return (
		<div className="aui-thread-welcome-suggestion-display fade-in slide-in-from-bottom-2 @md:nth-[n+3]:block nth-[n+3]:hidden animate-in fill-mode-both duration-200">
			<SuggestionPrimitive.Trigger send asChild>
				<Button
					variant="ghost"
					className="aui-thread-welcome-suggestion h-auto w-full @md:flex-col flex-wrap items-start justify-start gap-1 rounded-3xl border bg-background px-4 py-3 text-left text-sm transition-colors hover:bg-muted"
				>
					<SuggestionPrimitive.Title className="aui-thread-welcome-suggestion-text-1 font-medium" />
					<SuggestionPrimitive.Description className="aui-thread-welcome-suggestion-text-2 text-muted-foreground empty:hidden" />
				</Button>
			</SuggestionPrimitive.Trigger>
		</div>
	);
};

const Composer: FC = () => {
	return (
		<ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
			<ComposerPrimitive.AttachmentDropzone asChild>
				<div
					data-slot="composer-shell"
					className="flex w-full flex-col gap-2 rounded-(--composer-radius) border bg-background p-(--composer-padding) transition-shadow focus-within:border-ring/75 focus-within:ring-2 focus-within:ring-ring/20 data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50"
				>
					<ComposerAttachments />
					<ComposerPrimitive.Input
						placeholder="Send a message..."
						className="aui-composer-input max-h-32 min-h-10 w-full resize-none bg-transparent px-1.75 py-1 text-sm outline-none placeholder:text-muted-foreground/80"
						rows={1}
						autoFocus
						aria-label="Message input"
					/>
					<ComposerAction />
				</div>
			</ComposerPrimitive.AttachmentDropzone>
		</ComposerPrimitive.Root>
	);
};

// ── Voice Recognition ──────────────────────────────────────────────────
// Self-contained: reads composerRuntime directly from assistant-ui context
// so the typed transcript is injected via the official API (not DOM hacks).
const VoiceMicButton: FC = () => {
	// biome-ignore lint/suspicious/noExplicitAny: useComposerRuntime returns opaque runtime
	const composerRuntime = useComposerRuntime() as any;
	const [listening, setListening] = useState(false);
	const [supported, setSupported] = useState(true);
	// biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition cross-browser
	const recRef = useRef<any>(null);
	// Keep a stable ref to the latest runtime to avoid stale closure in onresult
	// biome-ignore lint/suspicious/noExplicitAny: runtime ref
	const runtimeRef = useRef<any>(null);
	runtimeRef.current = composerRuntime;

	useEffect(() => {
		// biome-ignore lint/suspicious/noExplicitAny: browser speech API
		const w = window as any;
		const API = w.SpeechRecognition || w.webkitSpeechRecognition;
		if (!API) {
			setSupported(false);
			return;
		}
		// biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition instance
		const rec: any = new API();
		rec.lang = "en-US";
		rec.continuous = false;
		rec.interimResults = false;
		rec.maxAlternatives = 1;

		rec.onresult = (e: any) => {
			const text: string = e.results[0][0].transcript;
			// Use the official assistant-ui API to set composer text
			const rt = runtimeRef.current;
			if (rt) {
				// setValue is the standard ComposerRuntime method
				if (typeof rt.setValue === "function") rt.setValue(text);
				else if (typeof rt.setText === "function") rt.setText(text);
				else {
					// Fallback: native React input event (last resort)
					const ta = document.querySelector<HTMLTextAreaElement>(".aui-composer-input");
					if (ta) {
						const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
						setter?.call(ta, text);
						ta.dispatchEvent(new InputEvent("input", { bubbles: true, data: text }));
						ta.focus();
					}
				}
			}
			setListening(false);
		};

		rec.onerror = (err: any) => {
			console.warn("[VoiceMic] error:", err?.error);
			setListening(false);
		};
		rec.onend = () => setListening(false);

		recRef.current = rec;
		return () => { try { rec.abort(); } catch (_) {} };
	}, []); // only on mount

	if (!supported) return null;

	const toggle = () => {
		const rec = recRef.current;
		if (!rec) return;
		if (listening) {
			try { rec.stop(); } catch (_) {}
			setListening(false);
		} else {
			try {
				rec.start();
				setListening(true);
			} catch (_) {
				setListening(false);
			}
		}
	};

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={listening ? "Stop voice input" : "Start voice input"}
			title={listening ? "Stop listening" : "Speak your message"}
			className={
				`flex size-8 items-center justify-center rounded-full transition-all duration-200 ${
					listening
						? "bg-[#a82229] text-white animate-pulse shadow-lg shadow-red-400/40"
						: "bg-muted text-muted-foreground hover:bg-[#008276] hover:text-white"
				}`
			}
		>
			{listening ? (
				<MicOffIcon className="size-4" />
			) : (
				<MicIcon className="size-4" />
			)}
		</button>
	);
};

// ── Composer Action Bar ─────────────────────────────────────────────────
const ComposerAction: FC = () => {
	return (
		<div className="aui-composer-action-wrapper relative flex items-center justify-between">
			<div className="flex items-center gap-1">
				<ComposerAddAttachment />
				<VoiceMicButton />
			</div>
			<AuiIf condition={(s) => !s.thread.isRunning}>
				<ComposerPrimitive.Send asChild>
					<TooltipIconButton
						tooltip="Send message"
						side="bottom"
						type="button"
						variant="default"
						size="icon"
						className="aui-composer-send size-8 rounded-full"
						aria-label="Send message"
					>
						<ArrowUpIcon className="aui-composer-send-icon size-4" />
					</TooltipIconButton>
				</ComposerPrimitive.Send>
			</AuiIf>
			<AuiIf condition={(s) => s.thread.isRunning}>
				<ComposerPrimitive.Cancel asChild>
					<Button
						type="button"
						variant="default"
						size="icon"
						className="aui-composer-cancel size-8 rounded-full"
						aria-label="Stop generating"
					>
						<SquareIcon className="aui-composer-cancel-icon size-3 fill-current" />
					</Button>
				</ComposerPrimitive.Cancel>
			</AuiIf>
		</div>
	);
};

const MessageError: FC = () => {
	return (
		<MessagePrimitive.Error>
			<ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
				<ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
			</ErrorPrimitive.Root>
		</MessagePrimitive.Error>
	);
};

const AssistantMessage: FC = () => {
	return (
		<MessagePrimitive.Root
			className="aui-assistant-message-root fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-3 duration-150"
			data-role="assistant"
		>
			<div className="aui-assistant-message-content wrap-break-word px-2 text-foreground leading-relaxed">
				<MessagePrimitive.Parts>
					{({ part }) => {
						if (part.type === "text") return <MarkdownText />;
						if (part.type === "reasoning") return <Reasoning {...part} />;
						if (part.type === "tool-call")
							return part.toolUI ?? <ToolFallback {...part} />;
						return null;
					}}
				</MessagePrimitive.Parts>
				<MessageError />
			</div>

			<div className="aui-assistant-message-footer mt-1 ml-2 flex">
				<BranchPicker />
				<AssistantActionBar />
			</div>
		</MessagePrimitive.Root>
	);
};

const AssistantActionBar: FC = () => {
	return (
		<ActionBarPrimitive.Root
			hideWhenRunning
			autohide="not-last"
			autohideFloat="single-branch"
			className="aui-assistant-action-bar-root col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
		>
			<ActionBarPrimitive.Copy asChild>
				<TooltipIconButton tooltip="Copy">
					<AuiIf condition={(s) => s.message.isCopied}>
						<CheckIcon />
					</AuiIf>
					<AuiIf condition={(s) => !s.message.isCopied}>
						<CopyIcon />
					</AuiIf>
				</TooltipIconButton>
			</ActionBarPrimitive.Copy>
			<ActionBarPrimitive.Reload asChild>
				<TooltipIconButton tooltip="Refresh">
					<RefreshCwIcon />
				</TooltipIconButton>
			</ActionBarPrimitive.Reload>
			<ActionBarMorePrimitive.Root>
				<ActionBarMorePrimitive.Trigger asChild>
					<TooltipIconButton
						tooltip="More"
						className="data-[state=open]:bg-accent"
					>
						<MoreHorizontalIcon />
					</TooltipIconButton>
				</ActionBarMorePrimitive.Trigger>
				<ActionBarMorePrimitive.Content
					side="bottom"
					align="start"
					className="aui-action-bar-more-content z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
				>
					<ActionBarPrimitive.ExportMarkdown asChild>
						<ActionBarMorePrimitive.Item className="aui-action-bar-more-item flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
							<DownloadIcon className="size-4" />
							Export as Markdown
						</ActionBarMorePrimitive.Item>
					</ActionBarPrimitive.ExportMarkdown>
				</ActionBarMorePrimitive.Content>
			</ActionBarMorePrimitive.Root>
		</ActionBarPrimitive.Root>
	);
};

const UserMessage: FC = () => {
	return (
		<MessagePrimitive.Root
			className="aui-user-message-root fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 duration-150 [&:where(>*)]:col-start-2"
			data-role="user"
		>
			<UserMessageAttachments />

			<div className="aui-user-message-content-wrapper relative col-start-2 min-w-0">
				<div className="aui-user-message-content wrap-break-word peer rounded-2xl bg-[#008276] px-4 py-2.5 text-white empty:hidden">
					<MessagePrimitive.Parts />
				</div>
				<div className="aui-user-action-bar-wrapper absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2 peer-empty:hidden">
					<UserActionBar />
				</div>
			</div>

			<BranchPicker className="aui-user-branch-picker col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
		</MessagePrimitive.Root>
	);
};

const UserActionBar: FC = () => {
	return (
		<ActionBarPrimitive.Root
			hideWhenRunning
			autohide="not-last"
			className="aui-user-action-bar-root flex flex-col items-end"
		>
			<ActionBarPrimitive.Edit asChild>
				<TooltipIconButton tooltip="Edit" className="aui-user-action-edit p-4">
					<PencilIcon />
				</TooltipIconButton>
			</ActionBarPrimitive.Edit>
		</ActionBarPrimitive.Root>
	);
};

const EditComposer: FC = () => {
	return (
		<MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-3">
			<ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
				<ComposerPrimitive.Input
					className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
					autoFocus
				/>
				<div className="aui-edit-composer-footer mx-3 mb-3 flex items-center gap-2 self-end">
					<ComposerPrimitive.Cancel asChild>
						<Button variant="ghost" size="sm">
							Cancel
						</Button>
					</ComposerPrimitive.Cancel>
					<ComposerPrimitive.Send asChild>
						<Button size="sm">Update</Button>
					</ComposerPrimitive.Send>
				</div>
			</ComposerPrimitive.Root>
		</MessagePrimitive.Root>
	);
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
	className,
	...rest
}) => {
	return (
		<BranchPickerPrimitive.Root
			hideWhenSingleBranch
			className={cn(
				"aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
				className,
			)}
			{...rest}
		>
			<BranchPickerPrimitive.Previous asChild>
				<TooltipIconButton tooltip="Previous">
					<ChevronLeftIcon />
				</TooltipIconButton>
			</BranchPickerPrimitive.Previous>
			<span className="aui-branch-picker-state font-medium">
				<BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
			</span>
			<BranchPickerPrimitive.Next asChild>
				<TooltipIconButton tooltip="Next">
					<ChevronRightIcon />
				</TooltipIconButton>
			</BranchPickerPrimitive.Next>
		</BranchPickerPrimitive.Root>
	);
};
