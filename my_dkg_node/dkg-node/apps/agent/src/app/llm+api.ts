import { processCompletionRequest } from "@/shared/chat";

export function GET() {
  return Response.json({
    provider: (globalThis as any).llmProvider?.getName() ?? null,
    model: (globalThis as any).llmProvider?.model ?? null,
    temperature: (globalThis as any).llmProvider?.temperature ?? null,
    baseURL: (globalThis as any).llmProvider?.lc_kwargs?.configuration?.baseURL,
  });
}

export function POST(req: Request) {
  return processCompletionRequest(req);
}
