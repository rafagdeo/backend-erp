const crypto = require("node:crypto");
const usersModel = require("../models/users");
const { smtpTransport, smtpDiagnostic } = require("./smtpService");

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

async function requestPasswordReset(email) {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Informe um e-mail válido.");
  }
  const transport = smtpTransport();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const user = await usersModel.createPasswordResetToken(
    normalizedEmail,
    tokenHash,
  );
  if (!user) return;

  const resetBaseUrl = process.env.PASSWORD_RESET_URL || "http://localhost:5173/reset-password";
  const resetUrl = new URL(resetBaseUrl);
  if (!['http:', 'https:'].includes(resetUrl.protocol)) throw new Error("PASSWORD_RESET_URL deve usar HTTP ou HTTPS");
  resetUrl.searchParams.set("token", rawToken);
  const name = escapeHtml(user.username || "");
  try {
    await transport.sendMail({
    from: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim(),
    to: user.email,
    subject: "Redefinição de senha | Nexo Gestão",
    text: `Olá${user.username ? `, ${user.username}` : ""}! Use este link para redefinir sua senha (válido por 1 hora): ${resetUrl.href}\n\nSe você não solicitou esta redefinição, ignore este e-mail.`,
    html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f3f6f1;font-family:Arial,sans-serif;color:#29372e"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:36px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fff;border:1px solid #e5ebe2;border-radius:12px"><tr><td style="padding:32px"><div style="font-size:13px;font-weight:bold;letter-spacing:1px;color:#52734d">NEXO GESTÃO</div><h1 style="font-size:23px;margin:24px 0 10px">Redefina sua senha</h1><p style="font-size:15px;line-height:1.6;color:#68746a">Olá${name ? `, ${name}` : ""}! Recebemos um pedido para criar uma nova senha para sua conta.</p><p style="margin:26px 0"><a href="${resetUrl.href}" style="display:inline-block;border-radius:7px;background:#1d3b2d;padding:14px 22px;color:#fff;text-decoration:none;font-weight:bold">Redefinir minha senha</a></p><p style="font-size:13px;line-height:1.6;color:#7f8980">Este link expira em 1 hora e só pode ser usado uma vez. Se você não solicitou a redefinição, ignore este e-mail.</p><p style="font-size:12px;line-height:1.5;color:#89938a;word-break:break-all">Se o botão não abrir, copie este endereço:<br>${resetUrl.href}</p></td></tr></table></td></tr></table></body></html>`,
    });
  } catch (error) {
    console.error("Falha ao enviar e-mail de redefinição:", smtpDiagnostic(error));
    throw Object.assign(new Error("Não conseguimos enviar o link agora. Tente novamente em alguns minutos."), { status: 503 });
  } finally {
    transport.close();
  }
}

async function resetPassword(token, password, confirmPassword) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error("Link de redefinição inválido ou expirado.");
  }
  if (typeof password !== "string" || password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("A senha deve ter ao menos 10 caracteres, uma letra e um número.");
  }
  if (password !== confirmPassword) throw new Error("As senhas não coincidem.");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const reset = await usersModel.resetPassword(tokenHash, password);
  if (!reset) throw new Error("Link de redefinição inválido ou expirado.");
}

module.exports = { requestPasswordReset, resetPassword, smtpTransport };
