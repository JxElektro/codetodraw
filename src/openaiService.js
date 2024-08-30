import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

console.log("API Key Loaded:", API_KEY);

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
      console.log(`Retrying after ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
};

// Función para realizar el análisis del código
export const analyzeCodeWithOpenAI = async (inputCode) => {
  console.log("Input Code for Analysis:", inputCode);

  return retryWithBackoff(async () => {
    const response = await openai.post('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `You are an expert software engineer. Please analyze the following code and identify the key components in the logical flow. Provide this as a clear and structured summary without any additional explanations or conclusions. Focus only on the critical parts of the flow:\n\n${inputCode}`
      }],
      max_tokens: 500,
      temperature: 0.3,
    });

    if (response.data.choices.length > 0) {
      const analysisContent = response.data.choices[0]?.message.content.trim();
      console.log("Analysis Content:", analysisContent);
      return analysisContent;
    } else {
      throw new Error("No analysis content returned from OpenAI.");
    }
  });
};

// Función para generar el código Mermaid basado en el análisis
export const generateMermaidCodeWithOpenAI = async (analysisContent) => {
  console.log("Analysis Content for Mermaid Generation:", analysisContent);

  return retryWithBackoff(async () => {
    const response = await openai.post('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Based on the following analysis, generate a detailed Mermaid flowchart. Ensure that the response includes only the Mermaid code block and nothing else. Please omit any explanations, introductions, or conclusions. Return only the Mermaid flowchart:\n\n${analysisContent}`
      }],
      max_tokens: 300,
      temperature: 0.2,
    });

    if (response.data.choices.length > 0) {
      const mermaidCode = response.data.choices[0]?.message.content.trim();
      console.log("Mermaid Code:", mermaidCode);

      // Verificar y limpiar el código Mermaid para evitar errores de sintaxis
      if (mermaidCode.startsWith("```mermaid")) {
        return mermaidCode.replace(/```mermaid|```/g, '').trim();
      } else {
        return mermaidCode;
      }
    } else {
      throw new Error("No Mermaid code returned from OpenAI.");
    }
  });
};
