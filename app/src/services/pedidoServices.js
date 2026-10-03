const pedidoModel = require("../models/pedidos");
const clientModel = require("../models/clients");
const pedidoItemsModel = require("../models/pedidosItens");
const productsModel = require("../models/products");
const db = require("../database/connection");

const statusPermitidos = ["atrasado", "processando", "pago", "cancelado"];

function validaParcelas(parcelas, parcelasPagas = 0) {
  if (!Number.isInteger(Number(parcelas)) || Number(parcelas) < 1 || Number(parcelas) > 12) {
    throw new Error("O número de parcelas deve estar entre 1 e 12");
  }
  if (!Number.isInteger(Number(parcelasPagas)) || Number(parcelasPagas) < 0 || Number(parcelasPagas) > Number(parcelas)) {
    throw new Error("A quantidade de parcelas pagas é inválida");
  }
}

function normalizaStatus(status) {
  if (status === "pendente") return "processando";
  if (status === "concluido") return "pago";
  if (typeof status !== "string" || !statusPermitidos.includes(status)) {
    throw new Error("Status inválido");
  }
  return status;
}

function distribuiValorParcelas(valor, quantidade) {
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 12) {
    throw new Error("A quantidade de parcelas restantes deve estar entre 1 e 12");
  }
  const totalCentavos = Math.round(Number(valor) * 100);
  const base = Math.floor(totalCentavos / quantidade);
  const resto = totalCentavos % quantidade;
  return Array.from(
    { length: quantidade },
    (_, index) => (base + (index < resto ? 1 : 0)) / 100,
  );
}

function totalItens(itens) {
  const totalCents = itens.reduce(
    (sum, item) =>
      sum + Math.round((item.preco_unitario * item.quantidade - item.desconto) * 100),
    0,
  );
  return totalCents / 100;
}

function normalizaItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error("Adicione ao menos um produto ao pedido");
  }

  return itens.map((item) => {
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
}

function normalizaItensComPreco(itens, products) {
  const productsById = new Map(products.map((product) => [Number(product.id), product]));
  return itens.map((item) => {
    const product = productsById.get(item.produto_id);
    if (!product) throw new Error("Um dos produtos não foi encontrado");
    if (Number(product.quantidade_estoque) < item.quantidade) {
      throw new Error(`Estoque insuficiente para ${product.nome || item.produto_id}`);
    }
    const precoUnitario = Number(product.preco_venda);
    if (item.desconto > precoUnitario * item.quantidade) {
      throw new Error("O desconto excede o valor do item");
    }

    return { ...item, preco_unitario: precoUnitario };
  });
}

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

  const statusInicial = normalizaStatus(status ?? "processando");

  const itensNormalizados = normalizaItens(data.itens);
  const parcelas = Number(data.parcelas ?? 1);
  const parcelasPagas = Number(data.parcelas_pagas ?? 0);
  validaParcelas(parcelas, parcelasPagas);

  const client = await clientModel.getClient(phone, userId);

  if (!client) {
    throw new Error("Cliente não encontrado");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const productIds = [...new Set(itensNormalizados.map((item) => item.produto_id))];
    const products = await productsModel.getProductsForOrder(connection, productIds, userId);
    const itemsWithPrice = normalizaItensComPreco(itensNormalizados, products);
    const total = totalItens(itemsWithPrice);
    const quitado = statusInicial === "pago" || parcelasPagas === parcelas;
    const valorPago = quitado
      ? total
      : distribuiValorParcelas(total, parcelas)
        .slice(0, parcelasPagas)
        .reduce((sum, amount) => sum + amount, 0);

    const orderData = {
      data_pedido: dataPedidoConvertida,
      status: quitado ? "pago" : statusInicial,
      prazo_pagamento: prazoPagamentoConvertido,
      observacao: typeof data.observacao === "string" ? data.observacao.trim().slice(0, 1000) : "",
      parcelas,
      parcelas_pagas: quitado ? parcelas : parcelasPagas,
      valor_pago: valorPago,
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
  if (!userId) throw new Error("Usuário não autenticado");
  data = data || {};
  const { data_pedido, status, prazo_pagamento } = data || {};

  const dataEditada = {};
  const hasPaymentUpdate =
    data.parcelas_restantes !== undefined ||
    data.parcelas_pagas !== undefined ||
    data.valor_pago !== undefined ||
    data.valor_restante !== undefined ||
    data.status === "pago" ||
    data.status === "concluido";

  if (data_pedido !== undefined) {
    validaData(data_pedido);
    dataEditada.data_pedido = converteData(data_pedido);
  }

  if (status !== undefined) {
    dataEditada.status = normalizaStatus(status);
  }

  if (prazo_pagamento !== undefined) {
    validaData(prazo_pagamento);
    dataEditada.prazo_pagamento = converteData(prazo_pagamento);
  }

  if (data.observacao !== undefined) {
    if (typeof data.observacao !== "string") throw new Error("Observação inválida");
    dataEditada.observacao = data.observacao.trim().slice(0, 1000);
  }

  if (data.cliente_id !== undefined) {
    const clientId = Number(data.cliente_id);
    if (!Number.isInteger(clientId) || clientId <= 0 || !(await clientModel.getClientById(clientId, userId))) {
      throw new Error("Cliente não encontrado");
    }
    dataEditada.cliente_id = clientId;
  }

  const itensNormalizados = data.itens === undefined ? null : normalizaItens(data.itens);

  if (data.valor_pago !== undefined) {
    const paid = Math.round(Number(data.valor_pago) * 100) / 100;
    if (!Number.isFinite(paid) || paid < 0) {
      throw new Error("O valor recebido informado é inválido");
    }
    dataEditada.valor_pago = paid;
  } else if (data.valor_restante !== undefined) {
    const remaining = Math.round(Number(data.valor_restante) * 100) / 100;
    if (!Number.isFinite(remaining) || remaining < 0) {
      throw new Error("O saldo restante informado é inválido");
    }
    dataEditada.valor_restante = remaining;
  }

  if (Object.keys(dataEditada).length === 0 && !itensNormalizados && !hasPaymentUpdate) {
    throw new Error("Nenhum dado para editar");
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const currentOrder = await pedidoModel.getOrderById(userId, pedidoId, connection, true);
    if (!currentOrder) throw new Error("Pedido não encontrado");

    if (itensNormalizados) {
      const currentItems = await pedidoItemsModel.getItemsForOrder(connection, pedidoId);
      await pedidoItemsModel.restoreStock(connection, currentItems, userId);
      const productIds = [...new Set(itensNormalizados.map((item) => item.produto_id))];
      const products = await productsModel.getProductsForOrder(connection, productIds, userId);
      const itemsWithPrice = normalizaItensComPreco(itensNormalizados, products);
      await pedidoItemsModel.updateStock(connection, itemsWithPrice, userId);
      await pedidoItemsModel.deleteItemsForOrder(connection, pedidoId);
      await pedidoItemsModel.createItems(connection, pedidoId, itemsWithPrice);
    }

    if (hasPaymentUpdate) {
      const updatedOrder = await pedidoModel.getOrderById(userId, pedidoId, connection);
      const parcelasPagas = Number(
        data.status === "pago"
          ? currentOrder.parcelas
          : data.parcelas_pagas ?? currentOrder.parcelas_pagas,
      );
      const parcelasRestantes = Number(
        data.parcelas_restantes ??
        Math.max(0, Number(currentOrder.parcelas) - parcelasPagas),
      );
      const parcelas = parcelasPagas + parcelasRestantes;
      if (!Number.isInteger(parcelasPagas) || parcelasPagas < 0) {
        throw new Error("A quantidade de parcelas pagas é inválida");
      }
      if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 12) {
        throw new Error("O total de parcelas deve estar entre 1 e 12");
      }
      if (parcelasPagas > parcelas) {
        throw new Error("A quantidade de parcelas pagas não pode exceder o total");
      }

      const total = Number(updatedOrder.valor_total);
      let valorPago = Number(currentOrder.valor_pago || 0);
      if (data.valor_restante !== undefined) {
        if (data.valor_restante > total) {
          throw new Error("O saldo restante não pode ser maior que o total do pedido");
        }
        valorPago = Math.round((total - data.valor_restante) * 100) / 100;
      } else if (data.valor_pago !== undefined) {
        valorPago = Math.round(Number(data.valor_pago) * 100) / 100;
        if (valorPago > total) {
          throw new Error("O valor recebido não pode ser maior que o total do pedido");
        }
      }

      if (
        dataEditada.status === "pago" &&
        data.valor_pago === undefined &&
        data.valor_restante === undefined
      ) {
        valorPago = total;
      }

      if (valorPago >= total) {
        valorPago = total;
        dataEditada.parcelas_pagas = parcelas;
        dataEditada.status = "pago";
      } else if (parcelasRestantes === 0) {
        throw new Error("Registre o valor total recebido para quitar o pedido");
      } else if (dataEditada.status === "pago") {
        dataEditada.status = "processando";
      } else if (currentOrder.status === "pago") {
        dataEditada.status = "processando";
      }

      dataEditada.parcelas = parcelas;
      if (dataEditada.parcelas_pagas === undefined) {
        dataEditada.parcelas_pagas = parcelasPagas;
      }
      dataEditada.valor_pago = valorPago;
      delete dataEditada.valor_restante;
    }

    if (Object.keys(dataEditada).length > 0) {
      await pedidoModel.editOrder(dataEditada, pedidoId, userId, connection);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return true;
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

async function orderDetails(orderId, userId) {
  if (!userId) throw new Error("Usuário não autenticado");
  const order = await pedidoModel.getOrderById(userId, orderId);
  if (!order) return null;
  const items = await pedidoItemsModel.getItemsForOrder(db, orderId);
  return { ...order, itens: items };
}

module.exports = {
  createOrder,
  editOrder,
  viewOrders,
  ordersByClient,
  orderDetails,
  distribuiValorParcelas,
};
