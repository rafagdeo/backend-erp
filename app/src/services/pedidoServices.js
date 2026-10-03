const pedidoModel = require("../models/pedidos");
const clientModel = require("../models/clients");
const pedidoItemsModel = require("../models/pedidosItens");
const productsModel = require("../models/products");
const db = require("../database/connection");

const statusPermitidos = ["pendente", "processando", "concluido", "cancelado"];

function validaPhone(value) {
  if (typeof value !== "string") {
    throw new Error("Telefone deve ser uma string");
  }

  if (value.trim() === "") {
    throw new Error("Telefone não pode estar vazio");
  }

  return true;
}

function validaData(value) {
  if (typeof value !== "string") {
    throw new Error("Data deve ser uma string");
  }

  const regex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;

  const match = value.match(regex);

  if (!match) {
    throw new Error("Data deve estar no formato dd/MM/yyyy HH:mm");
  }

  const [, dia, mes, ano, hora, minuto] = match;

  const diaNumber = Number(dia);
  const mesNumber = Number(mes);
  const anoNumber = Number(ano);
  const horaNumber = Number(hora);
  const minutoNumber = Number(minuto);

  const data = new Date(
    anoNumber,
    mesNumber - 1,
    diaNumber,
    horaNumber,
    minutoNumber,
  );

  if (
    data.getFullYear() !== anoNumber ||
    data.getMonth() !== mesNumber - 1 ||
    data.getDate() !== diaNumber ||
    data.getHours() !== horaNumber ||
    data.getMinutes() !== minutoNumber
  ) {
    throw new Error("Data inválida");
  }

  return true;
}

function converteData(value) {
  const [data, horario] = value.split(" ");
  const [dia, mes, ano] = data.split("/");

  return `${ano}-${mes}-${dia} ${horario}:00`;
}

function validaStatus(value) {
  if (typeof value !== "string") {
    throw new Error("Status deve ser uma string");
  }

  if (!statusPermitidos.includes(value)) {
    throw new Error("Status inválido");
  }

  return true;
}

async function createOrder(userId, data) {
  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  if (!data) {
    throw new Error("Dados do pedido não enviados");
  }

  const { phone, data_pedido, status, prazo_pagamento, itens } = data;

  if (phone === undefined || phone === null) {
    throw new Error("Telefone do cliente é obrigatório");
  }

  validaPhone(phone);

  if (data_pedido === undefined || data_pedido === null) {
    throw new Error("Data do pedido é obrigatória");
  }

  validaData(data_pedido);
  const dataPedidoConvertida = converteData(data_pedido);

  if (prazo_pagamento === undefined || prazo_pagamento === null) {
    throw new Error("Data do pagamento é obrigatória");
  }

  validaData(prazo_pagamento);
  const prazoPagamentoConvertido = converteData(prazo_pagamento);

  if (status === undefined || status === null) {
    throw new Error("Status é obrigatório");
  }

  validaStatus(status);

  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error("Adicione ao menos um produto ao pedido");
  }

  const itensNormalizados = itens.map((item) => {
    const produtoId = Number(item.produto_id);
    const quantidade = Number(item.quantidade);
    const desconto = Number(item.desconto || 0);

    if (!Number.isInteger(produtoId) || produtoId <= 0 || !Number.isInteger(quantidade) || quantidade <= 0) {
      throw new Error("Produto ou quantidade inválidos");
    }
    if (!Number.isFinite(desconto) || desconto < 0) {
      throw new Error("Desconto inválido");
    }

    return { produto_id: produtoId, quantidade, desconto };
  });

  const client = await clientModel.getClient(phone, userId);

  if (!client) {
    throw new Error("Cliente não encontrado");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const productIds = [...new Set(itensNormalizados.map((item) => item.produto_id))];
    const products = await productsModel.getProductsForOrder(connection, productIds, userId);
    const productsById = new Map(products.map((product) => [Number(product.id), product]));

    const itemsWithPrice = itensNormalizados.map((item) => {
      const product = productsById.get(item.produto_id);
      if (!product) throw new Error("Um dos produtos não foi encontrado");
      if (Number(product.quantidade_estoque) < item.quantidade) {
        throw new Error(`Estoque insuficiente para ${item.produto_id}`);
      }
      const precoUnitario = Number(product.preco_venda);
      if (item.desconto > precoUnitario * item.quantidade) {
        throw new Error("O desconto excede o valor do item");
      }

      return { ...item, preco_unitario: precoUnitario };
    });

    const orderData = {
      data_pedido: dataPedidoConvertida,
      status,
      prazo_pagamento: prazoPagamentoConvertido,
      observacao: typeof data.observacao === "string" ? data.observacao.trim().slice(0, 1000) : "",
    };
    const orderId = await pedidoModel.createOrder(userId, orderData, client.id, connection);

    await pedidoItemsModel.createItems(connection, orderId, itemsWithPrice);
    await pedidoItemsModel.updateStock(connection, itemsWithPrice, userId);
    await connection.commit();

    return orderId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function editOrder(data, pedidoId, userId) {
  const { data_pedido, status, prazo_pagamento } = data || {};

  const dataEditada = {};

  if (data_pedido !== undefined) {
    dataEditada.data_pedido = converteData(data_pedido);
  }

  if (status !== undefined) {
    validaStatus(status);
    dataEditada.status = status;
  }

  if (prazo_pagamento !== undefined) {
    dataEditada.prazo_pagamento = converteData(prazo_pagamento);
  }

  if (Object.keys(dataEditada).length === 0) {
    throw new Error("Nenhum dado para editar");
  }

  const pedidoEditado = await pedidoModel.editOrder(
    dataEditada,
    pedidoId,
    userId,
  );

  return pedidoEditado;
}

async function viewOrders(userId) {
  if (!userId) {
    throw new Error("Usuário não encontrado.");
  }

  return await pedidoModel.getOrders(userId);
}

async function ordersByClient(clienteId, userId) {
  if (!userId) {
    throw new Error("Usuário não encontrado.");
  }

  if (!clienteId) {
    throw new Error("ID do cliente não informado.");
  }

  const resultado = await pedidoModel.getOrdersByClient(userId, clienteId);

  return resultado;
}

module.exports = {
  createOrder,
  editOrder,
  viewOrders,
  ordersByClient,
};
