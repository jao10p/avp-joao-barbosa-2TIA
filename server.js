import express from "express";

const app = express();
const port = 3000;

app.use(express.json());

// "banco de dados" fictício em memória
const produtos = [
  { id: 1, nome: "Pão Francês", categoria: "Pães", quantidade: 120, precoUnitario: 0.75 },
  { id: 2, nome: "Pão de Queijo", categoria: "Salgados", quantidade: 80, precoUnitario: 3.5 },
  { id: 3, nome: "Bolo de Cenoura", categoria: "Bolos", quantidade: 10, precoUnitario: 25.0 },
  { id: 4, nome: "Croissant", categoria: "Salgados", quantidade: 30, precoUnitario: 6.0 },
  { id: 5, nome: "Sonho", categoria: "Doces", quantidade: 40, precoUnitario: 4.5 }
];

// controla o próximo ID, mesmo depois de exclusões
let proximoId = produtos.length + 1;

app.get("/", (req, res) => {
  res.json({
    mensagem: "Controle de Estoque Simples - Padaria",
    disciplina: "Desenvolvimento de Websites",
    bimestre: "3º bimestre"
  });
});

// LISTAR TODOS OS PRODUTOS
app.get("/produtos", (req, res) => {
  res.json(produtos);
});

// CONSULTAR PRODUTO POR ID
app.get("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);

  const produto = produtos.find((produto) => produto.id === id);

  if (!produto) {
    return res.status(404).json({
      mensagem: "Produto não encontrado"
    });
  }

  res.json(produto);
});

// CADASTRAR NOVO PRODUTO
app.post("/produtos", (req, res) => {
  const { nome, categoria, quantidade, precoUnitario } = req.body;

  if (!nome || !categoria || quantidade === undefined || precoUnitario === undefined) {
    return res.status(400).json({
      mensagem: "Os campos 'nome', 'categoria', 'quantidade' e 'precoUnitario' são obrigatórios"
    });
  }

  const novoProduto = {
    id: proximoId++,
    nome,
    categoria,
    quantidade,
    precoUnitario
  };

  produtos.push(novoProduto);

  res.status(201).json({
    mensagem: "Produto cadastrado com sucesso",
    produto: novoProduto
  });
});

// EDITAR PRODUTO POR ID
app.put("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);
  const { nome, categoria, quantidade, precoUnitario } = req.body;

  const produto = produtos.find((produto) => produto.id === id);

  if (!produto) {
    return res.status(404).json({
      mensagem: "Produto não encontrado"
    });
  }

  if (nome === undefined && categoria === undefined && quantidade === undefined && precoUnitario === undefined) {
    return res.status(400).json({
      mensagem: "Envie ao menos um campo para atualizar (nome, categoria, quantidade ou precoUnitario)"
    });
  }

  if (nome !== undefined) produto.nome = nome;
  if (categoria !== undefined) produto.categoria = categoria;
  if (quantidade !== undefined) produto.quantidade = quantidade;
  if (precoUnitario !== undefined) produto.precoUnitario = precoUnitario;

  res.json({
    mensagem: "Produto atualizado com sucesso",
    produto
  });
});

// EXCLUIR PRODUTO POR ID
app.delete("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = produtos.findIndex((produto) => produto.id === id);

  if (index === -1) {
    return res.status(404).json({
      mensagem: "Produto não encontrado"
    });
  }

  const [produtoRemovido] = produtos.splice(index, 1);

  res.json({
    mensagem: "Produto removido com sucesso",
    produto: produtoRemovido
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
