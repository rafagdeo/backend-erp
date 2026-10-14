const nodemailer = require("nodemailer");

function smtpOptions(env = process.env) {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const password = env.SMTP_PASSWORD;
  const port = Number(env.SMTP_PORT || 587);
  if (!host || !user || !password || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw Object.assign(new Error("Serviço de e-mail temporariamente indisponível."), {
      code: "SMTP_CONFIG",
      status: 503,
    });
  }

  // Port 465 starts TLS immediately; waiting for a plaintext greeting times out.
  const secure = port === 465 || (port !== 587 && String(env.SMTP_SECURE).toLowerCase() === "true");
  return {
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass: password },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    defaults: { from: env.SMTP_FROM?.trim() || user },
  };
}

function smtpTransport() {
  const { defaults, ...options } = smtpOptions();
  return nodemailer.createTransport(options, defaults);
}

function smtpResponse(response, env = process.env) {
  if (typeof response !== "string") return null;
  let safe = response;
  // Keep the provider's reason, excluding credentials, recipients and reset tokens.
  for (const secret of [env.SMTP_PASSWORD, env.SMTP_USER]) {
    if (secret) safe = safe.split(secret).join("[redigido]");
  }
  return safe
    .replace(/[^\s<>@]+@[^\s<>@]+/g, "[email]")
    .replace(/([?&]token=)[^\s&<>"']+/gi, "$1[redigido]")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 1000);
}

function smtpDiagnostic(error) {
  const code = error.code || "SMTP_ERROR";
  const hints = {
    SMTP_CONFIG: "Preencha SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASSWORD no ambiente do backend.",
    EAUTH: "O servidor recusou a autenticação. Confira o usuário e a senha da caixa de e-mail.",
    EDNS: "Não foi possível resolver o endereço SMTP. Confira o host e o DNS do servidor.",
    ETIMEDOUT: "A conexão SMTP excedeu o tempo limite. Confira liberação da porta na hospedagem e a configuração TLS.",
    ESOCKET: "Falha na conexão segura. Confira a porta, o certificado e a conectividade do servidor.",
    ECONNECTION: "Não foi possível conectar ao servidor SMTP. Confira host, porta e firewall.",
    EENVELOPE: "O SMTP recusou o remetente ou destinatário. Confira SMTP_FROM e as permissões da caixa.",
    EMESSAGE: "O SMTP recusou a mensagem. Confira limites e políticas de envio da caixa.",
  };
  return {
    code,
    command: error.command || null,
    responseCode: error.responseCode || null,
    response: smtpResponse(error.response),
    hint: hints[code] || "O provedor recusou a operação. Confira os registros e os limites da caixa de e-mail.",
  };
}

module.exports = { smtpOptions, smtpTransport, smtpDiagnostic };
