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

const createThread = async (setStatusMessage) => {
  try {
    setStatusMessage("Creating a new thread...");
    console.log("Creating a new thread...");
    const response = await openai.post('/threads', {});
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

const addMessageToThread = async (THREAD_ID, content, setStatusMessage) => {
  if (!content || content.trim() === "") {
    throw new Error("Content is empty. Cannot send an empty message.");
  }

  try {
    setStatusMessage("Adding message to thread...");
    console.log("Adding message to thread:", THREAD_ID);
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

const waitForCompletion = async (THREAD_ID, RUN_ID, setStatusMessage) => {
  let runStatus;
  do {
    setStatusMessage("Waiting for completion...");
    const response = await openai.get(`/threads/${THREAD_ID}/runs/${RUN_ID}`);
    runStatus = response.data.status;
    console.log("Current run status:", runStatus);
    if (runStatus === 'queued' || runStatus === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } while (runStatus !== 'completed' && runStatus !== 'failed');
  return runStatus;
};

const runAssistant = async (THREAD_ID, setStatusMessage) => {
  try {
    setStatusMessage("Running assistant...");
    console.log("Running assistant for thread:", THREAD_ID);
    const response = await openai.post(`/threads/${THREAD_ID}/runs`, {
      assistant_id: ASSISTANT_ID,
    });

    const runStatus = await waitForCompletion(THREAD_ID, response.data.id, setStatusMessage);

    if (runStatus === 'completed') {
      setStatusMessage("Assistant run completed, fetching messages...");
      console.log("Assistant run completed, fetching messages...");
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

export const analyzeCodeWithOpenAI = async (inputCode, setStatusMessage) => {
  if (!inputCode || inputCode.trim() === "") {
    throw new Error("Input code is empty. Cannot analyze empty code.");
  }

  try {
    setStatusMessage("Starting code analysis...");
    console.log("Starting code analysis...");
    const thread = await createThread(setStatusMessage);
    const THREAD_ID = thread.id;

    setStatusMessage("Thread created, adding message...");
    console.log("Thread ID:", THREAD_ID);

    await addMessageToThread(THREAD_ID, `Please analyze the following code:\n\n${inputCode}`, setStatusMessage);

    setStatusMessage("Running assistant...");
    const runResponse = await runAssistant(THREAD_ID, setStatusMessage);

    setStatusMessage("Fetching final response...");
    const responseCheck = await openai.get(`/threads/${THREAD_ID}/messages`);
    const assistantMessage = responseCheck.data.data.find(msg => msg.role === 'assistant');
    if (assistantMessage) {
      console.log("Final assistant message found:", assistantMessage);
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
  } finally {
    setStatusMessage("");
  }
};

const handleApiError = (error) => {
  if (error.response) {
    console.error("API Error:", error.response.status, error.response.data);
  } else {
    console.error("Error:", error.message);
  }
};
