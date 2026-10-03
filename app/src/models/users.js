const db = require("../database/connection");
const bcrypt = require("bcrypt");

async function searchUserByEmail(email) {
  const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [
    email,
  ]);
  return rows[0];
}

async function createUser(data) {
  const { username, email, phone, password, confirmPassword } = data;

  if (password !== confirmPassword) {
    throw new Error("As senhas não coincidem");
  }

  const existingUser = await searchUserByEmail(email);

  if (existingUser) {
    throw new Error("E-mail já cadastrado");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await db.execute(
    `INSERT INTO users
        (username, email, phone, password)
        VALUES (?, ?, ?, ?)`,
    [username, email, phone, passwordHash],
  );

  return result.insertId;
}

async function validUserLogin(email, userPassword) {
  const user = await searchUserByEmail(email);
  if (!user) throw new Error("Usuário não encontrado.");

  const validPassword = await bcrypt.compare(userPassword, user.password);
  if (!validPassword) throw new Error("Senha inválida.");

  delete user.password;
  return user;
}

async function getUserData(id) {
  const [result] = await db.execute(
    `
      SELECT id, username, email, phone, whatsapp_message FROM users WHERE id = ?`,
    [id],
  );

  return result[0];
}

async function updateUserProfile(id, data) {
  const [result] = await db.execute(
    `UPDATE users SET username = ?, phone = ?, whatsapp_message = ? WHERE id = ?`,
    [data.username, data.phone, data.whatsapp_message, id],
  );

  if (result.affectedRows === 0) {
    const user = await getUserData(id);
    if (!user) return false;
    if (
      user.username !== data.username ||
      user.phone !== data.phone ||
      user.whatsapp_message !== data.whatsapp_message
    ) {
      throw new Error("Não foi possível salvar as alterações do perfil");
    }
  }

  return true;
}

module.exports = {
  createUser,
  searchUserByEmail,
  validUserLogin,
  getUserData,
  updateUserProfile,
};
