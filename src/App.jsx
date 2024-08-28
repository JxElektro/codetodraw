import { useState, useEffect, useRef } from 'react';
import { FaClipboard } from 'react-icons/fa';
import mermaid from 'mermaid';
import './App.css';
import { sendCodeToOpenAI } from './openaiService'; // Asegúrate de que este archivo esté configurado correctamente

function App() {
  const [inputCode, setInputCode] = useState(`
    // Insert your code here
  `);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Estado para manejar la carga
  const textareaRef = useRef(null);
  const diagramRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(inputCode)
      .then(() => alert("Code copied to clipboard!"))
      .catch(err => console.error("Failed to copy code: ", err));
  };

  const handleChange = (e) => {
    setInputCode(e.target.value);
  };

  const validateMermaidCode = (code) => {
    try {
      mermaid.parse(code);
      return true;
    } catch {
      return false;
    }
  };

  const handleSendToAI = async () => {
    setLoading(true); // Iniciar carga
    setError(null); // Limpiar cualquier error anterior
    try {
      // Primera llamada a OpenAI para análisis del código
      const analysisResponse = await sendCodeToOpenAI(inputCode);
      
      // Segunda llamada a OpenAI para convertir el análisis en código Mermaid
      const mermaidResponse = await sendCodeToOpenAI(analysisResponse);

      // Eliminar encabezados de markdown y espacios adicionales del código Mermaid
      const cleanMermaidCode = mermaidResponse.replace(/```mermaid|```/g, '').trim();

      setInputCode(cleanMermaidCode); // Actualiza el input con el código limpio
    } catch (error) {
      setError('Error communicating with OpenAI.');
    } finally {
      setLoading(false); // Finalizar carga
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
            {error && <p className="error-message">{error}</p>}
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
              id="mermaidCodeInput"
              name="mermaidCode"
              placeholder="Enter your code here..."
              value={inputCode}
              onChange={handleChange}
              rows={4}
            />
            <button 
              className="send-button" 
              onClick={handleSendToAI} 
              disabled={loading} // Deshabilitar el botón mientras carga
            >
              {loading ? 'Loading...' : 'Send to AI'} {/* Mostrar texto de carga */}
            </button>
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
