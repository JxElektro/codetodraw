import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaClipboard } from 'react-icons/fa';
import MermaidReact from 'mermaid-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  background: rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
  font-family: 'Arial', sans-serif;
`;

const Grid = styled.div`
  display: flex;
  gap: 2rem;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  transition: transform 0.2s, box-shadow 0.2s;
  flex-grow: 1;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
`;

const CodeCard = styled(Card)`
  flex-basis: 400px;
`;

const CodeInputCard = styled(Card)`
  flex-grow: 1;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
`;

const CardContent = styled.div`
  width: 100%;
  position: relative;
`;

const Pre = styled.pre`
  width: 90%;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
  color: #333;
  overflow: auto;
  font-family: 'Courier New', Courier, monospace;
  margin: 0 auto;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const Textarea = styled.textarea`
  width: 90%;
  height: auto; /* Permitir que crezca automáticamente */
  min-height: 6rem; /* Altura mínima */
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  outline: none;
  margin: 1rem auto 0;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  }
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  font-size: 1.2rem;
  color: gray;
  transition: color 0.2s;
  padding: 1rem;
`;

const DiagramPreview = styled.div`
  width: 100%;
  background: #f0f0f0;
  border-radius: 8px;
  position: relative;
`;

function App() {
  const [inputCode, setInputCode] = useState("graph TD;\nA-->B;\nA-->C;\nB-->D;\nC-->D;");
  const textareaRef = useRef(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(inputCode).then(() => {
      alert("Code copied to clipboard!");
    });
  };

  const handleChange = (e) => {
    setInputCode(e.target.value);
  };

  // Ajustar la altura del textarea dinámicamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Resetea la altura
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Ajusta a la altura del contenido
    }
  }, [inputCode]);

  return (
    <Container>
      <Grid>
        <CodeCard>
          <CardHeader>
            <CardTitle>Mermaid Diagram Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Pre>
              <code>{inputCode}</code>
              <CopyButton onClick={handleCopy}>
                <FaClipboard />
              </CopyButton>
            </Pre>
          </CardContent>
        </CodeCard>

        <CodeInputCard>
          <CardHeader>
            <CardTitle>Code Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              ref={textareaRef}
              placeholder="Enter your code here..."
              value={inputCode}
              onChange={handleChange}
            />
          </CardContent>
        </CodeInputCard>
      </Grid>

      <div style={{ marginTop: '2rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        <Card>
          <CardHeader>
            <CardTitle>Diagram Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <DiagramPreview>
              <MermaidReact id="diagram" mmd={inputCode} />
            </DiagramPreview>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

export default App;
