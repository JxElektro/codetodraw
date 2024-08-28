import { useState, useEffect, useRef } from 'react';
import { FaClipboard } from 'react-icons/fa';
import MermaidReact from 'mermaid-react';
import mermaid from 'mermaid';
import './App.css';

function App() {
  const [inputCode, setInputCode] = useState(`
    flowchart TD
      A[Start] --> B[Receive Input]
      B --> C[Process Input]
      C --> D[Show Result]
      D --> E[End]
  `);
  const [error, setError] = useState(null);
  const [renderedCode, setRenderedCode] = useState(inputCode);
  const textareaRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(inputCode).then(() => {
      alert("Code copied to clipboard!");
    });
  };

  const handleChange = (e) => {
    const newCode = e.target.value;
    setInputCode(newCode);
  };

  const validateMermaidCode = (code) => {
    try {
      mermaid.parse(code); // Intenta analizar el código de Mermaid
      return true; // Si se analiza correctamente, es válido
    } catch (err) {
      return false; // Si ocurre un error, no es válido
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputCode.trim()) {
        if (validateMermaidCode(inputCode)) {
          setRenderedCode(inputCode);
          setError(null);
        } else {
          setError("Syntax error in Mermaid code.");
        }
      } else {
        setError("Input code cannot be empty.");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputCode]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputCode]);

  return (
    <div className="container">
      <div className="grid">
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
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        </div>

        <div className="card code-input-card">
          <div className="card-header">
            <h2 className="card-title">Code Input</h2>
          </div>
          <div className="card-content">
            <textarea
              ref={textareaRef}
              className="textarea"
              placeholder="Enter your code here..."
              value={inputCode}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Diagram Preview</h2>
          </div>
          <div className="card-content">
            <div className="diagram-preview">
              <MermaidReact id="diagram" mmd={renderedCode} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
