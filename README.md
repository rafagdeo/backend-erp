# Nexo Gestão | Backend

API Express/MySQL para autenticação, clientes, produtos, estoque e pedidos.

## Configuração

1. Use Node.js 20 ou superior e MySQL.
2. Copie `.env.example` para `.env`.
3. Gere um segredo JWT aleatório com pelo menos 32 caracteres e configure a conexão MySQL e `FRONTEND_URL`.
4. Crie as tabelas `users`, `clientes`, `produtos`, `pedidos` e `pedido_itens` com os campos consultados em `app/src/models`.
5. Instale dependências e execute:

```powershell
npm install
npm run dev
```

A API escuta em `http://localhost:3000`. Em produção, sirva front e API sob HTTPS e configure `NODE_ENV=production`.

## Segurança da sessão

- JWT em cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção.
- CORS restrito a `FRONTEND_URL`; payload JSON limitado a 100 KB.
- Limites de tentativas em login e cadastro.
- Rotas de dados autenticadas e consultas limitadas ao usuário da sessão.
- Senhas com hash bcrypt; não registre tokens, senhas ou dados pessoais nos logs.

## Verificações

```powershell
npm test
npm audit
```