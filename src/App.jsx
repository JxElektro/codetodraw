import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaClipboard } from 'react-icons/fa'; // Importar ícono de copiar

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
  display: flex; /* Usar flexbox en lugar de grid */
  gap: 2rem;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%; /* Asegurar que use el ancho completo */
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
`;

const CodeCard = styled(Card)`
  flex-basis: 400px; /* Ancho fijo para la tarjeta de código */
`;

const PreviewCard = styled(Card)`
  flex-grow: 1; /* Tarjeta de vista previa ocupa el espacio restante */
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
`;

const CardContent = styled.div`
  width: 100%;
  position: relative; /* Para posicionar el botón de copiar */
`;

const Pre = styled.pre`
  width: 80%; /* Ancho del snippet ajustado */
  height: calc(100vh - 200px); /* Aprovechar el espacio vertical disponible */
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
  color: #333;
  overflow: auto;
  font-family: 'Courier New', Courier, monospace;
  margin: 0 auto; /* Centrar el snippet */

  /* Ajuste para evitar que se corte el texto */
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const Textarea = styled.textarea`
  width: 80%; /* Ancho del área de entrada ajustado */
  height: 8rem; /* Altura del área de entrada ajustada */
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  outline: none;
  margin: 1rem auto 0; /* Añadir margen hacia arriba y centrar el área de entrada */

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
  color: gray; /* Cambiar el color del ícono a gris */
  transition: color 0.2s;
  padding: 1rem
`;

const DiagramPreview = styled.div`
  height: 30rem; /* Aumentar altura del diagrama */
  width: 100%; /* Asegurar que cubra más a lo ancho */
  background: #f0f0f0;
  border-radius: 8px;
  position: relative; /* Para mantener el botón de copiar dentro de la tarjeta */
`;

function App() {
  const [mermaidCode, setMermaidCode] = useState("graph TD;\nA-->B;\nA-->C;\nB-->D;\nC-->D;");
  const [inputCode, setInputCode] = useState("");

  useEffect(() => {
    const mermaidContainer = document.getElementById("mermaid-container");
    if (mermaid && mermaidContainer) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
      });
      mermaid.contentLoaded();
      mermaid.render("mermaid-container", mermaidCode, () => {
        console.log("Mermaid diagram rendered");
      });
    }
  }, [mermaidCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(mermaidCode).then(() => {
      alert("Code copied to clipboard!");
    });
  };

  return (
    <Container>
      <Grid>
        {/* Mermaid Diagram Code Snippet */}
        <CodeCard>
          <CardHeader>
            <CardTitle>Mermaid Diagram Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Pre>
              <code>{mermaidCode}</code>
              <CopyButton onClick={handleCopy}>
                <FaClipboard />
              </CopyButton>
            </Pre>
          </CardContent>
        </CodeCard>

        {/* Mermaid Diagram Preview */}
        <PreviewCard>
          <CardHeader>
            <CardTitle>Diagram Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <DiagramPreview>
              <div id="mermaid-container" className="aspect-[4/3] w-full bg-background rounded-lg overflow-hidden"></div>
            </DiagramPreview>
          </CardContent>
        </PreviewCard>
      </Grid>

      {/* Espacio entre componentes */}
      <div style={{ marginTop: '2rem' }} />

      {/* Input para Código de Programación */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        <Card>
          <CardHeader>
            <CardTitle>Code Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your code here..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

export default App;
