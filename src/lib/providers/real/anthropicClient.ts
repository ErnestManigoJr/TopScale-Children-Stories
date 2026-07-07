// Thin wrapper around the Anthropic SDK for the real story brain. Uses
// forced tool-use (function calling) to get reliable structured JSON back
// from Claude instead of parsing free-form text.
// Requires ANTHROPIC_API_KEY - get a key at https://console.anthropic.com

import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set - add it to .env (see .env.example). Get a key at https://console.anthropic.com"
    );
  }
  client = new Anthropic({ apiKey });
  return client;
}

const MODEL = "claude-sonnet-4-6";

export async function callWithTool<T>(params: {
  system: string;
  prompt: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Anthropic.Tool["input_schema"];
}): Promise<T> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: params.system,
    tools: [{ name: params.toolName, description: params.toolDescription, input_schema: params.inputSchema }],
    tool_choice: { type: "tool", name: params.toolName },
    messages: [{ role: "user", content: params.prompt }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error(`Claude did not return a ${params.toolName} tool call`);
  }
  return toolUse.input as T;
}
