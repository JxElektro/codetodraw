import { useState, useRef, useEffect } from 'react';
import { FaClipboard } from 'react-icons/fa';
import mermaid from 'mermaid';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { Oval } from 'react-loader-spinner';
import './App.css';
import { analyzeCodeWithOpenAI, generateMermaidCodeWithOpenAI } from './openaiService';

function App() {
  // Estados para gestionar el código de entrada, análisis, código Mermaid, mensajes de error y estado de carga.
  const [inputCode, setInputCode] = useState('//Input code here...');
  const [analysis, setAnalysis] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Ref para gestionar el contenedor de renderización del diagrama Mermaid.
  const diagramRef = useRef(null);

  // Función para enviar el código a la IA y generar el análisis y el diagrama Mermaid.
  const handleSendToAI = async () => {
    setLoading(true); 
    setError(null);
    try {
      const analysisResponse = await analyzeCodeWithOpenAI(inputCode);
      setAnalysis(analysisResponse); 
      
      const mermaidResponse = await generateMermaidCodeWithOpenAI(analysisResponse);
      setMermaidCode(mermaidResponse); 
    } catch (error) {
      setError('Error communicating with OpenAI.');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para renderizar el diagrama Mermaid cuando cambia el código Mermaid.
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
    <>
      <header>
        <h1>CodeDraw</h1>
      </header>
      <div className="container">
        <div className="grid">
          <div className="card code-input-card">
            <div className="card-header">
              <h2 className="card-title">Code Input</h2>
            </div>
            <div className="card-content">
              <Editor
                height="500px"
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

          <div className="card mermaid-card">
            <div className="card-header">
              <h2 className="card-title">Mermaid Diagram Code</h2>
            </div>
            <div className="card-content">
              <pre className="pre">
                <code>{mermaidCode}</code>
              </pre>
              <button 
                className="copy-button" 
                onClick={() => navigator.clipboard.writeText(mermaidCode)}
              >
                <FaClipboard />
              </button>
            </div>
          </div>

          {analysis && (
            <div className="card analysis-card">
              <div className="card-header">
                <h2 className="card-title">Analysis</h2>
              </div>
              <div className="card-content">
                <ReactMarkdown className="markdown-body">{analysis}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="loading-container">
            <Oval
              color="#007bff"
              height={100}
              width={100}
            />
          </div>
        )}

        {!loading && mermaidCode && (
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
        )}
      </div>
    </>
  );
}

export default App;
