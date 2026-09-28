// A minimal client for TypeSafe's System One API, sent through EchoFrame's relay at /api/jev.
// See https://docs.typesafe.ai/api

export const jevEndpoint = "https://api.typesafe.ai/v1/systemone";

export type JevQuestion =
  | {
      type: "noul";
      instructions: unknown;
      criteria?: { true?: unknown; false?: unknown };
    }
  | { type: "choice"; instructions: unknown; criteria: Record<string, unknown> }
  | { type: "score"; instructions: unknown; criteria: unknown[] };

export type JevAnswer =
  | { type: "noul"; noul: number }
  | {
      type: "choice";
      choice: string;
      confidence: number;
      probabilities?: Record<string, number>;
    }
  | { type: "score"; score: number; confidence: number };

export type JevResponse = {
  model: string;
  answers: Record<string, JevAnswer>;
  usage: { input_tokens: number; output_tokens: number };
};

export class JevError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const messages: Record<number, string> = {
  401: "Jev didn’t accept this key. Check it in the TypeSafe console.",
  422: "Jev couldn’t read the request.",
  429: "Your Jev rate limit was reached. Try again in a moment.",
  529: "Jev is busy right now. Try again in a moment.",
};

export async function askJev(
  key: string,
  request: { state: unknown; questions: Record<string, JevQuestion> },
  {
    signal,
    endpoint = "/api/jev",
  }: { signal?: AbortSignal; endpoint?: string } = {},
): Promise<JevResponse> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "jev-latest", ...request }),
    signal,
  });
  if (!response.ok)
    throw new JevError(
      messages[response.status] ??
        `Jev returned an error (${response.status}).`,
      response.status,
    );
  return response.json();
}

/** Sends the smallest useful request to confirm a key works. */
export async function checkJevKey(
  key: string,
  options?: { signal?: AbortSignal },
) {
  const response = await askJev(
    key,
    {
      state: "The speaker is describing how forests move water into the air.",
      questions: {
        about_nature: {
          type: "noul",
          instructions: "Is the speaker talking about nature?",
        },
      },
    },
    options,
  );
  return response.model;
}
