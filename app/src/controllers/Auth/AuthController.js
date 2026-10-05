const userServices = require("../../services/authenticator");

function sessionCookieOptions() {
  const production = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    path: "/",
  };
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const validateLogin = await userServices.login(email, password);

    res.cookie("token", validateLogin.token, {
      ...sessionCookieOptions(),
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login realizado com sucesso.",
      user: validateLogin.user,
    });
  } catch (err) {
    const invalidCredentials = err.status === 401;
    if (!invalidCredentials) console.error("Falha interna no login:", err.code || err.message);
    return res.status(invalidCredentials ? 401 : 500).json({
      message: invalidCredentials ? "E-mail ou senha inválidos." : "Serviço de autenticação indisponível. Tente novamente mais tarde.",
    });
  }
}

async function register(req, res) {
  try {
    const projectData = req.body;

    const registerUser = await userServices.register(projectData);

    return res.status(201).json({
      message: "Usuário criado com sucesso!",
      userId: registerUser,
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
}

async function getMe(req, res) {
  try {
    const usuario = req.usuario.id;

    const user = await userServices.getUser(usuario);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}

async function updateProfile(req, res) {
  try {
    const user = await userServices.updateProfile(req.usuario.id, req.body);
    return res.status(200).json({ message: "Perfil atualizado.", user });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function logout(req, res) {
  try {
    res.clearCookie("token", {
      ...sessionCookieOptions(),
    });

    return res.status(200).json({
      message: "Logout realizado com sucesso",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}

module.exports = {
  login,
  register,
  getMe,
  updateProfile,
  logout,
};
