import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || "http://localhost:3000";

async function importCSV(filePath) {
  if (!filePath) {
    console.error("Erro: Informe o caminho do arquivo CSV");
    console.log("Uso: node src/import-csv.js <caminho-do-arquivo.csv>");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Erro: Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    console.error(
      "Erro: O arquivo CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados"
    );
    process.exit(1);
  }

  const [header, ...dataLines] = lines;
  const [headerTitle, headerDescription] = header
    .split(",")
    .map((h) => h.trim());

  if (headerTitle !== "title" || headerDescription !== "description") {
    console.error("Erro: O cabeçalho do CSV deve ser: title,description");
    process.exit(1);
  }

  console.log(`Importando ${dataLines.length} tarefas...`);

  let imported = 0;
  let errors = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const rowNumber = i + 2;

    const [title, description] = parseCSVLine(line);

    if (!title || !description) {
      errors.push({
        row: rowNumber,
        message: "Campos title e description são obrigatórios",
      });
      continue;
    }

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        imported++;
        console.log(`[${rowNumber}] Tarefa importada: ${title}`);
      } else {
        const error = await response.json();
        errors.push({
          row: rowNumber,
          message: error.message || "Erro ao criar tarefa",
        });
      }
    } catch (error) {
      errors.push({ row: rowNumber, message: error.message });
    }
  }

  console.log("\n");
  console.log(`Importação concluída:`);
  console.log(`- Importadas: ${imported}`);
  console.log(`- Erros: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\nDetalhes dos erros:");
    errors.forEach((err) => {
      console.log(`  Linha ${err.row}: ${err.message}`);
    });
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

const filePath = process.argv[2];
importCSV(filePath);
