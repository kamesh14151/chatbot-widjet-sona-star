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
		<div
			data-state={state}
			className="absolute inset-0 m-auto size-10 rounded-full bg-white flex items-center justify-center p-1 transition-all duration-200 data-[state=open]:scale-0 data-[state=open]:rotate-90"
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src="/logo.png"
				alt="SCALE UWA Logo"
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
							<p className="text-sm font-semibold leading-none text-white tracking-wide">SCALE UWA</p>
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
