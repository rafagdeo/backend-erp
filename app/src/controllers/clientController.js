
const clientServices = require('../services/clientesServices');

function index(req, res) {
    return res.json({
        message: 'Olá mundo.'
    });
}


async function createClient(req, res) {
    try {
        const usuarioId = req.usuario.id;

        const client = await clientServices.createClient(
            req.body,
            usuarioId
        );

        return res.status(201).json({
            message: 'Cliente criado com sucesso',
            client
        });

    } catch (err) {
        return res.status(500).json({
            message: `${err.message}. Erro ao criar cliente`
        });
    }
}

async function listClients(req, res) {
    try {
        const usuarioId = req.usuario.id;

        const clientsListed = await clientServices.listClients(
            usuarioId
        );

        return res.status(200).json(clientsListed);
    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
}

async function deleteClient(req, res){
    try {
        const usuarioId = req.usuario.id;

        const clientDeleted = await clientServices.deleteClient(
            req.body.id,
            usuarioId
        );

        return res.status(200).json({
            message: clientDeleted
        });
    }catch(err){
        res.status(500).json ({
            message: `${err.message}.`
        })
    }
}

module.exports = {
    index,
    createClient,
    listClients,
    deleteClient
};