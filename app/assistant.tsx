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
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<div className="relative h-dvh w-full bg-background">
				<AssistantModal />
			</div>
		</AssistantRuntimeProvider>
	);
};
