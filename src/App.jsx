import React, { useState, useRef, useEffect } from 'react';
import { FaClipboard } from 'react-icons/fa';
import mermaid from 'mermaid';
import Editor from '@monaco-editor/react';
import './App.css';
import { sendCodeToOpenAI } from './openaiService';

function App() {
  const [inputCode, setInputCode] = useState(''); // Estado inicial vacío
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const diagramRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(inputCode)
      .then(() => alert("Code copied to clipboard!"))
      .catch(err => console.error("Failed to copy code: ", err));
  };

  const handleSendToAI = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysisResponse = await sendCodeToOpenAI(inputCode);
      const mermaidResponse = await sendCodeToOpenAI(analysisResponse);
      const cleanMermaidCode = mermaidResponse.replace(/```mermaid|```/g, '').trim();
      setInputCode(cleanMermaidCode);
    } catch (error) {
      setError('Error communicating with OpenAI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const normalizedCode = inputCode.trim();
      if (normalizedCode === "") {
        setError("Input code cannot be empty.");
      } else if (validateMermaidCode(normalizedCode)) {
        setError(null);
        mermaid.render('mermaid-diagram', normalizedCode, (svgCode) => {
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svgCode;
          }
        });
      } else {
        setError("Syntax error in Mermaid code.");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputCode]);

  return (
    <div className="container">
      <div className="grid">
        {/* Code Input Card */}
        <div className="card code-input-card">
          <div className="card-header">
            <h2 className="card-title">Code Input</h2>
          </div>
          <div className="card-content">
            <Editor
              height="400px"
              language="javascript"
              theme="vs-dark"
              value={inputCode}
              onChange={(value) => setInputCode(value)}
            />
            <button 
              className="send-button" 
              onClick={handleSendToAI} 
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Send to AI'}
            </button>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>

        {/* Mermaid Diagram Code Card */}
        <div className="card code-card">
          <div className="card-header">
            <h2 className="card-title">Mermaid Diagram Code</h2>
          </div>
          <div className="card-content">
            <pre className="pre">
              <code>{inputCode}</code>
              <button className="copy-button" onClick={handleCopy}>
                <FaClipboard />
              </button>
            </pre>
          </div>
        </div>
      </div>

      <div className="diagram-preview-container">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Diagram Preview</h2>
          </div>
          <div className="card-content">
            <div className="diagram-preview" ref={diagramRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
