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

// Función para reintentar solicitudes con backoff con un tiempo mayor
const retryWithBackoff = async (fn, retries = 3, delay = 2000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.response?.status === 429) {
      console.log(`Retrying after ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2); // Incrementa el delay exponencialmente
    } else {
      throw error;
    }
  }
};

// Primera llamada: Análisis del código
export const analyzeCodeWithOpenAI = async (inputCode) => {
  console.log("Input Code for Analysis:", inputCode);

  return retryWithBackoff(async () => {
    const response = await openai.post('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `You are an expert software engineer. Please analyze the following code and identify the key components in the logical flow (e.g., main functions, critical conditions, and loops). Provide this as a clear and structured summary without any additional explanations or conclusions. Focus only on the critical parts of the flow:\n\n${inputCode}`
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

// Segunda llamada: Generación del código Mermaid
export const generateMermaidCodeWithOpenAI = async (analysisContent) => {
  console.log("Analysis Content for Mermaid Generation:", analysisContent);

  return retryWithBackoff(async () => {
    const response = await openai.post('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Based on the following analysis, generate a detailed Mermaid flowchart. Ensure that the flowchart only includes letters and numbers inside the elements. Avoid using any punctuation marks such as parentheses "()", angle brackets "<>", or other special characters inside the elements. The flowchart should be formatted correctly for Mermaid, focusing on accurately representing the flow without adding unnecessary details:\n\n${analysisContent}`
      }],
      max_tokens: 300,
      temperature: 0.2,
    });

    if (response.data.choices.length > 0) {
      const mermaidCode = response.data.choices[0]?.message.content.trim();
      console.log("Mermaid Code:", mermaidCode);
      return mermaidCode;
    } else {
      throw new Error("No Mermaid code returned from OpenAI.");
    }
  });
};

// Función que coordina ambas llamadas
export const sendCodeToOpenAI = async (inputCode) => {
  try {
    // Primera llamada: análisis del código
    const analysisContent = await analyzeCodeWithOpenAI(inputCode);

    // Esperar un poco antes de la segunda llamada
    await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos

    // Segunda llamada: generación del código Mermaid detallado
    const mermaidCode = await generateMermaidCodeWithOpenAI(analysisContent);

    return mermaidCode;
  } catch (error) {
    console.error('Error in sendCodeToOpenAI:', error);
    throw error;
  }
};
