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
import { cookies } from "next/headers";

export async function POST(req: Request) {
	const cookieStore = await cookies();
	const userName = cookieStore.get("scale_uwa_user_name")?.value ? decodeURIComponent(cookieStore.get("scale_uwa_user_name")!.value) : "";
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

	let systemPrompt = system
		? `${baseSystemPrompt}\n\nAdditional instructions:\n${system}`
		: baseSystemPrompt;

	if (userName) {
		systemPrompt += `\n\nThe user's name is "${userName}". Please address them by their name in your responses. If the greeting/language prompt (Step 2) has already been sent in the conversation history, do NOT repeat the greeting or language selection questions. Proceed directly to assisting the user.`;
	}

	const result = streamText({
		model: google("gemini-2.5-flash-lite"),
		messages: await convertToModelMessages(messages),
		system: systemPrompt,
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
