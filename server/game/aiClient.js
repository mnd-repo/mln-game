import { GoogleGenAI } from '@google/genai';

const USE_MOCK = process.env.USE_MOCK_AI === 'true' || !process.env.GEMINI_API_KEY;

let ai = null;
if (!USE_MOCK) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

async function withTimeout(promise, ms, fallback) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    console.error('AI call failed, using fallback:', err.message);
    return fallback;
  }
}

export async function generateAiResume(jobDescription) {
  const fallback =
    `I have hands-on experience directly relevant to this role and have consistently ` +
    `delivered results under pressure. I'm confident I can adapt quickly and bring ` +
    `judgment to this position that goes beyond following a fixed process.`;

  if (USE_MOCK) return fallback;

  const prompt =
    `You are applying for this job under real time pressure, with only 90 seconds ` +
    `to write a resume - the same constraint a human contestant has. Write a resume ` +
    `that could plausibly have been typed that fast: a little rough around the edges ` +
    `is fine and expected, don't make it suspiciously polished. Keep it under 120 words. OUTPUT FORMAT MUST BE RAW TEXT\n\n` +
    `Job description: ${jobDescription}`;

  return withTimeout(
    ai.models
      .generateContent({ model: 'gemini-3.1-flash-lite', contents: prompt })
      .then((res) => res.text?.trim() || fallback),
    12000,
    fallback
  );
}

export async function getAiVerdict(jobDescription, humanResume) {
  const fallback = {
    decision: 'automate',
    reasoning:
      'The resume does not demonstrate a clear advantage over an automated system for this role.'
  };

  if (USE_MOCK) return fallback;

  const prompt =
    `Job description: ${jobDescription}\n\nCandidate resume: ${humanResume}\n\n` +
    `Respond ONLY as JSON in this exact shape: {"decision": "hire" | "automate", "reasoning": "2-3 sentences"}`;

  return withTimeout(
    ai.models
      .generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      })
      .then((res) => {
        try {
          const parsed = JSON.parse(res.text);
          if (parsed.decision === 'hire' || parsed.decision === 'automate') return parsed;
          return fallback;
        } catch {
          return fallback;
        }
      }),
    12000,
    fallback
  );
}
