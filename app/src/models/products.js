const db = require('../database/connection');

async function createProduct(data, userId) {

    const {
        nome,
        quantidade_estoque,
        preco_venda,
        custo_produto
    } = data;

    const [existingProducts] = await db.execute(
        `SELECT id
         FROM produtos
         WHERE nome = ? AND user_id = ?`,
        [nome, userId]
    );

    if (existingProducts.length > 0) {
        return {
            success: false,
            message: "Produto já cadastrado"
        };
    }

    const [result] = await db.execute(
        `INSERT INTO produtos
        (nome, quantidade_estoque, preco_venda, custo_produto, user_id)
        VALUES (?, ?, ?, ?, ?)`,
        [
            nome,
            quantidade_estoque,
            preco_venda,
            custo_produto,
            userId
        ]
    );

    return {
        success: true,
        productId: result.insertId
    };
}

async function editProduct(data, productId, userId) {

    const fields = [];
    const values = [];

    if (data.nome !== undefined) {
        fields.push("nome = ?");
        values.push(data.nome);
    }

    if (data.quantidade_estoque !== undefined) {
        fields.push("quantidade_estoque = ?");
        values.push(data.quantidade_estoque);
    }

    if (data.preco_venda !== undefined) {
        fields.push("preco_venda = ?");
        values.push(data.preco_venda);
    }

    if (data.custo_produto !== undefined) {
        fields.push("custo_produto = ?");
        values.push(data.custo_produto);
    }

    if (fields.length === 0) {
        return false;
    }

    values.push(productId);
    values.push(userId);

    const [result] = await db.execute(
        `UPDATE produtos
         SET ${fields.join(", ")}
         WHERE id = ? AND user_id = ?`,
        values
    );

    return result.affectedRows > 0;
}

async function deleteProduct(productId, userId){

    if(!productId || !userId) {
        return false;
    }

    const [ result ] = await db.execute(
        `DELETE FROM produtos
         WHERE id = ? AND user_id = ?`,
        [productId, userId]
    );
    
    return result.affectedRows > 0;
}

async function listProducts(userId){

    if(!userId){
        return false
    }

    const [result] = await db.execute(`
        SELECT * FROM produtos WHERE user_id = ?
    `, [userId]);

    return result;
}

async function getProductsForOrder(connection, productIds, userId) {
    const placeholders = productIds.map(() => '?').join(', ');
    const [rows] = await connection.execute(
        `SELECT id, preco_venda, quantidade_estoque
         FROM produtos
         WHERE user_id = ? AND id IN (${placeholders})
         FOR UPDATE`,
        [userId, ...productIds]
    );

    return rows;
}

module.exports = {
    createProduct,  
    editProduct,
    deleteProduct,
    listProducts,
    getProductsForOrder
}