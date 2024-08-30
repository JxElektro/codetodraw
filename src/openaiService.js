import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error("API Key is missing or invalid.");
}

const openai = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
});

const retryWithBackoff = async (fn, retries = 3, delay = 2000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.response?.status === 429) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
};

// Función para realizar el análisis del código
export const analyzeCodeWithOpenAI = async (inputCode) => {
  const sanitizedInputCode = inputCode.replace(/[^a-zA-Z0-9\s.,;:{}()_\-\n]/g, '').trim();

  return retryWithBackoff(async () => {
    const response = await openai.post('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `You are an expert software engineer. Please analyze the following code and identify the key components in the logical flow. Provide the analysis as a clear, structured summary in markdown format, using appropriate headers, bullet points, and code blocks where necessary. Ensure it is formatted in a way that is presentable and easy to read:\n\n${sanitizedInputCode}`
      }],
      max_tokens: 500,
      temperature: 0.3,
    });

    if (response.data.choices.length > 0) {
      return response.data.choices[0]?.message.content.trim();
    } else {
      throw new Error("No analysis content returned from OpenAI.");
    }
  });
};

// Función para generar el código Mermaid basado en el análisis
export const generateMermaidCodeWithOpenAI = async (analysisContent) => {
  const sanitizedContent = analysisContent.replace(/[^a-zA-Z0-9\s.,;:{}()_\-\n]/g, '').trim();

  return retryWithBackoff(async () => {
    const response = await openai.post('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Based on the following analysis, generate a detailed Mermaid flowchart. Ensure that the response includes only the Mermaid code block with no additional characters, symbols, or special formatting other than those provided in the official Mermaid documentation. Please omit any explanations, introductions, or conclusions. Return only the Mermaid flowchart:\n\n${sanitizedContent}`
      }],
      max_tokens: 300,
      temperature: 0.2,
    });

    if (response.data.choices.length > 0) {
      const mermaidCode = response.data.choices[0]?.message.content.trim();
      return validateMermaidCode(mermaidCode);
    } else {
      throw new Error("No Mermaid code returned from OpenAI.");
    }
  });
};

// Función para validar y limpiar el código Mermaid
const validateMermaidCode = (code) => {
  const cleanedCode = code.replace(/```mermaid|```/g, '').trim();
  const isValid = cleanedCode.startsWith('graph') || cleanedCode.startsWith('flowchart');
  if (!isValid) {
    throw new Error("Invalid Mermaid syntax detected.");
  }
  return cleanedCode;
};
