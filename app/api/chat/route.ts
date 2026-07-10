import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { frontendTools } from "@assistant-ui/react-ai-sdk";
import {
	convertToModelMessages,
	type JSONSchema7,
	smoothStream,
	streamText,
	type UIMessage,
} from "ai";
import { buildSonaStarSystemPrompt } from "@/lib/datasets/sona-star-faq";

export async function POST(req: Request) {
	const apiKey =
		process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

	if (!apiKey) {
		return new Response(
			"Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.",
			{ status: 500 },
		);
	}

	const google = createGoogleGenerativeAI({ apiKey });

	const {
		messages,
		system,
		tools,
	}: {
		messages: UIMessage[];
		system?: string;
		tools?: Record<string, { description?: string; parameters: JSONSchema7 }>;
	} = await req.json();

	const configuredDelay = Number(process.env.CHAT_STREAM_DELAY_MS ?? "28");
	const sonaStarWebsiteUrl =
		process.env.SONA_STAR_WEBSITE_URL?.trim() || "https://sonastar.com/";
	const baseSystemPrompt = buildSonaStarSystemPrompt(sonaStarWebsiteUrl);
	const streamDelayMs =
		Number.isFinite(configuredDelay) && configuredDelay >= 0
			? configuredDelay
			: 28;

	const result = streamText({
		model: google("gemini-2.5-flash-lite"),
		messages: await convertToModelMessages(messages),
		system: system
			? `${baseSystemPrompt}\n\nAdditional instructions:\n${system}`
			: baseSystemPrompt,
		tools: {
			...frontendTools(tools ?? {}),
		},
		experimental_transform: smoothStream({
			delayInMs: streamDelayMs,
			chunking: "word",
		}),
	});

	return result.toUIMessageStreamResponse({
		sendReasoning: true,
	});
}
