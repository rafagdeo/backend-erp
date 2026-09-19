const pedidoModel = require("../models/pedidos");
const clientModel = require("../models/clients");

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

  const { phone, data_pedido, status, prazo_pagamento } = data;

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

  const client = await clientModel.getClient(phone, userId);

  if (!client) {
    throw new Error("Cliente não encontrado");
  }

  const dataParaSalvar = {
    ...data,
    data_pedido: dataPedidoConvertida,
    prazo_pagamento: prazoPagamentoConvertido,
  };

  return await pedidoModel.createOrder(userId, dataParaSalvar, client.id);
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
