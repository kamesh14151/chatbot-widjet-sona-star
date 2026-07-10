"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
	AssistantChatTransport,
	useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { AssistantModal } from "@/components/assistant-ui/assistant-modal";

export const Assistant = () => {
	const runtime = useChatRuntime({
		sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
		transport: new AssistantChatTransport({
			api: "/api/chat",
		}),
		messages: [
			{
				id: "welcome-msg",
				role: "assistant",
				parts: [
					{
						type: "text",
						text: "👋 Welcome to SONA SCALE UWA! 🎓\nI'm your personal admissions assistant for the MS in Data Science – SONA-UWA 1+1 International Pathway Program.\n\nMay I know your name?",
					},
				],
			},
		],
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<div className="relative h-dvh w-full bg-background">
				<AssistantModal />
			</div>
		</AssistantRuntimeProvider>
	);
};
