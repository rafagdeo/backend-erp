const db = require("../database/connection");

async function findAll() {
    const [projects] = await db.query(`
        SELECT *
        FROM projects
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
    `);

    return projects;
}

async function findById(id) {
    const [projects] = await db.execute(`
        SELECT *
        FROM projects
        WHERE id = ?
        AND deleted_at IS NULL
    `, [id]);

    return projects[0];
}

async function create(data) {

    const {
        name,
        short_description,
        category_id,
        date_project,
        image_url
    } = data;

    const [result] = await db.execute(`
        INSERT INTO projects
        (
            name,
            short_description,
            category_id,
            date_project,
            image_url
        )
        VALUES (?, ?, ?, ?, ?)
    `, [
        name,
        short_description,
        category_id,
        date_project,
        image_url
    ]);

    return result.insertId;
}

async function update(id, data) {

    const {
        name,
        short_description,
        category_id,
        date_project,
        image_url
    } = data;

    const [result] = await db.execute(`
        UPDATE projects
        SET
            name = ?,
            short_description = ?,
            category_id = ?,
            date_project = ?,
            image_url = ?
        WHERE id = ?
    `, [
        name,
        short_description,
        category_id,
        date_project,
        image_url,
        id
    ]);

    return result;
}

async function remove(id) {

    const [result] = await db.execute(`
        UPDATE projects
        SET deleted_at = NOW()
        WHERE id = ?
    `, [id]);

    return result;
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};