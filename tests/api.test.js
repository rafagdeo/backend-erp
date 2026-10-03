const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const productsService = require('../app/src/services/productsServices');
const clientsService = require('../app/src/services/clientesServices');
const ordersService = require('../app/src/services/pedidoServices');
const authenticator = require('../app/src/services/authenticator');
const ordersModel = require('../app/src/models/pedidos');

describe('Serviços do ERP', () => {
  it('expõe operações dos módulos usados pela API', () => {
    assert.equal(typeof productsService.createProduct, 'function');
    assert.equal(typeof productsService.listProducts, 'function');
    assert.equal(typeof clientsService.createClient, 'function');
    assert.equal(typeof ordersService.createOrder, 'function');
    assert.equal(typeof authenticator.login, 'function');
  });

  it('recusa produto com nome vazio ou estoque fracionado', async () => {
    const emptyName = await productsService.createProduct({ nome: ' ', quantidade_estoque: 1, preco_venda: 10, custo_produto: 5 }, 1);
    const fractionalStock = await productsService.createProduct({ nome: 'Produto', quantidade_estoque: 1.5, preco_venda: 10, custo_produto: 5 }, 1);

    assert.equal(emptyName.success, false);
    assert.equal(fractionalStock.success, false);
  });

  it('recusa cliente sem dados obrigatórios antes de consultar o banco', async () => {
    await assert.rejects(clientsService.createClient({}, 1), /Nome e telefone são obrigatórios/);
  });

  it('recusa telefone de cliente com caracteres não numéricos', async () => {
    await assert.rejects(clientsService.createClient({ nome: 'Cliente', telefone: '(11) 99999-9999' }, 1), /Telefone deve conter DDD/);
  });

  it('recusa pedido sem usuário autenticado', async () => {
    await assert.rejects(ordersService.createOrder(null, {}), /Usuário não autenticado/);
  });

  it('cria pedido sem depender de coluna total no schema', async () => {
    let insertQuery = '';
    const connection = {
      execute: async (query, values) => {
        insertQuery = query;
        assert.deepEqual(values, ['2026-10-03 12:00:00', 'pendente', '2026-11-02 12:00:00', '', 7, 12]);
        return [{ insertId: 31 }];
      },
    };

    const orderId = await ordersModel.createOrder(7, {
      data_pedido: '2026-10-03 12:00:00',
      status: 'pendente',
      prazo_pagamento: '2026-11-02 12:00:00',
      valor_total: 99,
      observacao: '',
    }, 12, connection);

    assert.equal(orderId, 31);
    assert.doesNotMatch(insertQuery, /valor_total/);
  });

  it('exige senha forte ao cadastrar uma conta', async () => {
    await assert.rejects(authenticator.register({
      username: 'Conta',
      email: 'conta@example.com',
      phone: '11999999999',
      password: 'curta',
      confirmPassword: 'curta',
    }), /A senha deve ter ao menos 10 caracteres/);
  });
});
