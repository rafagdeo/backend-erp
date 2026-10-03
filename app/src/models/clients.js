const db = require('../database/connection');

async function getClient(phone, userId){
    const [rows] = await db.execute(`SELECT * FROM clientes WHERE telefone = ? AND user_id = ?`, [phone, userId]);

    return rows[0];
}

async function getClientById(clientId, userId, connection = db) {
    const [rows] = await connection.execute(
        `SELECT * FROM clientes WHERE id = ? AND user_id = ?`,
        [clientId, userId]
    );

    return rows[0];
}

async function createClient(data) {
    const { nome, telefone, userId } = data;

    const [existingClients] = await db.execute(
        `SELECT id
         FROM clientes
         WHERE telefone = ?
         AND user_id = ?`,
        [telefone, userId]
    );

    if (existingClients.length > 0) {
        throw new Error('Cliente já cadastrado');
    }

    const [result] = await db.execute(
        `INSERT INTO clientes (nome, telefone, user_id)
         VALUES (?, ?, ?)`,
        [nome, telefone, userId]
    );

    return result.insertId;
}

async function listClients(userId){
    const [rows] = await db.execute(`SELECT * FROM clientes WHERE user_id = ?`, [userId]);

    return rows;
}

async function deleteClient(id, userId) {

    const [result] = await db.execute(`
        DELETE FROM clientes
        WHERE id = ?
        AND user_id = ?
    `, [id, userId]);

    return result.affectedRows > 0;
}

async function editClient(data, clientId, userId) {

    const fields = [];
    const values = [];

    if (data.nome !== undefined) {
        fields.push("nome = ?");
        values.push(data.nome);
    }

    if (data.telefone !== undefined) {
        fields.push("telefone = ?");
        values.push(data.telefone);
    }

    if (fields.length === 0) {
        return false;
    }

    values.push(clientId);
    values.push(userId);

    const [result] = await db.execute(
        `UPDATE clientes
         SET ${fields.join(", ")}
         WHERE id = ? AND user_id = ?`,
        values
    );

    return result.affectedRows > 0;
}

module.exports = {
    getClient,
    getClientById,
    createClient,
    listClients,
    deleteClient,
    editClient
};