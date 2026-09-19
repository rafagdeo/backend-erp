const db = require("../database/connection");
const pedidoModel = require("../models/pedidos");
const pedidoItemsModel = require("../models/pedidosItens");
const produtoModel = require("../models/produtos");

async function createOrder(data, userId) {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const pedidoId = await pedidoModel.createOrder(
            connection,
            data,
            userId
        );

        await pedidoItemsModel.createItems(
            connection,
            pedidoId,
            data.itens
        );

        await produtoModel.updateStock(
            connection,
            data.itens,
            userId
        );

        await connection.commit();

        return pedidoId;

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
}

module.exports = {
    createOrder
};