const userModel = require("../models/users");
const jwt = require("jsonwebtoken");

async function login(email, password) {
  if (!email) throw new Error("email errado");
  if (!password) throw new Error("password errado");

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

module.exports = {
  login,
  register,
  getUser,
};
