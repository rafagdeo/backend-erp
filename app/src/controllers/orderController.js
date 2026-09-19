const orderServices = require("../services/pedidoServices");
const clientsModel = require("../models/clients");

async function createOrder(req, res) {
  try {
    const userId = req.usuario.id;

    const order = await orderServices.createOrder(userId, req.body);

    if (!order) {
      return res.status(500).json({
        message: "Erro ao criar pedido",
      });
    }

    return res.status(201).json({
      message: "Pedido criado com sucesso",
      orderId: order,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
}

async function editOrder(req, res) {
  try {
    const userId = req.usuario.id;
    const pedidoId = req.params.id;

    const order = await orderServices.editOrder(req.body, pedidoId, userId);

    if (!order) {
      return res.status(400).json({
        message: "Erro ao editar pedido",
      });
    }

    return res.status(200).json({
      message: "Pedido editado com sucesso",
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
}

async function viewOrders(req, res) {
  try {
    const userId = req.usuario.id;

    const resultadoBusca = await orderServices.viewOrders(userId);

    if (resultadoBusca.length === 0) {
      return res.status(404).json({
        message: "Nenhum pedido encontrado.",
      });
    }

    return res.status(200).json({
      message: resultadoBusca,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
}

async function orderByClient(req, res) {
  try {
    const userId = req.usuario.id;
    const clienteId = req.params.clienteId;

    const resultadoBusca = await orderServices.ordersByClient(
      clienteId,
      userId,
    );

    if (resultadoBusca.length === 0) {
      return res.status(404).json({
        message: "Nenhum pedido encontrado.",
      });
    }

    return res.status(200).json({
      message: resultadoBusca,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
}

module.exports = {
  createOrder,
  editOrder,
  viewOrders,
  orderByClient,
};
