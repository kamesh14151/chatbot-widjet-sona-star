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

export const Thread: FC = () => {
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
					<Composer />
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
						SONA UWA
					</h1>
					<p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-1 animate-in fill-mode-both text-muted-foreground text-xl delay-75 duration-200">
						Ask about Unreal Engine courses, admissions, and career pathways.
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

// ── Voice Recognition Hook ──────────────────────────────────────────
type VoiceState = "idle" | "listening" | "unsupported";

function useVoiceInput(onTranscript: (text: string) => void) {
	const [voiceState, setVoiceState] = useState<VoiceState>("idle");
	// biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition is not universally typed
	const recognitionRef = useRef<any>(null);

	useEffect(() => {
		// biome-ignore lint/suspicious/noExplicitAny: cross-browser speech API
		const w = window as any;
		const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;
		if (!SpeechRecognitionAPI) {
			setVoiceState("unsupported");
			return;
		}
		// biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition instance
		const rec: any = new SpeechRecognitionAPI();
		rec.lang = "en-US";
		rec.interimResults = false;
		rec.maxAlternatives = 1;
		// biome-ignore lint/suspicious/noExplicitAny: SpeechRecognitionEvent not typed
		rec.onresult = (e: any) => {
			const transcript: string = e.results[0][0].transcript;
			onTranscript(transcript);
			setVoiceState("idle");
		};
		rec.onerror = () => setVoiceState("idle");
		rec.onend = () => setVoiceState("idle");
		recognitionRef.current = rec;
	}, [onTranscript]);

	const toggle = useCallback(() => {
		const rec = recognitionRef.current;
		if (!rec) return;
		if (voiceState === "listening") {
			rec.stop();
			setVoiceState("idle");
		} else {
			rec.start();
			setVoiceState("listening");
		}
	}, [voiceState]);

	return { voiceState, toggle };
}

// ── Voice Mic Button ─────────────────────────────────────────────────
const VoiceMicButton: FC<{ onTranscript: (text: string) => void }> = ({ onTranscript }) => {
	const { voiceState, toggle } = useVoiceInput(onTranscript);
	if (voiceState === "unsupported") return null;

	const isListening = voiceState === "listening";
	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={isListening ? "Stop listening" : "Start voice input"}
			title={isListening ? "Stop listening" : "Speak your message"}
			className={
				`flex size-8 items-center justify-center rounded-full transition-all duration-200 ${
					isListening
						? "bg-[#a82229] text-white animate-pulse shadow-lg shadow-red-400/40"
						: "bg-muted text-muted-foreground hover:bg-[#008276] hover:text-white"
				}`
			}
		>
			{isListening ? (
				<MicOffIcon className="size-4" />
			) : (
				<MicIcon className="size-4" />
			)}
		</button>
	);
};

// ── Composer Input ref shim for voice fill ───────────────────────────
const ComposerAction: FC = () => {
	// We inject the voice transcript directly into the ComposerPrimitive textarea
	const handleTranscript = useCallback((text: string) => {
		const textarea = document.querySelector<HTMLTextAreaElement>(
			".aui-composer-input",
		);
		if (!textarea) return;
		// Use native input setter so React state picks up the change
		const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
			window.HTMLTextAreaElement.prototype,
			"value",
		)?.set;
		nativeInputValueSetter?.call(textarea, text);
		textarea.dispatchEvent(new Event("input", { bubbles: true }));
		textarea.focus();
	}, []);

	return (
		<div className="aui-composer-action-wrapper relative flex items-center justify-between">
			<div className="flex items-center gap-1">
				<ComposerAddAttachment />
				<VoiceMicButton onTranscript={handleTranscript} />
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
