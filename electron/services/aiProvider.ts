import { AiProvider, McqResult } from '../../src/types';

const SYSTEM_PROMPT = `You are BlinkKey, an expert multiple-choice question (MCQ) analysis assistant.
Analyze the provided screenshot of the user's screen.
Your job is to:
1. Identify the multiple-choice question currently visible on screen.
2. Read the question text and all answer choices/options (e.g., A, B, C, D).
3. Determine the single most accurate and correct answer choice.
4. Return ONLY a valid JSON object with the following exact structure:
{
  "status": "success",
  "question": "Question text here",
  "options": {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  },
  "selectedOption": "A",
  "confidence": 0.95,
  "explanation": "Brief explanation of why this option is correct."
}

CRITICAL RULES:
- If there is NO visible multiple-choice question in the image, return:
  {"status": "no_question", "selectedOption": "UNKNOWN", "explanation": "No clear multiple-choice question detected on screen."}
- "selectedOption" MUST be a single uppercase letter: "A", "B", "C", "D", or "E".
- If the question uses numbers for options (1, 2, 3, 4), map 1->A, 2->B, 3->C, 4->D.
- Do NOT output any markdown wrappers, codeblocks, or extra text. Output ONLY the JSON string.`;

export class AiService {
  public static async analyzeScreen(
    provider: AiProvider,
    apiKey: string,
    model: string,
    base64Image: string,
    customEndpoint?: string
  ): Promise<McqResult> {
    const startTime = Date.now();

    if (!apiKey && provider !== 'custom') {
      throw new Error(`API key is required for ${provider.toUpperCase()}`);
    }

    let rawJson = '';

    if (provider === 'gemini') {
      rawJson = await this.callGemini(apiKey, model || 'gemini-2.0-flash', base64Image);
    } else if (provider === 'openai') {
      rawJson = await this.callOpenAI(apiKey, model || 'gpt-4o-mini', base64Image, customEndpoint);
    } else if (provider === 'anthropic') {
      rawJson = await this.callAnthropic(apiKey, model || 'claude-3-5-haiku-20241022', base64Image);
    } else if (provider === 'custom') {
      const endpoint = customEndpoint || 'http://localhost:11434/v1/chat/completions';
      rawJson = await this.callOpenAI(apiKey || 'ollama', model || 'llava', base64Image, endpoint);
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    const elapsed = Date.now() - startTime;
    return this.parseAndValidateResponse(rawJson, elapsed);
  }

  public static async testConnection(
    provider: AiProvider,
    apiKey: string,
    model: string,
    customEndpoint?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (provider === 'gemini') {
        const cleanKey = apiKey.trim();
        const cleanModel = (model || 'gemini-flash-lite-latest').trim().replace(/^models\//, '');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': cleanKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with the word OK if you can read this.' }] }],
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          let detail = errText;
          try {
            const parsed = JSON.parse(errText);
            detail = parsed.error?.message || errText;
          } catch {}

          if (resp.status === 404) {
            return {
              success: false,
              message: `Model "${cleanModel}" not found (404). Please select "gemini-flash-lite-latest" or "gemini-3.1-flash-lite".`,
            };
          }
          if (resp.status === 503) {
            return {
              success: false,
              message: `Model "${cleanModel}" is temporarily at high demand (503). Select "gemini-flash-lite-latest" for instant response.`,
            };
          }
          if (resp.status === 401) {
            return {
              success: false,
              message: `Authentication failed (401). Detail: ${detail}`,
            };
          }
          return { success: false, message: `Gemini API error (${resp.status}): ${detail}` };
        }
        return { success: true, message: `Google Gemini API connection successful! (Model: ${cleanModel})` };
      }

      if (provider === 'openai' || provider === 'custom') {
        const url = customEndpoint || 'https://api.openai.com/v1/chat/completions';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 5,
          }),
        });
        if (!resp.ok) {
          const err = await resp.text();
          return { success: false, message: `API error (${resp.status}): ${err}` };
        }
        return { success: true, message: 'API connection successful!' };
      }

      if (provider === 'anthropic') {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-haiku-20241022',
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 5,
          }),
        });
        if (!resp.ok) {
          const err = await resp.text();
          return { success: false, message: `Anthropic API error (${resp.status}): ${err}` };
        }
        return { success: true, message: 'Anthropic API connection successful!' };
      }

      return { success: false, message: 'Unknown provider' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection test failed' };
    }
  }

  private static async callGemini(apiKey: string, model: string, base64Image: string): Promise<string> {
    const cleanKey = apiKey.trim();
    let cleanModel = (model || 'gemini-flash-lite-latest').trim().replace(/^models\//, '');
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const payload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [
            { text: 'Identify the multiple choice question in this image and return the structured JSON answer.' },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    let resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
      },
      body: JSON.stringify(payload),
    });

    // If model is not found (404) or temporarily overloaded (503), auto-fallback to gemini-flash-lite-latest
    if (!resp.ok && (resp.status === 404 || resp.status === 503) && cleanModel !== 'gemini-flash-lite-latest') {
      console.warn(`[AI] Model ${cleanModel} returned ${resp.status}, automatically falling back to gemini-flash-lite-latest...`);
      cleanModel = 'gemini-flash-lite-latest';
      url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': cleanKey,
        },
        body: JSON.stringify(payload),
      });
    }

    if (!resp.ok) {
      const errText = await resp.text();
      let detail = errText;
      try {
        const parsed = JSON.parse(errText);
        detail = parsed.error?.message || errText;
      } catch {}
      throw new Error(`Gemini API error [${resp.status}]: ${detail}`);
    }

    const json: any = await resp.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response received from Gemini');
    }
    return text;
  }

  private static async callOpenAI(apiKey: string, model: string, base64Image: string, customEndpoint?: string): Promise<string> {
    const url = customEndpoint || 'https://api.openai.com/v1/chat/completions';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const payload = {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify the multiple choice question and return JSON.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 800,
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI API error [${resp.status}]: ${errText}`);
    }

    const json: any = await resp.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response received from OpenAI');
    }
    return content;
  }

  private static async callAnthropic(apiKey: string, model: string, base64Image: string): Promise<string> {
    const url = 'https://api.anthropic.com/v1/messages';
    const payload = {
      model,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Identify the multiple choice question and return JSON only.',
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.1,
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Anthropic API error [${resp.status}]: ${errText}`);
    }

    const json: any = await resp.json();
    const content = json.content?.[0]?.text;
    if (!content) {
      throw new Error('Empty response received from Anthropic');
    }
    return content;
  }

  private static parseAndValidateResponse(rawText: string, processingTimeMs: number): McqResult {
    let clean = rawText.trim();
    // Strip code fence if present
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      throw new Error(`Failed to parse AI JSON response: ${clean.substring(0, 150)}...`);
    }

    const id = 'mcq_' + Date.now().toString(36);

    if (parsed.status === 'no_question' || parsed.selectedOption === 'UNKNOWN' || !parsed.selectedOption) {
      return {
        id,
        timestamp: Date.now(),
        status: 'no_question',
        question: parsed.question || 'No question detected',
        explanation: parsed.explanation || 'No clear multiple choice question found on the screen.',
        blinkCount: 0,
        processingTimeMs,
      };
    }

    const rawOpt = String(parsed.selectedOption).trim().toUpperCase();
    const validLetters = ['A', 'B', 'C', 'D', 'E'];
    const letterIndex = validLetters.indexOf(rawOpt);

    if (letterIndex === -1) {
      return {
        id,
        timestamp: Date.now(),
        status: 'error',
        errorMessage: `AI returned invalid option label: ${rawOpt}`,
        blinkCount: 0,
        processingTimeMs,
      };
    }

    const blinkCount = letterIndex + 1; // A=1, B=2, C=3, D=4, E=5

    return {
      id,
      timestamp: Date.now(),
      status: 'success',
      question: parsed.question || 'Detected question',
      options: parsed.options || {},
      selectedOption: rawOpt,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
      explanation: parsed.explanation || '',
      blinkCount,
      processingTimeMs,
    };
  }
}
