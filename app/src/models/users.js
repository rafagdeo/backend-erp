const db = require("../database/connection");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");

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
  if (!user) {
    const error = new Error("Credenciais inválidas");
    error.status = 401;
    throw error;
  }

  const isBcrypt = typeof user.password === "string" && /^\$2[aby]\$\d{2}\$/.test(user.password);
  let validPassword = isBcrypt
    ? await bcrypt.compare(userPassword, user.password)
    : typeof user.password === "string" && /^[a-f0-9]{32}$/i.test(user.password)
      && crypto.timingSafeEqual(
        Buffer.from(crypto.createHash("md5").update(userPassword).digest("hex"), "utf8"),
        Buffer.from(user.password.toLowerCase(), "utf8"),
      );
  if (!validPassword) {
    const error = new Error("Credenciais inválidas");
    error.status = 401;
    throw error;
  }

  // Compatibilidade de migração: contas MD5 são convertidas para bcrypt
  // depois do primeiro login correto. Novos cadastros já usam bcrypt.
  if (!isBcrypt) {
    const passwordHash = await bcrypt.hash(userPassword, 10);
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [passwordHash, user.id]);
  }

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
