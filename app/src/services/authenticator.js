const userModel = require("../models/users");
const jwt = require("jsonwebtoken");

async function login(email, password) {
  if (!email) throw new Error("email errado");
  if (!password) throw new Error("password errado");

  const user = await userModel.validUserLogin(email, password);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  return { ...user, token };
}

async function register(data) {
  if (
    !data.username ||
    !data.email ||
    !data.phone ||
    !data.password ||
    !data.confirmPassword
  ) {
    throw new Error("Todos os campos são obrigatórios");
  }

  const userId = await userModel.createUser(data);

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
