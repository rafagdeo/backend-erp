const clientsModel = require("../models/clients");

async function getClient(phone) {
  if (phone === undefined || phone === null || phone === "") {
    throw new Error("Erro ao buscar cliente");
  }

  const cliente = await clientsModel.getClient(phone);

  return cliente;
}

async function createClient(data, userId) {
  const { nome, telefone } = data || {};

  const nomeNormalizado = typeof nome === "string" ? nome.trim() : "";

  const telefoneNormalizado =
    telefone === undefined || telefone === null ? "" : String(telefone).trim();

  if (!nomeNormalizado || !telefoneNormalizado) {
    throw new Error("Nome e telefone são obrigatórios");
  }

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  return clientsModel.createClient({
    nome: nomeNormalizado,
    telefone: telefoneNormalizado,
    userId,
  });
}

async function listClients(userId) {
  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  return clientsModel.listClients(userId);
}

async function deleteClient(id, userId) {
  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const clientDeleted = await clientsModel.deleteClient(id, userId);

  if (!clientDeleted) {
    return "Cliente não encontrado";
  }

  return "Cliente deletado com sucesso";
}

async function editClient(data, clientId, userId) {
  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  if (!clientId) {
    throw new Error("Cliente não informado");
  }

  if (!data || Object.keys(data).length === 0) {
    throw new Error("Nenhum dado foi enviado para alteração");
  }

  if (data.nome !== undefined) {
    if (typeof data.nome !== "string" || data.nome.trim() === "") {
      throw new Error("Nome inválido");
    }
  }

  if (data.phone !== undefined) {
    if (typeof data.phone !== "string" || data.phone.trim() === "") {
      throw new Error("Telefone inválido");
    }
  }

  const result = await clientsModel.editClient(data, clientId, userId);

  return result;
}
module.exports = {
  getClient,
  createClient,
  listClients,
  deleteClient,
  editClient,
};
