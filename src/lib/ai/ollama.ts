import "server-only";

import { env } from "@/lib/env";

type OllamaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatInput = {
  messages: OllamaChatMessage[];
  model?: string;
  timeoutMs?: number;
};

type OllamaChatSuccess = {
  model: string;
  content: string;
  raw: unknown;
};

type OllamaTagsResponse = {
  models?: Array<{ name?: unknown }>;
};

function normalizeOllamaBaseUrl() {
  return env.ollamaBaseUrl.replace(/\/+$/, "");
}

function modelLooksMissing(status: number, errorText: string) {
  if (status !== 400 && status !== 404) {
    return false;
  }

  return /model|pull|not found|unknown/i.test(errorText);
}

function normalizeModelNames(payload: OllamaTagsResponse) {
  if (!Array.isArray(payload.models)) {
    return [] as string[];
  }

  return payload.models
    .map((model) => (typeof model.name === "string" ? model.name.trim() : ""))
    .filter((name): name is string => Boolean(name));
}

function selectFallbackModel(requestedModel: string, installedModels: string[]) {
  if (!installedModels.length) {
    return null;
  }
  if (installedModels.includes(requestedModel)) {
    return requestedModel;
  }

  const requestedFamily = requestedModel.split(":")[0];
  const familyMatch = installedModels.find((name) => name.startsWith(`${requestedFamily}:`));
  if (familyMatch) {
    return familyMatch;
  }

  return installedModels[0];
}

export async function chatJsonWithOllama(
  input: OllamaChatInput,
): Promise<OllamaChatSuccess> {
  const model = input.model ?? env.ollamaModel;
  const timeoutMs = input.timeoutMs ?? env.ollamaTimeoutMs;
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const sendChatRequest = async (modelName: string) => {
      const response = await fetch(`${normalizeOllamaBaseUrl()}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          stream: false,
          format: "json",
          messages: input.messages,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          ok: false as const,
          status: response.status,
          errorText,
        };
      }

      const parsed = (await response.json()) as {
        model?: unknown;
        message?: { content?: unknown };
      };
      const content = parsed.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new Error("Ollama chat response contained no assistant content.");
      }

      return {
        ok: true as const,
        model: typeof parsed.model === "string" ? parsed.model : modelName,
        content: content.trim(),
        raw: parsed,
      };
    };

    const primaryAttempt = await sendChatRequest(model);
    if (primaryAttempt.ok) {
      return {
        model: primaryAttempt.model,
        content: primaryAttempt.content,
        raw: primaryAttempt.raw,
      };
    }

    if (!modelLooksMissing(primaryAttempt.status, primaryAttempt.errorText)) {
      throw new Error(
        `Ollama chat request failed (${primaryAttempt.status}): ${primaryAttempt.errorText.slice(0, 400)}`,
      );
    }

    const tagsResponse = await fetch(`${normalizeOllamaBaseUrl()}/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!tagsResponse.ok) {
      throw new Error(
        `Ollama chat request failed (${primaryAttempt.status}): ${primaryAttempt.errorText.slice(0, 400)}`,
      );
    }

    const tagsPayload = (await tagsResponse.json()) as OllamaTagsResponse;
    const installedModels = normalizeModelNames(tagsPayload);
    const fallbackModel = selectFallbackModel(model, installedModels);
    if (!fallbackModel || fallbackModel === model) {
      throw new Error(
        `Ollama chat request failed (${primaryAttempt.status}): ${primaryAttempt.errorText.slice(0, 400)}`,
      );
    }

    const fallbackAttempt = await sendChatRequest(fallbackModel);
    if (!fallbackAttempt.ok) {
      throw new Error(
        `Ollama chat fallback model "${fallbackModel}" failed (${fallbackAttempt.status}): ${fallbackAttempt.errorText.slice(0, 400)}`,
      );
    }

    return {
      model: fallbackAttempt.model,
      content: fallbackAttempt.content,
      raw: fallbackAttempt.raw,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Ollama chat request timed out after ${timeoutMs}ms.`);
    }

    if (error instanceof Error) {
      throw new Error(`Ollama chat error: ${error.message}`);
    }

    throw new Error("Ollama chat failed with an unknown error.");
  } finally {
    clearTimeout(timeoutHandle);
  }
}
