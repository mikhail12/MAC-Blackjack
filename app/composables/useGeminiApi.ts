import { GoogleGenAI, Type } from "@google/genai";
import { useRuntimeConfig } from "#imports";



export const useGeminiApi = () => {
    const runtimeConfig = useRuntimeConfig();
    const apiKey = runtimeConfig.public.GEMINI_API_KEY ?? "";

    if (!apiKey) {
        throw new Error(
            "Gemini API key is not configured. Set GEMINI_API_KEY in your environment.",
        );
    }

    // const defaultModel = FALLBACK_MODEL;
    const client = new GoogleGenAI({ 
        apiKey
    });


    const generateText = async (
        prompt: string,
    ): Promise<string> => {
        if (!prompt || !prompt.trim()) {
            throw new Error("Prompt must be a non-empty string.");
        }

        const config = {
            thinkingConfig: {
            thinkingBudget: 0,
            },
            responseMimeType: 'application/json',
            responseSchema: {
            type: Type.OBJECT,
            required: ["should_hit", "explanation"],
            properties: {
                should_hit: {
                type: Type.BOOLEAN,
                },
                explanation: {
                type: Type.STRING,
                },
            },
            },
        };

        const result = await client.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            config,
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
        });

        if (!result.text) {
            throw new Error("Gemini API returned an empty response.");
        }

        return result.text;
    };

    return { client, generateText };
};

export interface GeminiBlackjackResponse {
    should_hit: boolean,
    explanation: string,
}