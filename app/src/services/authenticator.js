const userModel = require("../models/users");
const jwt = require("jsonwebtoken");

async function login(email, password) {
  email = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!email || typeof password !== "string" || !password) {
    const error = new Error("Credenciais inválidas");
    error.status = 401;
    throw error;
  }

  const user = await userModel.validUserLogin(email, password);

  if (!process.env.JWT_SECRET) {
    throw new Error("Configuração de autenticação indisponível");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  return { user, token };
}

async function register(data = {}) {
  const normalizedData = {
    ...data,
    username: typeof data.username === "string" ? data.username.trim() : "",
    email: typeof data.email === "string" ? data.email.trim().toLowerCase() : "",
    phone: typeof data.phone === "string" ? data.phone.trim() : "",
  };

  if (
    !normalizedData.username ||
    !normalizedData.email ||
    !normalizedData.phone ||
    !normalizedData.password ||
    !normalizedData.confirmPassword
  ) {
    throw new Error("Todos os campos são obrigatórios");
  }

  if (normalizedData.username.length > 120 || normalizedData.phone.length > 24) {
    throw new Error("Nome ou telefone excede o tamanho permitido");
  }
  if (!/^\d{10,11}$/.test(normalizedData.phone)) {
    throw new Error("Telefone deve conter DDD e 10 ou 11 números");
  }
  if (normalizedData.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedData.email)) {
    throw new Error("E-mail inválido");
  }
  if (typeof normalizedData.password !== "string" || normalizedData.password.length < 10 || !/[A-Za-z]/.test(normalizedData.password) || !/\d/.test(normalizedData.password)) {
    throw new Error("A senha deve ter ao menos 10 caracteres, uma letra e um número");
  }

  const userId = await userModel.createUser(normalizedData);

  return userId;
}

async function getUser(id) {
  if (!id) {
    throw new Error("id inválido");
  }

  const getUser = await userModel.getUserData(id);

  return getUser;
}

async function updateProfile(id, data = {}) {
  if (!id) throw new Error("Usuário não autenticado");

  const username = typeof data.username === "string" ? data.username.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  const whatsappMessage =
    typeof data.whatsapp_message === "string" ? data.whatsapp_message.trim() : "";

  if (!username || !phone) {
    throw new Error("Nome e telefone são obrigatórios");
  }
  if (username.length > 120 || phone.length > 24) {
    throw new Error("Nome ou telefone excede o tamanho permitido");
  }
  if (!/^\d{10,11}$/.test(phone)) {
    throw new Error("Telefone deve conter DDD e 10 ou 11 números");
  }
  if (whatsappMessage.length > 4000) {
    throw new Error("A mensagem do WhatsApp não pode exceder 4000 caracteres");
  }

  const updated = await userModel.updateUserProfile(id, {
    username,
    phone,
    whatsapp_message: whatsappMessage,
  });

  if (!updated) throw new Error("Usuário não encontrado");

  const savedUser = await userModel.getUserData(id);
  if (savedUser.whatsapp_message !== whatsappMessage) {
    throw new Error("A mensagem de cobrança não foi salva");
  }

  return savedUser;
}

module.exports = {
  login,
  register,
  getUser,
  updateProfile,
};
