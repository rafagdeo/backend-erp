const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const nodemailer = require("nodemailer");
const { smtpOptions, smtpDiagnostic } = require("../app/src/services/smtpService");
const users = require("../app/src/models/users");
const reset = require("../app/src/services/passwordResetService");

const config = {
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "465",
  SMTP_SECURE: "false",
  SMTP_USER: "sender@example.test",
  SMTP_PASSWORD: "test-only-password",
  SMTP_FROM: "",
  PASSWORD_RESET_URL: "https://erp.example.test/reset-password",
};

test("porta 465 inicia TLS mesmo se SMTP_SECURE estiver incorreto", () => {
  const options = smtpOptions(config);
  assert.equal(options.secure, true);
  assert.equal(options.defaults.from, config.SMTP_USER);
  assert.equal(options.connectionTimeout, 15000);
});

test("porta 587 exige STARTTLS e não começa com TLS implícito", () => {
  const options = smtpOptions({ ...config, SMTP_PORT: "587", SMTP_SECURE: "true" });
  assert.equal(options.secure, false);
  assert.equal(options.requireTLS, true);
});

test("configuração incompleta e diagnóstico não expõem credenciais", () => {
  assert.throws(() => smtpOptions({ ...config, SMTP_PASSWORD: "" }), { code: "SMTP_CONFIG" });
  const diagnostic = smtpDiagnostic({ code: "EAUTH", command: "AUTH PLAIN", responseCode: 535, message: "secret credentials" });
  assert.equal(diagnostic.responseCode, 535);
  assert.match(diagnostic.hint, /autenticação/);
  assert.doesNotMatch(JSON.stringify(diagnostic), /secret credentials/);
});

test("diagnóstico preserva a recusa SMTP sem expor destinatário ou token", () => {
  const diagnostic = smtpDiagnostic({
    code: "EMESSAGE",
    command: "DATA",
    responseCode: 550,
    response: '550 5.7.1 Message rejected for person@example.test\r\nhttps://example.test/reset?token=private-token',
  });
  assert.equal(diagnostic.responseCode, 550);
  assert.match(diagnostic.response, /550 5.7.1 Message rejected/);
  assert.doesNotMatch(diagnostic.response, /person@example.test|private-token|[\r\n]/);
});

test("token expira uma hora após o horário do banco, independente do fuso do Node", async (context) => {
  const db = require("../app/src/database/connection");
  const statements = [];
  let released = false;
  context.mock.method(db, "execute", async () => [[{ id: 2, email: "person@example.test", username: "Cliente" }]]);
  context.mock.method(db, "getConnection", async () => ({
    beginTransaction: async () => {},
    execute: async (sql, values) => { statements.push({ sql, values }); return [{ affectedRows: 1 }]; },
    commit: async () => {},
    rollback: async () => {},
    release: () => { released = true; },
  }));
  const user = await users.createPasswordResetToken("person@example.test", "a".repeat(64));
  const insert = statements.find(({ sql }) => sql.startsWith("INSERT"));
  assert.match(insert.sql, /DATE_ADD\(NOW\(\), INTERVAL 1 HOUR\)/);
  assert.deepEqual(insert.values, [2, "a".repeat(64)]);
  assert.equal(user.id, 2);
  assert.equal(released, true);
});

test("e-mail de recuperação contém botão e token cujo hash é persistido", async () => {
  const before = Object.fromEntries(Object.keys(config).map((key) => [key, process.env[key]]));
  const originalCreate = nodemailer.createTransport;
  const originalToken = users.createPasswordResetToken;
  let message;
  let stored;
  Object.assign(process.env, config);
  const mailStream = originalCreate({ streamTransport: true, buffer: true });
  nodemailer.createTransport = () => ({
    sendMail: async (mail) => {
      message = mail;
      const output = await mailStream.sendMail(mail);
      assert.ok(output.message.length > 0);
      return output;
    },
    close() {},
  });
  users.createPasswordResetToken = async (email, hash) => {
    stored = { email, hash };
    return { email, username: "<Cliente>" };
  };
  try {
    await reset.requestPasswordReset(" Person@Example.test ");
    assert.equal(message.to, "person@example.test");
    assert.equal(message.from, config.SMTP_USER);
    assert.match(message.html, /Redefinir minha senha/);
    assert.match(message.html, /&lt;Cliente&gt;/);
    const link = new URL(message.html.match(/href="([^"]+)"/)[1]);
    assert.equal(link.origin, "https://erp.example.test");
    assert.equal(link.pathname, "/reset-password");
    assert.equal(crypto.createHash("sha256").update(link.searchParams.get("token")).digest("hex"), stored.hash);
  } finally {
    mailStream.close();
    nodemailer.createTransport = originalCreate;
    users.createPasswordResetToken = originalToken;
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
