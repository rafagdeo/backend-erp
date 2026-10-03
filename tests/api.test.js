const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const productsService = require('../app/src/services/productsServices');
const clientsService = require('../app/src/services/clientesServices');
const ordersService = require('../app/src/services/pedidoServices');
const authenticator = require('../app/src/services/authenticator');
const ordersModel = require('../app/src/models/pedidos');
const usersModel = require('../app/src/models/users');

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

  it('limita os pedidos a no máximo 12 parcelas', async () => {
    await assert.rejects(ordersService.createOrder(1, {
      phone: '11999999999',
      data_pedido: '03/10/2026 12:00',
      prazo_pagamento: '02/11/2026 12:00',
      status: 'pendente',
      parcelas: 13,
      itens: [{ produto_id: 1, quantidade: 1 }],
    }), /entre 1 e 12/);
  });

  it('cria pedido sem depender de coluna total no schema', async () => {
    let insertQuery = '';
    const connection = {
      execute: async (query, values) => {
        insertQuery = query;
        assert.deepEqual(values, ['2026-10-03 12:00:00', 'processando', '2026-11-02 12:00:00', '', 1, 0, 0, 7, 12]);
        return [{ insertId: 31 }];
      },
    };

    const orderId = await ordersModel.createOrder(7, {
      data_pedido: '2026-10-03 12:00:00',
      status: 'processando',
      prazo_pagamento: '2026-11-02 12:00:00',
      valor_total: 99,
      observacao: '',
    }, 12, connection);

    assert.equal(orderId, 31);
    assert.doesNotMatch(insertQuery, /valor_total/);
  });

  it('distribui o saldo em aberto em parcelas com centavos corretos', () => {
    assert.deepEqual(ordersService.distribuiValorParcelas(50, 2), [25, 25]);
    assert.deepEqual(ordersService.distribuiValorParcelas(50, 1), [50]);
    assert.deepEqual(ordersService.distribuiValorParcelas(10, 3), [3.34, 3.33, 3.33]);
  });

  it('marca o pedido e todas as parcelas como pagos ao alterar o status para pago', async () => {
    const originalGetOrderById = ordersModel.getOrderById;
    const originalEditOrder = ordersModel.editOrder;
    const pool = require('../app/src/database/connection');
    const originalPoolGetConnection = pool.getConnection;
    const changes = [];
    let reads = 0;
    const currentOrder = {
      id: 4,
      valor_total: 100,
      valor_pago: 0,
      parcelas: 3,
      parcelas_pagas: 1,
      status: 'processando',
    };
    ordersModel.getOrderById = async () => {
      reads += 1;
      return reads === 1 ? currentOrder : currentOrder;
    };
    ordersModel.editOrder = async (data) => {
      changes.push(data);
      return true;
    };
    pool.getConnection = async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
    });

    try {
      await ordersService.editOrder({ status: 'pago' }, 4, 7);
      assert.deepEqual(changes, [{
        status: 'pago',
        parcelas: 3,
        parcelas_pagas: 3,
        valor_pago: 100,
      }]);
    } finally {
      ordersModel.getOrderById = originalGetOrderById;
      ordersModel.editOrder = originalEditOrder;
      pool.getConnection = originalPoolGetConnection;
    }
  });

  it('salva recebimento parcial e permite redistribuir o saldo nas parcelas restantes', async () => {
    const originalGetOrderById = ordersModel.getOrderById;
    const originalEditOrder = ordersModel.editOrder;
    const pool = require('../app/src/database/connection');
    const originalPoolGetConnection = pool.getConnection;
    let changes;
    const currentOrder = {
      id: 5,
      valor_total: 100,
      valor_pago: 0,
      parcelas: 3,
      parcelas_pagas: 0,
      status: 'processando',
    };
    ordersModel.getOrderById = async () => currentOrder;
    ordersModel.editOrder = async (data) => {
      changes = data;
      return true;
    };
    pool.getConnection = async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
    });

    try {
      await ordersService.editOrder({
        status: 'processando',
        parcelas_pagas: 1,
        parcelas_restantes: 2,
        valor_pago: 50,
      }, 5, 7);
      assert.deepEqual(changes, {
        status: 'processando',
        parcelas: 3,
        parcelas_pagas: 1,
        valor_pago: 50,
      });
      assert.deepEqual(ordersService.distribuiValorParcelas(100 - changes.valor_pago, 2), [25, 25]);
      assert.deepEqual(ordersService.distribuiValorParcelas(100 - changes.valor_pago, 1), [50]);
    } finally {
      ordersModel.getOrderById = originalGetOrderById;
      ordersModel.editOrder = originalEditOrder;
      pool.getConnection = originalPoolGetConnection;
    }
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

  it('recusa telefone de usuário sem DDD ou com caracteres não numéricos', async () => {
    await assert.rejects(authenticator.register({
      username: 'Conta',
      email: 'conta@example.com',
      phone: '(11) 99999-9999',
      password: 'senhaForte123',
      confirmPassword: 'senhaForte123',
    }), /Telefone deve conter DDD e 10 ou 11 números/);
  });

  it('persiste a mensagem de cobrança personalizada no perfil do usuário', async () => {
    const originalUpdate = usersModel.updateUserProfile;
    const originalGet = usersModel.getUserData;
    let savedProfile;
    usersModel.updateUserProfile = async (id, profile) => {
      savedProfile = { id, ...profile };
      return true;
    };
    usersModel.getUserData = async (id) => ({ id, ...savedProfile });

    try {
      const user = await authenticator.updateProfile(9, {
        username: 'Conta',
        phone: '11999999999',
        whatsapp_message: 'Olá {nome_cliente}, pedido #{id_pedido}',
      });

      assert.equal(savedProfile.whatsapp_message, 'Olá {nome_cliente}, pedido #{id_pedido}');
      assert.equal(user.whatsapp_message, savedProfile.whatsapp_message);
    } finally {
      usersModel.updateUserProfile = originalUpdate;
      usersModel.getUserData = originalGet;
    }
  });
});
