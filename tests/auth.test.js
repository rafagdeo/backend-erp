const assert = require('node:assert/strict');
const { it } = require('node:test');
const service = require('../app/src/services/authenticator');
const users = require('../app/src/models/users');
const controller = require('../app/src/controllers/Auth/AuthController');

it('normaliza email sem alterar a senha e emite JWT', async () => {
  const original = users.validUserLogin;
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret-for-authentication-only';
  users.validUserLogin = async (email, password) => {
    assert.equal(email, 'conta@example.com');
    assert.equal(password, ' senha123 ');
    return { id: 1, email };
  };
  try {
    assert.ok((await service.login(' Conta@Example.com ', ' senha123 ')).token);
  } finally {
    users.validUserLogin = original;
    if (secret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secret;
  }
});

it('login e logout usam cookie HTTPS compatível com domínios diferentes', async () => {
  const original = service.login;
  const env = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  service.login = async () => ({ token: 'test-token', user: { id: 1 } });
  let cookie;
  let cleared;
  const res = {
    cookie(name, token, options) { cookie = { name, token, options }; },
    clearCookie(name, options) { cleared = { name, options }; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    await controller.login({ body: { email: 'conta@example.com', password: 'senha' } }, res);
    assert.equal(res.code, 200);
    assert.equal(cookie.options.sameSite, 'none');
    assert.equal(cookie.options.secure, true);
    assert.equal(cookie.options.httpOnly, true);
    await controller.logout({}, res);
    const { maxAge, ...options } = cookie.options;
    assert.equal(maxAge, 3600000);
    assert.deepEqual(cleared, { name: cookie.name, options });
  } finally {
    service.login = original;
    if (env === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = env;
  }
});

it('diferencia credenciais inválidas de falha no banco ou JWT', async () => {
  const original = service.login;
  const log = console.error;
  console.error = () => {};
  const res = {
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    service.login = async () => { throw Object.assign(new Error('Credenciais inválidas'), { status: 401 }); };
    await controller.login({ body: {} }, res);
    assert.equal(res.code, 401);
    service.login = async () => { throw new Error('database-secret-detail'); };
    await controller.login({ body: {} }, res);
    assert.equal(res.code, 500);
    assert.doesNotMatch(res.body.message, /database-secret-detail/);
  } finally {
    service.login = original;
    console.error = log;
  }
});
