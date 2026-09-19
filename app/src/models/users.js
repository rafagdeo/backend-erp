const db = require("../database/connection");
const bcrypt = require("bcrypt");

async function searchUserByEmail(email) {
  const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [email]);
  return rows[0];
}

async function createUser(data) {
  const { username, email, phone, password, confirmPassword } = data;

  if (!username || !email || !phone || !password || !confirmPassword) {
    throw new Error("Todos os campos são obrigatórios");
  }

  if (password !== confirmPassword) {
    throw new Error("As senhas não se coincidem");
  }

  const existingUser = await searchUserByEmail(email);
  if (existingUser) throw new Error("E-mail já cadastrado");

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await db.execute(
    `INSERT INTO users (username, email, phone, password)
     VALUES (?, ?, ?, ?)`,
    [username, email, phone, passwordHash]
  );

  return result.insertId;
}

async function getUserlogin(email, userPassword) {
  const user = await searchUserByEmail(email);
  if (!user) throw new Error("Usuário não encontrado.");

  const validPassword = await bcrypt.compare(userPassword, user.password);
  if (!validPassword) throw new Error("Senha inválida.");

  delete user.password;
  return user;
}

module.exports = {
  createUser,
  searchUserByEmail,
  getUserlogin,
};