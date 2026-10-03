const db = require("../database/connection");

async function createOrder(userId, data, clientId, connection = db) {
    const { data_pedido, status, prazo_pagamento, observacao, parcelas, parcelas_pagas, valor_pago } = data;

    const [result] = await connection.execute(
        `INSERT INTO pedidos
        (data_pedido, status, prazo_pagamento, observacao, parcelas, parcelas_pagas, valor_pago, user_id, cliente_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data_pedido, status, prazo_pagamento, observacao, parcelas ?? 1, parcelas_pagas ?? 0, valor_pago ?? 0, userId, clientId]
    );

    return result.insertId;
}

async function editOrder(data, orderId, userId, connection = db){
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

    if (data.observacao !== undefined) {
        fields.push("observacao = ?");
        values.push(data.observacao);
    }

    if (data.parcelas !== undefined) {
        fields.push("parcelas = ?");
        values.push(data.parcelas);
    }

    if (data.parcelas_pagas !== undefined) {
        fields.push("parcelas_pagas = ?");
        values.push(data.parcelas_pagas);
    }

    if (data.valor_pago !== undefined) {
        fields.push("valor_pago = ?");
        values.push(data.valor_pago);
    }

    if (data.cliente_id !== undefined) {
        fields.push("cliente_id = ?");
        values.push(data.cliente_id);
    }

    if (fields.length === 0) {
        return false;
    }

    values.push(orderId);
    values.push(userId);

    const [result] = await connection.execute(
        `UPDATE pedidos
         SET ${fields.join(", ")}
         WHERE id = ? AND user_id = ?`,
        values
    );

    return result.affectedRows > 0;
}

async function getOrderById(userId, orderId, connection = db, lock = false) {
    const [rows] = await connection.execute(
        `SELECT p.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
         COALESCE((
             SELECT SUM(pi.quantidade * pi.preco_unitario - COALESCE(pi.desconto, 0))
             FROM pedido_itens pi
             WHERE pi.pedido_id = p.id
         ), 0) AS valor_total,
         GREATEST(0, COALESCE((
             SELECT SUM(pi.quantidade * pi.preco_unitario - COALESCE(pi.desconto, 0))
             FROM pedido_itens pi
             WHERE pi.pedido_id = p.id
         ), 0) - COALESCE(p.valor_pago, 0)) AS valor_restante,
         CASE
             WHEN p.status = 'cancelado' THEN 'cancelado'
             WHEN p.status = 'concluido'
               OR COALESCE(p.valor_pago, 0) >= COALESCE((
                   SELECT SUM(pi.quantidade * pi.preco_unitario - COALESCE(pi.desconto, 0))
                   FROM pedido_itens pi WHERE pi.pedido_id = p.id
               ), 0) THEN 'pago'
             WHEN p.prazo_pagamento < NOW()
               AND p.status IN ('pendente', 'processando', 'atrasado', 'pago') THEN 'atrasado'
             WHEN p.status IN ('pendente', 'atrasado', 'pago') THEN 'processando'
             ELSE p.status
         END AS status_atualizado,
         COALESCE((
             SELECT GROUP_CONCAT(CONCAT(pr.nome, ' x ', pi.quantidade) ORDER BY pi.id SEPARATOR ', ')
             FROM pedido_itens pi
             INNER JOIN produtos pr ON pr.id = pi.produto_id
             WHERE pi.pedido_id = p.id
         ), '') AS produtos_lista
         FROM pedidos p
         INNER JOIN clientes c ON c.id = p.cliente_id AND c.user_id = p.user_id
         WHERE p.id = ? AND p.user_id = ?${lock ? " FOR UPDATE" : ""}`,
        [orderId, userId]
    );

    return rows[0];
}

async function getOrders(userId) {
    const [rows] = await db.execute(
                `SELECT p.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone,
                 COALESCE((
                     SELECT SUM(pi.quantidade * pi.preco_unitario - COALESCE(pi.desconto, 0))
                     FROM pedido_itens pi
                     WHERE pi.pedido_id = p.id
                 ), 0) AS valor_total,
                 GREATEST(0, COALESCE((
                     SELECT SUM(pi.quantidade * pi.preco_unitario - COALESCE(pi.desconto, 0))
                     FROM pedido_itens pi
                     WHERE pi.pedido_id = p.id
                 ), 0) - COALESCE(p.valor_pago, 0)) AS valor_restante,
                 CASE
                     WHEN p.status = 'cancelado' THEN 'cancelado'
                     WHEN p.status = 'concluido'
                       OR COALESCE(p.valor_pago, 0) >= COALESCE((
                           SELECT SUM(pi.quantidade * pi.preco_unitario - COALESCE(pi.desconto, 0))
                           FROM pedido_itens pi WHERE pi.pedido_id = p.id
                       ), 0) THEN 'pago'
                     WHEN p.prazo_pagamento < NOW()
                       AND p.status IN ('pendente', 'processando', 'atrasado', 'pago') THEN 'atrasado'
                     WHEN p.status IN ('pendente', 'atrasado', 'pago') THEN 'processando'
                     ELSE p.status
                 END AS status_atualizado,
                 COALESCE((
                     SELECT GROUP_CONCAT(CONCAT(pr.nome, ' x ', pi.quantidade) ORDER BY pi.id SEPARATOR ', ')
                     FROM pedido_itens pi
                     INNER JOIN produtos pr ON pr.id = pi.produto_id
                     WHERE pi.pedido_id = p.id
                 ), '') AS produtos_lista
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
                 ), 0) AS valor_total,
                 GREATEST(0, COALESCE((
                     SELECT SUM(pi.quantidade * pi.preco_unitario - COALESCE(pi.desconto, 0))
                     FROM pedido_itens pi
                     WHERE pi.pedido_id = p.id
                 ), 0) - COALESCE(p.valor_pago, 0)) AS valor_restante,
                 CASE
                     WHEN p.status = 'cancelado' THEN 'cancelado'
                     WHEN p.status = 'concluido'
                       OR COALESCE(p.valor_pago, 0) >= COALESCE((
                           SELECT SUM(pi.quantidade * pi.preco_unitario - COALESCE(pi.desconto, 0))
                           FROM pedido_itens pi WHERE pi.pedido_id = p.id
                       ), 0) THEN 'pago'
                     WHEN p.prazo_pagamento < NOW()
                       AND p.status IN ('pendente', 'processando', 'atrasado', 'pago') THEN 'atrasado'
                     WHEN p.status IN ('pendente', 'atrasado', 'pago') THEN 'processando'
                     ELSE p.status
                 END AS status_atualizado,
                 COALESCE((
                     SELECT GROUP_CONCAT(CONCAT(pr.nome, ' x ', pi.quantidade) ORDER BY pi.id SEPARATOR ', ')
                     FROM pedido_itens pi
                     INNER JOIN produtos pr ON pr.id = pi.produto_id
                     WHERE pi.pedido_id = p.id
                 ), '') AS produtos_lista
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
  getOrderById,
  getOrders,
  getOrdersByClient
};
