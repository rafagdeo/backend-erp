const db = require('../database/connection');

async function createProduct(data, userId){
    const { nome, quantidade_estoque, preco_venda, custo_produto } = data;

    const [existingProducts] = await db.execute(
        `SELECT id
         FROM produtos
         WHERE nome = ? AND user_id = ?`,
        [nome, userId]
    );

    if(existingProducts.length > 0){
        return "Produto já cadastrado"
    }

    const [result] = await db.execute(
        `INSERT INTO produtos (nome, quantidade_estoque, preco_venda, custo_produto, user_id)
         VALUES (?, ?, ?, ?, ?)`,
        [nome, quantidade_estoque, preco_venda, custo_produto, userId]
    );
    
    return result.insertId;
}

module.exports = {
    createProduct,
}