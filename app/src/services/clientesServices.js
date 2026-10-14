const clientsModel = require("../models/clients");

function normalizeBirthDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).trim();
  let year; let month; let day;
  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) [, year, month, day] = match;
  else {
    match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) throw new Error("Data de nascimento deve estar no formato dd/MM/yyyy");
    [, day, month, year] = match;
  }
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (parsed.getFullYear() !== Number(year) || parsed.getMonth() !== Number(month) - 1 || parsed.getDate() !== Number(day) || parsed > new Date()) {
    throw new Error("Data de nascimento inválida");
  }
  return `${year}-${month}-${day}`;
}

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
  if (!/^\d{10,11}$/.test(telefoneNormalizado)) {
    throw new Error("Telefone deve conter DDD e 10 ou 11 dígitos");
  }

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  return clientsModel.createClient({
    nome: nomeNormalizado,
    telefone: telefoneNormalizado,
    data_nascimento: normalizeBirthDate(data?.data_nascimento),
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

  const telefone = data.telefone ?? data.phone;
  if (telefone !== undefined) {
    if (typeof telefone !== "string" || !/^\d{10,11}$/.test(telefone.trim())) {
      throw new Error("Telefone inválido");
    }
  }

  const dataNormalizado = { ...data };
  if (data.data_nascimento !== undefined) dataNormalizado.data_nascimento = normalizeBirthDate(data.data_nascimento);
  if (telefone !== undefined) dataNormalizado.telefone = telefone;
  delete dataNormalizado.phone;

  const result = await clientsModel.editClient(dataNormalizado, clientId, userId);

  return result;
}

module.exports = {
  getClient,
  createClient,
  listClients,
  deleteClient,
  editClient,
  normalizeBirthDate,
};
