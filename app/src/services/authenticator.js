const userModel = require("../models/user");

async function login(email, password){
  if(!email) {
    throw new Error("email errado")
  }
  if(!password) {
    throw new Error("password errado")
  }

  const validateLogin = await userModel.getUserlogin(email, password)
  return validateLogin
}

async function register(data) {
  if (
    !data.firstName ||
    !data.lastName ||
    !data.age ||
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
