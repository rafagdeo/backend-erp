const db = require("../database/connection");

async function createOrder(userId, data, clientId, connection = db) {
    const { data_pedido, status, prazo_pagamento, observacao } = data;

    const [result] = await connection.execute(
        `INSERT INTO pedidos
        (data_pedido, status, prazo_pagamento, observacao, user_id, cliente_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [data_pedido, status, prazo_pagamento, observacao, userId, clientId]
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
                `SELECT p.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
                 COALESCE((
                     SELECT SUM(pi.quantidade * pi.preco_unitario - COALESCE(pi.desconto, 0))
                     FROM pedido_itens pi
                     WHERE pi.pedido_id = p.id
                 ), 0) AS valor_total
         FROM pedidos p
         INNER JOIN clientes c ON c.id = p.cliente_id AND c.user_id = p.user_id
         WHERE p.user_id = ?
         ORDER BY p.data_pedido DESC`,
        [userId]
    );

    return rows;
}

async function getOrdersByClient(userId, clienteId) {
    const [rows] = await db.execute(
                `SELECT p.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
                 COALESCE((
                     SELECT SUM(pi.quantidade * pi.preco_unitario - COALESCE(pi.desconto, 0))
                     FROM pedido_itens pi
                     WHERE pi.pedido_id = p.id
                 ), 0) AS valor_total
         FROM pedidos p
         INNER JOIN clientes c ON c.id = p.cliente_id AND c.user_id = p.user_id
         WHERE p.user_id = ? AND p.cliente_id = ?
         ORDER BY p.data_pedido DESC`,
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
