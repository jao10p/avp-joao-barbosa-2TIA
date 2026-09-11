# API de Controle de Estoque de Padaria

Projeto escolar de uma API REST para gerenciamento do estoque de produtos de uma padaria.

## Tecnologias

- Node.js
- Express
- Multer
- dotenv
- swagger-ui-express
- swagger-jsdoc

## Como executar

1. Clone o repositório e acesse a pasta do projeto:

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd avp-joao-barbosa-2TIA
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Copie o arquivo de exemplo das variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

   No Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Edite o arquivo `.env` e defina o token da aplicação:

   ```env
   TOKEN_SECRETO=seu-token-secreto
   ```

5. Inicie o servidor:

   ```bash
   node server.js
   ```

A API ficará disponível em `http://localhost:3000`.

## Documentação Swagger

Acesse a documentação interativa em:

[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

A interface permite consultar as rotas e testar as requisições diretamente no navegador.

## Autenticação

As rotas protegidas exigem o header HTTP abaixo:

```http
Authorization: Bearer <TOKEN_SECRETO>
```

Substitua `<TOKEN_SECRETO>` pelo mesmo valor definido no arquivo `.env`.

As rotas de leitura são públicas. As rotas de cadastro, alteração, exclusão e upload exigem autenticação.

## Rotas da API

### Produtos

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/produtos` | Pública | Lista todos os produtos. |
| `GET` | `/produtos/:id` | Pública | Busca um produto pelo ID. |
| `POST` | `/produtos` | Protegida | Cadastra um novo produto. |
| `PUT` | `/produtos/:id` | Protegida | Atualiza um produto existente. |
| `DELETE` | `/produtos/:id` | Protegida | Remove um produto pelo ID. |

### Upload de imagens

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/upload` | Protegida | Faz upload de uma imagem. |

O upload deve usar `multipart/form-data`, com o arquivo no campo `imagem`.

Formatos aceitos:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

O tamanho máximo do arquivo é de 2 MB. Os arquivos são armazenados na pasta `src/uploads`.

## Exemplos de requisições

### Listar produtos

```bash
curl http://localhost:3000/produtos
```

### Cadastrar produto

```bash
curl -X POST http://localhost:3000/produtos \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer seu-token-secreto" \
   -d '{"nome":"Broa de Milho","categoria":"Pães","quantidade":50,"precoUnitario":2.50}'
```

No Windows PowerShell, substitua as barras invertidas por crases (`) ou execute o comando em uma única linha.

### Enviar uma imagem

```bash
curl -X POST http://localhost:3000/upload \
   -H "Authorization: Bearer seu-token-secreto" \
   -F "imagem=@caminho/para/imagem.png"
```

## Observações

- Os produtos são mantidos em memória enquanto o servidor está em execução.
- O arquivo `.env` não deve ser versionado, pois contém o token da aplicação.
- A pasta `src/uploads` é criada automaticamente quando o servidor é iniciado.
