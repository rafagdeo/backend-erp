# Nexo Gestão | Backend

API Express/MySQL para autenticação, clientes, produtos, estoque e pedidos.

## Configuração

1. Use Node.js 20 ou superior e MySQL.
2. Copie `.env.example` para `.env`.
3. Gere um segredo JWT aleatório com pelo menos 32 caracteres e configure a conexão MySQL e `FRONTEND_URL`.
4. Crie as tabelas `users`, `clientes`, `produtos`, `pedidos` e `pedido_itens` com os campos consultados em `app/src/models`.
5. Para atualizar uma base existente, execute uma vez `migrations/20261003_orders_profile.sql` e `migrations/20261003_order_payments.sql`, nessa ordem, no MySQL. O primeiro adiciona o modelo de mensagem individual do usuário e o controle de parcelas pagas; o segundo adiciona o valor já recebido de cada pedido. Depois, execute `migrations/20261004_adaptive_order_payments.sql` para compatibilizar pagamentos antigos com o novo cronograma flexível. Se as duas primeiras migrações já foram executadas, execute apenas a última.
6. Instale dependências e execute:

```powershell
npm install
npm run dev
```

A API escuta em `http://localhost:3000`. Em produção, sirva front e API sob HTTPS e configure `NODE_ENV=production`.

### Banco MySQL na Hostinger

No hPanel, abra **Bancos de dados → Gerenciamento** e use os valores exibidos para o banco criado:

- `DB_HOST`: endereço do servidor MySQL mostrado no hPanel; não presuma que seja `localhost`.
- `DB_NAME` e `DB_USER`: nomes completos exibidos pela Hostinger, que podem incluir um prefixo da conta.
- `DB_PASSWORD`: senha definida para esse usuário MySQL.
- `DB_PORT`: porta mostrada no painel (normalmente `3306`).
- `FRONTEND_URL`: domínio HTTPS exato do front-end, sem barra no final.

Configure esses valores no `.env` do backend e mantenha o arquivo fora do controle de versão. Se a aplicação estiver em outro provedor, confirme no hPanel se conexões MySQL externas estão autorizadas e libere somente o IP necessário. Para o front hospedado em domínio diferente, ajuste também `VITE_API_URL` no `.env` do front para a URL HTTPS da API.

## Segurança da sessão

- JWT em cookie `HttpOnly`, `SameSite=None` e `Secure` em produção (HTTPS obrigatório); em desenvolvimento, `SameSite=Lax`.
- CORS restrito a `FRONTEND_URL`; payload JSON limitado a 100 KB.
- Limites de tentativas em login e cadastro.
- Rotas de dados autenticadas e consultas limitadas ao usuário da sessão.
- Senhas com hash bcrypt; não registre tokens, senhas ou dados pessoais nos logs.
- A mensagem individual do WhatsApp aceita `{nome_cliente}`, `{id_pedido}`, `{produtos}`, `{total}`, `{parcelas}`, `{parcela_pendente}` e `{prazo_pagamento}`.
- Cada pedido permite até 12 parcelas. O saldo pode ser redistribuído entre as parcelas restantes; quando o valor recebido quita o pedido, o status passa automaticamente para `pago`. Pedidos vencidos e ainda não pagos são exibidos como `atrasado`.

## Verificações

```powershell
npm test
npm audit
```
