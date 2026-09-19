const db = require("../database/connection");

async function createOrder(userId, data, clientId) {
    const { data_pedido, status, prazo_pagamento, valor_total, observacao } = data;

    const [result] = await db.execute(
        `INSERT INTO pedidos
        (data_pedido, status, prazo_pagamento, valor_total, observacao, user_id, cliente_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data_pedido, status, prazo_pagamento, valor_total, observacao, userId, clientId]
    );

    return result.insertId;
}

async function editOrder(data, orderId, userId){
    const fields = [];
    const values = [];

    if (data.data_pedido !== undefined) {
        fields.push("data_pedido= ?");
        values.push(data.data_pedido);
    }

    if (data.status !== undefined) {
        fields.push("status = ?");
        values.push(data.status);
    }

    if (data.prazo_pagamento !== undefined) {
        fields.push("prazo_pagamento = ?");
        values.push(data.prazo_pagamento);
    }

    if (fields.length === 0) {
        return false;
    }

    values.push(orderId);
    values.push(userId);

    const [result] = await db.execute(
        `UPDATE pedidos
         SET ${fields.join(", ")}
         WHERE id = ? AND user_id = ?`,
        values
    );

    return result.affectedRows > 0;
}

async function getOrders(userId) {
    const [rows] = await db.execute(
        `SELECT * FROM pedidos WHERE user_id = ?`,
        [userId]
    );

    return rows;
}

async function getOrdersByClient(userId, clienteId) {
    const [rows] = await db.execute(
        `SELECT * FROM pedidos 
         WHERE user_id = ? AND cliente_id = ?`,
        [userId, clienteId]
    );

    return rows;
}



module.exports = {
  createOrder,
  editOrder,
  getOrders,
  getOrdersByClient
};
