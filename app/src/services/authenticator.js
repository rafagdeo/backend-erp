const userModel = require("../models/users");
const jwt = require("jsonwebtoken");

async function login(email, password) {
  if (!email) throw new Error("email errado");
  if (!password) throw new Error("password errado");

  const user = await userModel.getUserlogin(email, password);

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return { ...user, token };
}

async function register(data) {
  if (
    !data.firstName ||
    !data.lastName ||
    !data.birthDate ||
    !data.email ||
    !data.phone ||
    !data.password
  ) {
    throw new Error("Todos os campos são obrigatórios");
  }

  const userId = await userModel.createUser(data);

  return userId;
}

async function getUser(email) {
  if(!email){
    throw new Error("Email inválido")
  }

  const getUser = await userModel.searchUserByEmail(email)
  return getUser;
}

module.exports = {
  login,
  register,
  getUser
};