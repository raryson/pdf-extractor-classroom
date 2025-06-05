// convert.js
const fs          = require('fs/promises');
const path        = require('path');
const pdfParse    = require('pdf-parse');
const { convert } = require('html-to-text');
const fetch       = global.fetch || require('node-fetch');

// Função que recebe um texto bruto e remove as palavras indesejadas
function filterText(text) {
  // Regex para localizar as palavras separadas por fronteiras (\b), case-insensitive:
  // hpc, et, al, access, section, figure, like
  const blacklist = /\b(?:hpc|et|al|access|section|figure|like|based|used|new|using|text|number|function|pp|approach|use|real|user|attribute)\b/gi;

  // 1) Remove todas as ocorrências
  let cleaned = text.replace(blacklist, '');

  // 2) Colapsa espaços duplos (ou mais) em um único espaço
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // 3) Remove espaços em branco no início/fim de linhas
  cleaned = cleaned.split('\n')
    .map(line => line.trimEnd())
    .join('\n');

  return cleaned;
}

(async () => {
  // 1) Garante que a pasta txt/ exista
  await fs.mkdir('txt', { recursive: true });

  // 2) Lista de tarefas a converter
  const tasks = [
    { type: 'local-pdf',  source: 'pdf/artigo1.pdf'    },
    { type: 'local-pdf',  source: 'pdf/artigo2.pdf'       },
    { type: 'local-pdf',  source: 'pdf/artigo3.pdf'  },
    { type: 'local-pdf',  source: 'pdf/artigo4.pdf'},
    { type: 'local-pdf',  source: 'pdf/artigo5.pdf'   },
    { type: 'local-pdf',  source: 'pdf/artigo6.pdf'  },
    { type: 'local-pdf',  source: 'pdf/artigo7.pdf'   },
    { type: 'local-pdf',  source: 'pdf/artigo8.pdf'   },
    { type: 'local-pdf',  source: 'pdf/artigo9.pdf'   },
    { type: 'local-pdf',  source: 'pdf/artigo10.pdf'   }
    // Se quiser converter HTML adicional, descomente/adicione aqui:
    //{ type: 'url-html', source: 'https://www.mdpi.com/2504-2289/4/2/7' },
    //{ type: 'url-html', source: 'https://www.mdpi.com/2075-4426/12/9/1359' },
  ];

  // Acumulador para todo o texto de PDFs
  let allPdfsText = '';

  for (const task of tasks) {
    try {
      let plainText, fileName;

      if (task.type === 'local-pdf') {
        // 3A) PDF local: lê do disco, extrai texto, filtra e acumula
        const filePath = path.resolve(task.source);
        console.log(`→ Processando PDF local: ${filePath}`);

        const dataBuffer = await fs.readFile(filePath);
        const parsed      = await pdfParse(dataBuffer);
        let rawText      = parsed.text;

        // Remove palavras indesejadas
        plainText = filterText(rawText);

        // Para o arquivo único: coloca delimitadores e texto filtrado
        allPdfsText += plainText;

        // Nome base sem extensão
        fileName = path.basename(task.source, path.extname(task.source));

      } else if (task.type === 'url-html') {
        // 3B) HTML remoto: faz fetch, converte para texto, filtra
        const url = task.source;
        console.log(`→ Baixando e convertendo HTML: ${url}`);

        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`   ⚠ Falha ao baixar ${url}: ${res.status}`);
          continue;
        }
        const html   = await res.text();
        let rawText  = convert(html, { wordwrap: 120 });

        // Remove palavras indesejadas
        plainText = filterText(rawText);

        // Gera nome simples a partir da URL
        fileName = url
          .replace(/^https?:\/\//, '')
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .replace(/-$/, '');
      }

      // 4) Grava cada .txt individual
      const outPath = path.join('txt', `${fileName}.txt`);
      await fs.writeFile(outPath, plainText, 'utf8');
      console.log(`   ✔ Salvo em: ${outPath}`);

    } catch (err) {
      console.error(`   ✘ Erro na task ${JSON.stringify(task)}:`, err);
    }
  }

  // 5) Grava o arquivo único com todo o texto dos PDFs (já filtrado)
  const combinedPath = path.join('txt', 'all_pdfs.txt');
  await fs.writeFile(combinedPath, allPdfsText.trimStart(), 'utf8');
  console.log(`\n🎉 Todos os PDFs concatenados e filtrados em: ${combinedPath}`);
})();
