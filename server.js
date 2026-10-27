import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import dotenv from "dotenv";
import multer from "multer";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

dotenv.config();

const app = express();
const port = 3000;
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "padaria",
  connectionLimit: 10
});
const prisma = new PrismaClient({ adapter });

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "src", "uploads");
const extensoesPermitidas = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const tiposPermitidos = new Set(["image/jpeg", "image/png", "image/webp"]);

mkdirSync(uploadDir, { recursive: true });

const armazenamento = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, callback) => {
    const extensao = path.extname(file.originalname).toLowerCase();
    const nomeArquivo = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`;
    callback(null, nomeArquivo);
  }
});

const upload = multer({
  storage: armazenamento,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const extensao = path.extname(file.originalname).toLowerCase();

    if (!extensoesPermitidas.has(extensao) || !tiposPermitidos.has(file.mimetype)) {
      return callback(new Error("Apenas arquivos JPG, JPEG, PNG ou WEBP são permitidos"));
    }

    callback(null, true);
  }
});

const autenticarToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  const [tipo, token] = authorization?.split(" ") ?? [];

  if (tipo !== "Bearer" || !token || token !== process.env.TOKEN_SECRETO) {
    return res.status(401).json({
      mensagem: "Token não fornecido ou inválido"
    });
  }

  next();
};

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Controle de Estoque - Padaria",
      version: "1.0.0",

      description: "Documentação da API REST desenvolvida para a AV2"
    },
    servers: [
      {
        url: `http://localhost:${port}`
      }
    ]
  },
  apis: ["./server.js"]
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const produtosIniciais = [
  { id: 1, nome: "Pão Francês", categoria: "Pães", quantidade: 120, precoUnitario: 0.75 },
  { id: 2, nome: "Pão de Queijo", categoria: "Salgados", quantidade: 80, precoUnitario: 3.5 },
  { id: 3, nome: "Bolo de Cenoura", categoria: "Bolos", quantidade: 10, precoUnitario: 25.0 },
  { id: 4, nome: "Croissant", categoria: "Salgados", quantidade: 30, precoUnitario: 6.0 },
  { id: 5, nome: "Sonho", categoria: "Doces", quantidade: 40, precoUnitario: 4.5 }
];

const mapearProduto = (produto) => ({
  ...produto,
  precoUnitario: Number(produto.precoUnitario)
});

async function inicializarBanco() {
  const total = await prisma.produto.count();
  if (total === 0) {
    await prisma.produto.createMany({
      data: produtosIniciais.map(({ nome, categoria, quantidade, precoUnitario }) => ({
        nome,
        categoria,
        quantidade,
        precoUnitario
      }))
    });
  }
}

const validarId = (id) => Number.isInteger(id) && id > 0;

const validarDadosProduto = (dados, exigirObrigatorios = false) => {
  const camposObrigatorios = ["nome", "categoria", "quantidade", "precoUnitario"];

  if (exigirObrigatorios && camposObrigatorios.some((campo) => dados[campo] === undefined)) {
    return "Os campos 'nome', 'categoria', 'quantidade' e 'precoUnitario' são obrigatórios";
  }

  if (dados.nome !== undefined && (typeof dados.nome !== "string" || !dados.nome.trim())) {
    return "O campo 'nome' deve ser um texto não vazio";
  }

  if (dados.categoria !== undefined && (typeof dados.categoria !== "string" || !dados.categoria.trim())) {
    return "O campo 'categoria' deve ser um texto não vazio";
  }

  if (dados.quantidade !== undefined && (!Number.isInteger(dados.quantidade) || dados.quantidade < 0)) {
    return "O campo 'quantidade' deve ser um número inteiro maior ou igual a zero";
  }

  if (dados.precoUnitario !== undefined && (typeof dados.precoUnitario !== "number" || !Number.isFinite(dados.precoUnitario) || dados.precoUnitario < 0)) {
    return "O campo 'precoUnitario' deve ser um número maior ou igual a zero";
  }

  return null;
};

app.get("/", (req, res) => {
  res.json({
    mensagem: "Controle de Estoque Simples - Padaria",
    disciplina: "Desenvolvimento de Websites",
    bimestre: "3º bimestre"
  });
});

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Digite seu token definido no arquivo .env
 *
 *   schemas:
 *     Produto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do produto
 *           example: 1
 *         nome:
 *           type: string
 *           description: Nome do produto
 *           example: Pão Francês
 *         categoria:
 *           type: string
 *           description: Categoria do produto na padaria
 *           example: Pães
 *         quantidade:
 *           type: integer
 *           description: Quantidade em estoque
 *           example: 120
 *         precoUnitario:
 *           type: number
 *           format: float
 *           description: Preço por unidade
 *           example: 0.75
 */

/**
 * @swagger
 * tags:
 *   name: Produtos
 *   description: Gerenciamento do estoque de produtos da padaria
 */

/**
 * @swagger
 * /produtos:
 *   get:
 *     summary: Lista todos os produtos
 *     description: Retorna a lista completa de produtos cadastrados no estoque. Rota pública.
 *     tags: [Produtos]
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Produto'
 *
 *   post:
 *     summary: Cadastra um novo produto
 *     description: Adiciona um novo item ao estoque. Requer token de autenticação.
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - categoria
 *               - quantidade
 *               - precoUnitario
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Broa de Milho
 *               categoria:
 *                 type: string
 *                 example: Pães
 *               quantidade:
 *                 type: integer
 *                 example: 50
 *               precoUnitario:
 *                 type: number
 *                 example: 2.50
 *     responses:
 *       201:
 *         description: Produto cadastrado com sucesso.
 *       400:
 *         description: Dados obrigatórios ausentes ou inválidos.
 *       401:
 *         description: Token não fornecido ou inválido.
 */

/**
 * @swagger
 * /produtos/{id}:
 *   get:
 *     summary: Busca um produto por ID
 *     description: Retorna os detalhes de um único produto a partir do seu ID. Rota pública.
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto desejado
 *     responses:
 *       200:
 *         description: Produto encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Produto'
 *       404:
 *         description: Produto não encontrado.
 *
 *   put:
 *     summary: Atualiza parcialmente um produto
 *     description: Altera um ou mais campos de um produto existente. Requer token de autenticação.
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Pão de Queijo
 *               categoria:
 *                 type: string
 *                 example: Salgados
 *               quantidade:
 *                 type: integer
 *                 example: 30
 *               precoUnitario:
 *                 type: number
 *                 example: 3.00
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso.
 *       400:
 *         description: Dados informados são inválidos.
 *       401:
 *         description: Token não fornecido ou inválido.
 *       404:
 *         description: Produto não encontrado.
 *
 *   delete:
 *     summary: Exclui um produto
 *     description: Remove um produto do estoque pelo seu ID. Requer token de autenticação.
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto a ser excluído
 *     responses:
 *       200:
 *         description: Produto removido com sucesso.
 *       401:
 *         description: Token não fornecido ou inválido.
 *       404:
 *         description: Produto não encontrado.
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Envia uma imagem
 *     description: Faz upload de uma imagem JPG, JPEG, PNG ou WEBP com até 2 MB.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - imagem
 *             properties:
 *               imagem:
 *                 type: string
 *                 format: binary
 *                 description: Imagem JPG, JPEG, PNG ou WEBP de até 2 MB.
 *     responses:
 *       201:
 *         description: Imagem enviada com sucesso.
 *       400:
 *         description: Arquivo ausente, inválido ou maior que 2 MB.
 *       401:
 *         description: Token não fornecido ou inválido.
 */

// LISTAR TODOS OS PRODUTOS
app.get("/produtos", async (req, res) => {
  const produtos = await prisma.produto.findMany({ orderBy: { id: "asc" } });
  res.json(produtos.map(mapearProduto));
});

// CONSULTAR PRODUTO POR ID
app.get("/produtos/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!validarId(id)) {
    return res.status(400).json({
      mensagem: "O ID deve ser um número inteiro positivo"
    });
  }

  const produtoEncontrado = await prisma.produto.findUnique({ where: { id } });
  const produto = produtoEncontrado ? mapearProduto(produtoEncontrado) : null;

  if (!produto) {
    return res.status(404).json({
      mensagem: "Produto não encontrado"
    });
  }

  res.json(produto);
});

// CADASTRAR NOVO PRODUTO
app.post("/produtos", autenticarToken, async (req, res) => {
  const dados = req.body ?? {};
  const { nome, categoria, quantidade, precoUnitario } = dados;
  const erroValidacao = validarDadosProduto(dados, true);

  if (erroValidacao) {
    return res.status(400).json({
      mensagem: erroValidacao
    });
  }

  const novoProduto = mapearProduto(await prisma.produto.create({
    data: { nome, categoria, quantidade, precoUnitario }
  }));

  res.status(201).json({
    mensagem: "Produto cadastrado com sucesso",
    produto: novoProduto
  });
});

// EDITAR PRODUTO POR ID
app.put("/produtos/:id", autenticarToken, async (req, res) => {
  const id = Number(req.params.id);
  const dados = req.body ?? {};
  const { nome, categoria, quantidade, precoUnitario } = dados;

  if (!validarId(id)) {
    return res.status(400).json({
      mensagem: "O ID deve ser um número inteiro positivo"
    });
  }

  const produtoAtualEncontrado = await prisma.produto.findUnique({ where: { id } });
  const produtoAtual = produtoAtualEncontrado ? mapearProduto(produtoAtualEncontrado) : null;

  if (!produtoAtual) {
    return res.status(404).json({
      mensagem: "Produto não encontrado"
    });
  }

  if (nome === undefined && categoria === undefined && quantidade === undefined && precoUnitario === undefined) {
    return res.status(400).json({
      mensagem: "Envie ao menos um campo para atualizar (nome, categoria, quantidade ou precoUnitario)"
    });
  }

  const erroValidacao = validarDadosProduto(dados);

  if (erroValidacao) {
    return res.status(400).json({ mensagem: erroValidacao });
  }

  const dadosAtualizados = Object.fromEntries(
    ["nome", "categoria", "quantidade", "precoUnitario"]
      .filter((campo) => dados[campo] !== undefined)
      .map((campo) => [campo, dados[campo]])
  );
  const produto = mapearProduto(await prisma.produto.update({
    where: { id },
    data: dadosAtualizados
  }));

  res.json({
    mensagem: "Produto atualizado com sucesso",
    produto
  });
});

// EXCLUIR PRODUTO POR ID
app.delete("/produtos/:id", autenticarToken, async (req, res) => {
  const id = Number(req.params.id);

  if (!validarId(id)) {
    return res.status(400).json({
      mensagem: "O ID deve ser um número inteiro positivo"
    });
  }

  const produtoEncontrado = await prisma.produto.findUnique({ where: { id } });
  const produtoRemovido = produtoEncontrado ? mapearProduto(produtoEncontrado) : null;

  if (!produtoRemovido) {
    return res.status(404).json({
      mensagem: "Produto não encontrado"
    });
  }

  await prisma.produto.delete({ where: { id } });

  res.json({
    mensagem: "Produto removido com sucesso",
    produto: produtoRemovido
  });
});

// UPLOAD DE IMAGEM
app.post("/upload", autenticarToken, upload.single("imagem"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      mensagem: "Envie um arquivo no campo 'imagem'"
    });
  }

  res.status(201).json({
    mensagem: "Imagem enviada com sucesso",
    arquivo: req.file.filename,
    caminho: `/src/uploads/${req.file.filename}`
  });
});

app.use((erro, req, res, next) => {
  if (erro instanceof multer.MulterError) {
    const mensagem = erro.code === "LIMIT_FILE_SIZE"
      ? "O arquivo deve ter no máximo 2 MB"
      : "Erro ao processar o upload";

    return res.status(400).json({ mensagem });
  }

  if (erro?.message?.startsWith("Apenas arquivos")) {
    return res.status(400).json({ mensagem: erro.message });
  }

  console.error("Erro ao processar requisição:", erro);
  res.status(500).json({ mensagem: "Erro interno do servidor" });
});

inicializarBanco()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
      console.log(`Documentação Swagger em http://localhost:${port}/api-docs`);
      console.log(`Banco conectado: ${process.env.DB_NAME || "padaria"}`);
    });
  })
  .catch((erro) => {
    console.error("Não foi possível conectar ao MariaDB. Verifique o XAMPP e as variáveis DB_* do .env.", erro.message);
    process.exit(1);
  });
