import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ASSISTANT_ID = import.meta.env.VITE_OPENAI_ASSISTANT_ID;
const ORGANIZATION_ID = import.meta.env.VITE_OPENAI_ORGANIZATION_ID;

if (!API_KEY || !ASSISTANT_ID) {
  throw new Error("API Key or Assistant ID is missing or invalid.");
}

console.log("API Key:", API_KEY);
console.log("Assistant ID:", ASSISTANT_ID);
console.log("Organization ID:", ORGANIZATION_ID);

const openai = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'OpenAI-Beta': 'assistants=v2',
    'OpenAI-Organization': ORGANIZATION_ID,
  },
});

const retryWithBackoff = async (fn, retries = 3, delay = 2000) => {
  try {
    console.log("Attempting function execution, retries left:", retries);
    const result = await fn();
    console.log("Function executed successfully:", result);
    return result;
  } catch (error) {
    console.error("Error during function execution:", error.message);
    if (retries > 0 && error.response?.status === 429) {
      console.log("Rate limit hit, retrying after delay:", delay);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
};

// Función para crear un Thread
const createThread = async () => {
  try {
    console.log("Creating a new thread...");
    const response = await openai.post('/threads', {});
    console.log("Thread created successfully:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    throw error;
  }
};

// Función para agregar un mensaje al Thread
const addMessageToThread = async (THREAD_ID, content) => {
  if (!content || content.trim() === "") {
    throw new Error("Content is empty. Cannot send an empty message.");
  }

  try {
    console.log("Adding message to thread:", THREAD_ID);
    const response = await openai.post(`/threads/${THREAD_ID}/messages`, {
      role: 'user',
      content: content,
    });
    console.log("Message added successfully:", response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    throw error;
  }
};

// Función para esperar a que se complete la ejecución del asistente
const waitForCompletion = async (THREAD_ID, RUN_ID) => {
  let runStatus;
  do {
    console.log("Checking run status for:", RUN_ID);
    const response = await openai.get(`/threads/${THREAD_ID}/runs/${RUN_ID}`);
    runStatus = response.data.status;
    console.log("Current run status:", runStatus);
    if (runStatus === 'queued' || runStatus === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 2000));  // Esperar 2 segundos antes de verificar nuevamente
    }
  } while (runStatus !== 'completed' && runStatus !== 'failed');
  return runStatus;
};

// Función para ejecutar el Assistant en un Thread
const runAssistant = async (THREAD_ID) => {
  try {
    console.log("Running assistant for thread:", THREAD_ID);
    const response = await openai.post(`/threads/${THREAD_ID}/runs`, {
      assistant_id: ASSISTANT_ID,
    });

    console.log("Assistant run initiated:", response.data);

    const runStatus = await waitForCompletion(THREAD_ID, response.data.id);

    if (runStatus === 'completed') {
      console.log("Assistant run completed, fetching messages...");
      const messagesResponse = await openai.get(`/threads/${THREAD_ID}/messages`);
      const assistantMessage = messagesResponse.data.data.find(msg => msg.role === 'assistant');
      if (assistantMessage) {
        console.log("Assistant message found:", assistantMessage);
        if (typeof assistantMessage.content === 'string') {
          return assistantMessage.content;
        } else if (Array.isArray(assistantMessage.content)) {
          const processedContent = assistantMessage.content.map(item => item.text.value).join("\n");
          return processedContent;
        } else {
          return "Unexpected content format. Please check the logs for more details.";
        }
      } else {
        return "No assistant response found.";
      }
    } else {
      return "Run failed or was cancelled.";
    }
  } catch (error) {
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    throw error;
  }
};

// Función para realizar el análisis del código usando OpenAI
export const analyzeCodeWithOpenAI = async (inputCode) => {
  if (!inputCode || inputCode.trim === "") {
    throw new Error("Input code is empty. Cannot analyze empty code.");
  }

  try {
    console.log("Starting code analysis...");
    const thread = await createThread();
    const THREAD_ID = thread.id;

    console.log("Thread ID:", THREAD_ID);

    await addMessageToThread(THREAD_ID, `Please analyze the following code:\n\n${inputCode}`);

    const runResponse = await runAssistant(THREAD_ID);
    console.log("Assistant run response:", runResponse);

    const responseCheck = await openai.get(`/threads/${THREAD_ID}/messages`);
    const assistantMessage = responseCheck.data.data.find(msg => msg.role === 'assistant');
    if (assistantMessage) {
      console.log("Final assistant message found:", assistantMessage);
      if (typeof assistantMessage.content === 'string') {
        return assistantMessage.content;
      } else if (Array.isArray(assistantMessage.content)) {
        const processedContent = assistantMessage.content.map(item => item.text.value).join("\n");
        return processedContent;
      } else {
        return "No content returned. Please check the input code.";
      }
    } else {
      return "No assistant response found.";
    }
  } catch (error) {
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    throw error;
  }
};
