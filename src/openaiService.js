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

export const sendCodeToOpenAI = async (inputCode) => {
  console.log("Input Code:", inputCode);

  try {
    const response = await openai.post('/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Please analyze the following input like an expert programmer and provide the corresponding Mermaid code only:\n\n${inputCode}`
      }],
      max_tokens: 1000,
      temperature: 0.5,
    });

    console.log("API Response:", response.data);

    if (response.data.choices.length > 0) {
      const messageContent = response.data.choices[0]?.message.content.trim();
      console.log("Message Content:", messageContent);
      return messageContent; // Solo el código Mermaid
    } else {
      throw new Error("No content returned from OpenAI.");
    }
  } catch (error) {
    console.error('Error sending code to OpenAI:', error);
    throw error;
  }
};
