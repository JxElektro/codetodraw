import { useState, useRef, useEffect } from 'react';
import { FaClipboard } from 'react-icons/fa';
import mermaid from 'mermaid';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { Oval } from 'react-loader-spinner';
import './App.css';
import { analyzeCodeWithOpenAI } from './openaiService';

function App() {
  const [inputCode, setInputCode] = useState('//Input code here...\n');
  const [overview, setOverview] = useState('');
  const [componentBreakdown, setComponentBreakdown] = useState({});
  const [functionalFlow, setFunctionalFlow] = useState([]);
  const [possibleImprovements, setPossibleImprovements] = useState([]);
  const [documentation, setDocumentation] = useState({});
  const [mermaidDiagram, setMermaidDiagram] = useState('');
  const [optimizationPotential, setOptimizationPotential] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInputTouched, setIsInputTouched] = useState(false);

  const diagramRef = useRef(null);

  const handleSendToAI = async () => {
    setLoading(true);
    setError(null);
    try {
      const analysisResponse = await analyzeCodeWithOpenAI(inputCode);

      // Intentar parsear el JSON recibido
      let analysisData;
      try {
        analysisData = JSON.parse(analysisResponse);
      } catch (jsonError) {
        throw new Error('Error parsing JSON response: ' + jsonError.message);
      }

      // Destructuring the response to fill the different states
      setOverview(analysisData.overview);
      setComponentBreakdown(analysisData.component_breakdown);
      setFunctionalFlow(analysisData.functional_flow);
      setPossibleImprovements(analysisData.possible_improvements);
      setDocumentation(analysisData.documentation);

      // Set performance metrics if available
      if (analysisData.performance_metrics) {
        setOptimizationPotential(analysisData.performance_metrics.optimization_potential);
      }

      // Set the Mermaid diagram code directly
      setMermaidDiagram(analysisData.mermaid_diagram);
    } catch (err) {
      console.error(err);
      setError('Error comunicando con OpenAI: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mermaidDiagram) {
      try {
        mermaid.render('mermaid-diagram', mermaidDiagram, (svgCode) => {
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svgCode;
          }
        });
      } catch (e) {
        console.error('Error rendering Mermaid diagram: ', e);
        setError('Error rendering Mermaid diagram: ' + e.message);
      }
    }
  }, [mermaidDiagram]);

  const handleEditorFocus = () => {
    if (!isInputTouched) {
      setInputCode('');
      setIsInputTouched(true);
    }
  };

  return (
    <>
      <header>
        <h1>CodeToDraw</h1>
      </header>
      <div className="container">
        <div className="grid">
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
                onFocus={handleEditorFocus}
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
                <code>{mermaidDiagram}</code>
              </pre>
              <button 
                className="copy-button" 
                onClick={() => navigator.clipboard.writeText(mermaidDiagram)}
              >
                <FaClipboard />
              </button>
            </div>
          </div>

          {overview && (
            <div className="card analysis-card">
              <div className="card-header">
                <h2 className="card-title">Overview</h2>
              </div>
              <div className="card-content">
                <ReactMarkdown className="markdown-body">{overview}</ReactMarkdown>
              </div>
            </div>
          )}

          {Object.keys(componentBreakdown).length > 0 && (
            <div className="card analysis-card">
              <div className="card-header">
                <h2 className="card-title">Component Breakdown</h2>
              </div>
              <div className="card-content">
                <pre>{JSON.stringify(componentBreakdown, null, 2)}</pre>
              </div>
            </div>
          )}

          {functionalFlow.length > 0 && (
            <div className="card analysis-card">
              <div className="card-header">
                <h2 className="card-title">Functional Flow</h2>
              </div>
              <div className="card-content">
                <pre>{functionalFlow.join('\n')}</pre>
              </div>
            </div>
          )}

          {possibleImprovements.length > 0 && (
            <div className="card analysis-card">
              <div className="card-header">
                <h2 className="card-title">Possible Improvements</h2>
              </div>
              <div className="card-content">
                <pre>{possibleImprovements.join('\n')}</pre>
              </div>
            </div>
          )}

          {Object.keys(documentation).length > 0 && (
            <div className="card analysis-card">
              <div className="card-header">
                <h2 className="card-title">Documentation</h2>
              </div>
              <div className="card-content">
                <pre>{JSON.stringify(documentation, null, 2)}</pre>
              </div>
            </div>
          )}

          {optimizationPotential && optimizationPotential.current && optimizationPotential.optimized && (
            <div className="card analysis-card">
              <div className="card-header">
                <h2 className="card-title">Optimization Potential</h2>
              </div>
              <div className="card-content">
                <pre>Current: {optimizationPotential.current}</pre>
                <pre>Optimized: {optimizationPotential.optimized}</pre>
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

        {!loading && mermaidDiagram && (
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
