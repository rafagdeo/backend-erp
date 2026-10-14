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

async function createPasswordResetToken(email, tokenHash) {
  const user = await searchUserByEmail(email);
  if (!user) return null;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
      [user.id],
    );
    await connection.execute(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))",
      [user.id, tokenHash],
    );
    await connection.commit();
    return { id: user.id, email: user.email, username: user.username };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function resetPassword(tokenHash, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1 FOR UPDATE",
      [tokenHash],
    );
    const reset = rows[0];
    if (!reset) {
      await connection.rollback();
      return false;
    }
    await connection.execute("UPDATE users SET password = ? WHERE id = ?", [passwordHash, reset.user_id]);
    await connection.execute("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?", [reset.id]);
    await connection.execute("UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL", [reset.user_id]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createUser,
  searchUserByEmail,
  validUserLogin,
  getUserData,
  updateUserProfile,
  createPasswordResetToken,
  resetPassword,
};
