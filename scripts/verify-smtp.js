const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const { smtpTransport, smtpDiagnostic } = require("../app/src/services/smtpService");

async function main() {
  let transport;
  try {
    transport = smtpTransport();
    await transport.verify();
    console.log("SMTP OK: conexão segura e autenticação confirmadas. Nenhum e-mail foi enviado.");
  } catch (error) {
    console.error("SMTP falhou:", smtpDiagnostic(error));
    process.exitCode = 1;
  } finally {
    transport?.close();
  }
}

main();
