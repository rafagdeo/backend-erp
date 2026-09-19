const db = require("../database/connection");

async function createItems(connection, pedidoId, itens) {
  for (const item of itens) {
    const { produto_id, quantidade, preco_unitario, desconto } = item;

    await connection.execute(
      `INSERT INTO pedido_itens
            (pedido_id, produto_id, quantidade, preco_unitario, desconto)
            VALUES (?, ?, ?, ?, ?)`,
      [pedidoId, produto_id, quantidade, preco_unitario, desconto],
    );
  }
}

async function viewOrderItem(userId, pedidoId, produtoId) {
  const [rows] = await db.execute(
    `SELECT pi.*
         FROM pedido_itens pi
         INNER JOIN pedidos p ON p.id = pi.pedido_id
         WHERE p.user_id = ?
         AND pi.pedido_id = ?
         AND pi.produto_id = ?
         AND pi.deleted_at IS NULL`,
    [userId, pedidoId, produtoId],
  );

  return rows;
}

async function updateStock(connection, itens, userId) {
  for (const item of itens) {
    await connection.execute(
      `UPDATE produtos
             SET quantidade_estoque = quantidade_estoque - ?
             WHERE id = ?
             AND user_id = ?
             AND quantidade_estoque >= ?`,
      [item.quantidade, item.produto_id, userId, item.quantidade],
    );
  }
  if (result.affectedRows === 0) {
    throw new Error(`Estoque insuficiente para o produto ${item.produto_id}`);
  }
}

module.exports = {
  createItems,
  viewOrderItem,
  updateStock,
};
