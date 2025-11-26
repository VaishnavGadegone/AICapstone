import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { JANSATHI_SYSTEM_INSTRUCTION } from "../constants";
import { SchemeType } from "../types";

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;
let currentScheme: SchemeType = SchemeType.GENERAL;

// Helper to get initialized AI client safely
const getAIClient = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing in environment variables");
      throw new Error("API Key missing");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

/**
 * Generates a vector embedding for the user query and searches the Pinecone index.
 */
const searchKnowledgeBase = async (query: string): Promise<string | null> => {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexHost = process.env.PINECONE_INDEX_HOST;

  if (!apiKey || !indexHost) {
    console.warn("Pinecone credentials missing. Skipping RAG.");
    return null;
  }

  try {
    // 1. Generate Embedding using Gemini
    const aiClient = getAIClient();
    const embeddingResp = await aiClient.models.embedContent({
      model: 'text-embedding-004',
      contents: [{ parts: [{ text: query }] }]
    });

    const vector = embeddingResp.embeddings?.[0]?.values;
    if (!vector) return null;

    // 2. Query Pinecone Index
    const response = await fetch(`${indexHost}/query`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vector,
        topK: 5, // Retrieve top 5 relevant chunks
        includeMetadata: true
      })
    });

    if (!response.ok) {
      throw new Error(`Pinecone query failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // 3. Format retrieved text
    const matches = data.matches || [];
    if (matches.length === 0) return null;

    const context = matches
      .map((m: any) => m.metadata?.text)
      .filter((t: any) => t)
      .join('\n\n---\n\n');

    return context;

  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return null;
  }
};

export const initializeChat = async (scheme: SchemeType) => {
  currentScheme = scheme;
  
  let specificInstruction = JANSATHI_SYSTEM_INSTRUCTION;
  
  if (scheme !== SchemeType.GENERAL) {
    specificInstruction += `\n\nCONTEXTUAL NOTE: The user has currently selected the **${scheme}** tab. 
    - If the query is ambiguous, focus on ${scheme}.
    - HOWEVER, if the user asks about a topic clearly belonging to another mission, answer correctly for that mission.`;
  }

  try {
    const aiClient = getAIClient();
    chatSession = aiClient.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: specificInstruction,
        temperature: 0.3, 
        tools: [{ googleSearch: {} }], 
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    return false;
  }
};

export const sendMessageStream = async (text: string): Promise<AsyncIterable<GenerateContentResponse> | null> => {
  if (!chatSession) {
    await initializeChat(currentScheme);
  }

  if (!chatSession) {
    throw new Error("Chat session could not be established.");
  }

  try {
    // 1. Retrieve relevant context from Pinecone
    const context = await searchKnowledgeBase(text);
    
    // 2. Construct the message with context (if available)
    let messageToSend = text;
    if (context) {
      messageToSend = `Use the following context from the official Ministry knowledge base to answer the user's question. If the answer is in the context, cite it. If not, use Google Search.\n\n` +
                      `**RETRIEVED CONTEXT:**\n${context}\n\n` +
                      `**USER QUESTION:**\n${text}`;
    }

    // 3. Send to Gemini
    const result = await chatSession.sendMessageStream({ message: messageToSend });
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};