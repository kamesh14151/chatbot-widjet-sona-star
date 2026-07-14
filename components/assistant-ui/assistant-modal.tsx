import { AssistantModalPrimitive } from "@assistant-ui/react";
import { XIcon } from "lucide-react";
import { forwardRef } from "react";
import { Thread } from "@/components/assistant-ui/thread";

const ModalButton = forwardRef<
	HTMLButtonElement,
	React.ComponentPropsWithoutRef<"button"> & { "data-state"?: string }
>(({ "data-state": state, ...props }, ref) => (
	<button
		ref={ref}
		type="button"
		aria-label={state === "open" ? "Close chat assistant" : "Open chat assistant"}
		className="relative size-full rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center border-2 border-white/10"
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
			className="absolute inset-0 m-auto size-10 rounded-full bg-white flex items-center justify-center p-0.5 transition-all duration-200 data-[state=open]:scale-0 data-[state=open]:rotate-90"
		>
			{/* UWA AI Icon */}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src="/tiger-head-logo-icon-mascot-vector-illustration_194708-1660-removebg-preview.png"
				alt="UWA AI Chatbot"
				className="size-full object-contain"
			/>
		</div>
		<XIcon
			data-state={state}
			className="absolute inset-0 m-auto size-6 transition-all duration-200 data-[state=closed]:scale-0 data-[state=closed]:-rotate-90"
		/>
	</button>
));

ModalButton.displayName = "ModalButton";

export const AssistantModal = () => {
	return (
		<AssistantModalPrimitive.Root>
			<AssistantModalPrimitive.Anchor className="fixed right-4 bottom-8 z-50 size-14">
				<AssistantModalPrimitive.Trigger asChild>
					<ModalButton />
				</AssistantModalPrimitive.Trigger>
			</AssistantModalPrimitive.Anchor>

			<AssistantModalPrimitive.Content
				dissmissOnInteractOutside
				sideOffset={16}
				className="h-[550px] w-[400px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-popover shadow-xl duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-4"
			>
				<div className="flex h-full flex-col">
					<div className="bg-[#1a1a1a] border-t-4 border-[#a82229] px-4 py-3.5 shadow-sm flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-full bg-white overflow-hidden p-0.5">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src="/logo.png"
								alt="SCALE UWA Logo"
								className="size-full object-contain"
							/>
						</div>
						<div>
							<p className="text-sm font-semibold leading-none text-white tracking-wide flex items-center gap-1.5">
								SCALE UWA
								<svg className="size-3.5 fill-[#1D9BF0] text-white flex-shrink-0" viewBox="0 0 24 24" aria-label="Verified account">
									<path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.99-3.818-3.99-.48 0-.94.1-1.348.27C14.825 2.515 13.512 1.5 12 1.5s-2.825 1.015-3.422 2.28c-.406-.17-.866-.27-1.348-.27-2.108 0-3.818 1.78-3.818 3.99 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.71 3.99 3.818 3.99.48 0 .94-.1 1.348-.27.597 1.265 1.91 2.27 3.422 2.27s2.825-1.005 3.422-2.27c.406.17.866.27 1.348.27 2.108 0 3.818-1.78 3.818-3.99 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6zm-12.5 4L6 12.5l1.5-1.5 2.5 2.5 6.5-6.5 1.5 1.5-8 8z" />
								</svg>
							</p>
							<p className="mt-1 text-[10px] text-zinc-300">
								Course guidance, admissions help, and support links
							</p>
						</div>
					</div>
					<div className="min-h-0 flex-1">
						<Thread />
					</div>
				</div>
			</AssistantModalPrimitive.Content>
		</AssistantModalPrimitive.Root>
	);
};
