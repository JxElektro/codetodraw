import React, { useState, useRef, useEffect } from 'react';
import { FaClipboard } from 'react-icons/fa';
import mermaid from 'mermaid';
import Editor from '@monaco-editor/react';
import './App.css';
import { analyzeCodeWithOpenAI, generateMermaidCodeWithOpenAI } from './openaiService';

function App() {
  const [inputCode, setInputCode] = useState(''); // Estado para el código de entrada
  const [analysis, setAnalysis] = useState(''); // Estado para guardar el análisis
  const [mermaidCode, setMermaidCode] = useState(''); // Estado para guardar el código Mermaid
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const diagramRef = useRef(null);

  const handleSendToAI = async () => {
    setLoading(true);
    setError(null);
    try {
      // Realizamos la primera llamada para obtener el análisis
      const analysisResponse = await analyzeCodeWithOpenAI(inputCode);
      setAnalysis(analysisResponse); // Guardamos el análisis recibido

      // Luego generamos el código Mermaid a partir del análisis
      const mermaidResponse = await generateMermaidCodeWithOpenAI(analysisResponse);
      setMermaidCode(mermaidResponse); // Guardamos el código Mermaid recibido
    } catch (error) {
      setError('Error communicating with OpenAI.');
    } finally {
      setLoading(false); // Terminamos la carga
    }
  };

  useEffect(() => {
    if (mermaidCode) {
      try {
        mermaid.render('mermaid-diagram', mermaidCode, (svgCode) => {
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svgCode;
          }
        });
      } catch (e) {
        setError('Error rendering Mermaid diagram.');
      }
    }
  }, [mermaidCode]);

  return (
    <div className="container">
      <div className="grid">
        {/* Tarjeta de entrada de código */}
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
              onChange={(value) => setInputCode(value)} // Actualiza el estado cuando cambia el código
            />
            <button 
              className="send-button" 
              onClick={handleSendToAI} 
              disabled={loading} // Desactiva el botón si está cargando
            >
              {loading ? 'Loading...' : 'Send to AI'} {/* Muestra un mensaje de carga si está activo */}
            </button>
            {error && <p className="error-message">{error}</p>} {/* Muestra un mensaje de error si existe */}
          </div>
        </div>

        {/* Tarjeta de análisis recibido */}
        <div className="card analysis-card">
          <div className="card-header">
            <h2 className="card-title">Analysis</h2>
          </div>
          <div className="card-content">
            <pre className="pre">
              <code>{analysis}</code> {/* Muestra el análisis recibido */}
              <button className="copy-button" onClick={() => navigator.clipboard.writeText(analysis)}>
                <FaClipboard /> {/* Botón para copiar el análisis al portapapeles */}
              </button>
            </pre>
          </div>
        </div>

        {/* Tarjeta de código Mermaid */}
        <div className="card mermaid-card">
          <div className="card-header">
            <h2 className="card-title">Mermaid Diagram Code</h2>
          </div>
          <div className="card-content">
            <pre className="pre">
              <code>{mermaidCode}</code> {/* Muestra el código Mermaid */}
              <button className="copy-button" onClick={() => navigator.clipboard.writeText(mermaidCode)}>
                <FaClipboard /> {/* Botón para copiar el código al portapapeles */}
              </button>
            </pre>
          </div>
        </div>
      </div>

      {/* Mostrar el preview solo si hay código Mermaid */}
      {loading && <div className="loading">Loading diagram...</div>}
      {!loading && mermaidCode && (
        <div className="diagram-preview-container">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Diagram Preview</h2>
            </div>
            <div className="card-content">
              <div className="diagram-preview" ref={diagramRef}></div> {/* Contenedor del diagrama renderizado */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
