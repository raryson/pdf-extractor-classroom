# Leitor e Conversor de PDFs para TXT

Este projeto consiste em um script Node.js que percorre uma pasta com arquivos PDF, converte cada um deles para arquivos de texto (.txt) e gera, além dos textos individuais, um único arquivo com a soma de todo o conteúdo convertido. Durante a conversão, algumas palavras indesejadas são removidas automaticamente.

---

## Funcionalidades

* **Leitura de todos os arquivos PDF** em um diretório específico.
* **Conversão de cada PDF** em um arquivo de texto separado.
* **Criação de um arquivo consolidado** contendo o texto de todos os PDFs juntos.
* **Remoção de palavras específicas** (“hpc”, “et”, “al”, “access”, “section”, “figure”, “like”) durante a extração de texto.

---

## Estrutura de Pastas

```text
.
├── input_pdfs/           # Pasta onde você coloca os arquivos PDF de origem
│   ├── arquivo1.pdf
│   ├── arquivo2.pdf
│   └── ...
├── output_txts/          # Pasta onde os arquivos TXT individuais serão gerados
│   ├── arquivo1.txt
│   ├── arquivo2.txt
│   └── ...
├── combined.txt          # Arquivo gerado contendo todo o texto dos PDFs unidos
├── convert.js            # Script principal de conversão
└── package.json          # Dependências do Node.js
```

* **input\_pdfs/**: Coloque aqui todos os PDFs que deseja converter.
* **output\_txts/**: Esta pasta será criada automaticamente (caso não exista) e conterá um `.txt` correspondente para cada PDF.
* **combined.txt**: Ao final da execução, este arquivo conterá o texto concatenado de todos os PDFs (com as palavras especificadas removidas).
* **convert.js**: Script Node.js que realiza a leitura e conversão.
* **package.json**: Gerenciado pelo npm para instalar as dependências necessárias.

---

## Pré-requisitos

* **Node.js** (versão 12 ou superior)
* **npm** (incluído no instalador do Node.js)

---

## Instalação

1. **Clone ou baixe este repositório**

   ```bash
   git clone https://seu-repositorio-git.git
   cd nome-da-pasta
   ```

2. **Inicialize o projeto e instale dependências**

   ```bash
   npm init -y
   npm install pdf-parse
   ```

   * O pacote **pdf-parse** é usado para extrair texto dos arquivos PDF.

3. **Crie (ou garanta a existência de) as pastas**

   * Dentro da pasta do projeto, certifique-se de criar a pasta `input_pdfs/` e a pasta `output_txts/`.
   * Caso a pasta `output_txts/` não exista, o script irá criá-la automaticamente.

---

## Uso

1. **Coloque seus arquivos PDF**

   * Copie ou mova todos os arquivos `.pdf` que deseja processar para dentro de `input_pdfs/`.

2. **Execute o script de conversão**
   No terminal, dentro da pasta do projeto, rode:

   ```bash
   node convert.js
   ```

   * O script irá:

     1. Percorrer **todos** os PDFs dentro de `input_pdfs/`.
     2. Converter cada PDF em um arquivo `.txt` que será salvo em `output_txts/` com o mesmo nome-base do PDF.
     3. Remover, do texto extraído, as ocorrências das palavras:

        * `hpc`
        * `et`
        * `al`
        * `access`
        * `section`
        * `figure`
        * `like`
     4. Acrescentar o conteúdo limpo (sem essas palavras) ao final de `combined.txt`, garantindo um arquivo único com tudo concatenado.

3. **Verifique os resultados**

   * Em **output\_txts/**, haverá um arquivo `.txt` para cada PDF original.
   * Na raiz do projeto, estará o arquivo **combined.txt**, com a união de todos os textos processados.

---

## Detalhes de Implementação

### Dependências

* **pdf-parse**: biblioteca que faz a extração de texto a partir de buffers de PDF.
* **fs** e **path** (módulos nativos do Node.js): para manipulação de sistema de arquivos e caminhos.

### Principais Trechos do Código (`convert.js`)

```js
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

// Palavras a serem removidas (Case-insensitive)
const palavrasRemover = ["hpc", "et", "al", "access", "section", "figure", "like"];

async function converterPdfParaTxt(caminhoPdf, caminhoTxt) {
  const buffer = fs.readFileSync(caminhoPdf);
  const dados = await pdfParse(buffer);
  let texto = dados.text;

  // Remove as palavras indesejadas (regex global, case-insensitive)
  palavrasRemover.forEach(palavra => {
    const regex = new RegExp(`\\b${palavra}\\b`, "gi");
    texto = texto.replace(regex, "");
  });

  fs.writeFileSync(caminhoTxt, texto, { encoding: "utf8" });
  return texto;
}

async function main() {
  const pastaInput = path.join(__dirname, "input_pdfs");
  const pastaOutput = path.join(__dirname, "output_txts");
  const caminhoCombined = path.join(__dirname, "combined.txt");

  // Cria pasta de saída, se não existir
  if (!fs.existsSync(pastaOutput)) {
    fs.mkdirSync(pastaOutput);
  }

  // Se já existir um combined.txt anterior, apaga para começar do zero
  if (fs.existsSync(caminhoCombined)) {
    fs.unlinkSync(caminhoCombined);
  }

  const arquivos = fs.readdirSync(pastaInput).filter(file =>
    path.extname(file).toLowerCase() === ".pdf"
  );

  for (const arquivo of arquivos) {
    const caminhoPdf = path.join(pastaInput, arquivo);
    const nomeBase = path.parse(arquivo).name;
    const caminhoTxt = path.join(pastaOutput, `${nomeBase}.txt`);

    console.log(`Convertendo "${arquivo}" → "${nomeBase}.txt"`);
    const textoConvertido = await converterPdfParaTxt(caminhoPdf, caminhoTxt);

    // Acrescenta o texto convertido (já limpo) no final de combined.txt
    fs.appendFileSync(caminhoCombined, textoConvertido + "\n\n", {
      encoding: "utf8",
    });
  }

  console.log("Conversão finalizada!");
  console.log(`- Arquivos individuais em: ${pastaOutput}/`);
  console.log(`- Arquivo consolidado: ${caminhoCombined}`);
}

// Executa o processo
main().catch(err => {
  console.error("Erro durante a conversão:", err);
});
```

* **Leitura de PDFs**: `fs.readFileSync(caminhoPdf)` carrega todo o arquivo em buffer.
* **Extração de texto**: `await pdfParse(buffer)` devolve um objeto com o texto bruto em `dados.text`.
* **Remoção de palavras**: Para cada palavra na lista `palavrasRemover`, é criada uma expressão regular que busca essa palavra isolada (fronteiras de palavra `\b`) e a remove de forma global e case-insensitive (`gi`).
* **Geração de arquivos TXT**: `fs.writeFileSync(caminhoTxt, texto, "utf8")`.
* **Construção de `combined.txt`**: a cada iteração, o texto limpo é anexado ao final do arquivo `combined.txt`.

---

## Personalização

* **Alterar lista de palavras a remover**
  Basta editar o array `palavrasRemover` no início de `convert.js`.

* **Mudar pastas de entrada/saída**
  As variáveis `pastaInput` e `pastaOutput` podem ser ajustadas para qualquer caminho desejado.

* **Incluir subpastas**
  Para processar PDFs aninhados em subdiretórios, seria necessário adaptar o script para percorrer recursivamente o diretório `input_pdfs/`.

---

## Possíveis Erros Comuns

1. **“Error: ENOENT: no such file or directory”**

   * Verifique se a pasta `input_pdfs/` realmente existe e contém arquivos PDF.
   * Caso aponte para um caminho incorreto, ajuste o valor de `pastaInput`.

2. **Problemas de permissão de escrita**

   * Se não puder criar arquivos em `output_txts/` ou `combined.txt`, garanta que o usuário (ou grupo) tenha permissão de escrita no diretório do projeto.

3. **PDFs muito grandes ou com conteúdo protegido**

   * `pdf-parse` pode falhar caso o arquivo esteja corrompido ou criptografado.
   * Teste abrir o PDF manualmente para garantir que ele seja legível.

---

## Licença

Este script foi criado para facilitar a extração e limpeza de conteúdo de PDFs em formato de texto. Sinta-se à vontade para usar, adaptar e distribuir conforme necessário.
