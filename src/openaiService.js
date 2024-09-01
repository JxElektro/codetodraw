import axios from 'axios';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ASSISTANT_ID = import.meta.env.VITE_OPENAI_ASSISTANT_ID;
const ORGANIZATION_ID = import.meta.env.VITE_OPENAI_ORGANIZATION_ID;

if (!API_KEY || !ASSISTANT_ID) {
  throw new Error("API Key or Assistant ID is missing or invalid.");
}

const openai = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'OpenAI-Beta': 'assistants=v2',
    'OpenAI-Organization': ORGANIZATION_ID,
  },
});

const createThread = async () => {
  try {
    const response = await openai.post('/threads', {});
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

const addMessageToThread = async (THREAD_ID, content) => {
  if (!content || content.trim() === "") {
    throw new Error("Content is empty. Cannot send an empty message.");
  }

  try {
    const response = await openai.post(`/threads/${THREAD_ID}/messages`, {
      role: 'user',
      content: content,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

const waitForCompletion = async (THREAD_ID, RUN_ID) => {
  let runStatus;
  do {
    const response = await openai.get(`/threads/${THREAD_ID}/runs/${RUN_ID}`);
    runStatus = response.data.status;
    if (runStatus === 'queued' || runStatus === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } while (runStatus !== 'completed' && runStatus !== 'failed');
  return runStatus;
};

const runAssistant = async (THREAD_ID) => {
  try {
    const response = await openai.post(`/threads/${THREAD_ID}/runs`, {
      assistant_id: ASSISTANT_ID,
    });

    const runStatus = await waitForCompletion(THREAD_ID, response.data.id);

    if (runStatus === 'completed') {
      const messagesResponse = await openai.get(`/threads/${THREAD_ID}/messages`);
      const assistantMessage = messagesResponse.data.data.find(msg => msg.role === 'assistant');
      if (assistantMessage) {
        if (typeof assistantMessage.content === 'string') {
          return assistantMessage.content;
        } else if (Array.isArray(assistantMessage.content)) {
          return assistantMessage.content.map(item => item.text.value).join("\n");
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
    handleApiError(error);
    throw error;
  }
};

export const analyzeCodeWithOpenAI = async (inputCode) => {
  if (!inputCode || inputCode.trim === "") {
    throw new Error("Input code is empty. Cannot analyze empty code.");
  }

  try {
    const thread = await createThread();
    const THREAD_ID = thread.id;

    await addMessageToThread(THREAD_ID, `Please analyze the following code:\n\n${inputCode}`);

    const runResponse = await runAssistant(THREAD_ID);

    const responseCheck = await openai.get(`/threads/${THREAD_ID}/messages`);
    const assistantMessage = responseCheck.data.data.find(msg => msg.role === 'assistant');
    if (assistantMessage) {
      if (typeof assistantMessage.content === 'string') {
        return assistantMessage.content;
      } else if (Array.isArray(assistantMessage.content)) {
        return assistantMessage.content.map(item => item.text.value).join("\n");
      } else {
        return "No content returned. Please check the input code.";
      }
    } else {
      return "No assistant response found.";
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

const handleApiError = (error) => {
  if (error.response) {
    console.error("API Error:", error.response.status, error.response.data);
  } else {
    console.error("Error:", error.message);
  }
};