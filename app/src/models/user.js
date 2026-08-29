const db = require("../database/connection");
const bcrypt = require("bcrypt");

async function searchUserByEmail(email) {
  const [rows] = await db.execute(`SELECT * FROM user WHERE email = ?`, [
    email,
  ]);

  return rows[0];
}

async function createUser(data) {
  const { firstName, lastName, age, email, phone, password, confirmPassword } =
    data;

  if (
    !firstName ||
    !lastName ||
    !age ||
    !email ||
    !phone ||
    !password ||
    !confirmPassword
  ) {
    throw new Error("Todos os campos são obrigatórios");
  }

  if (password !== confirmPassword) {
    throw new Error("As senhas não se coincidem");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await searchUserByEmail(email);
  
  if (existingUser) {
    throw new Error("E-mail já cadastrado");
  }

  const [result] = await db.execute(
    `INSERT INTO user (
            firstName,
            lastName,
            age,
            email,
            phone,
            password
        ) VALUES (?, ?, ?, ?, ?, ?)`,
    [firstName, lastName, age, email, phone, passwordHash],
  );

  return result.insertId;
}

async function getUserlogin(email, userPassword) {

  const user = await searchUserByEmail(email)

  if(!user) throw new Error("Usuário não encontrado.");

  const validPassword = await bcrypt.compare(userPassword, user.password);
  
  return validPassword
}

module.exports = {
  createUser,
  searchUserByEmail,
  getUserlogin,
};
