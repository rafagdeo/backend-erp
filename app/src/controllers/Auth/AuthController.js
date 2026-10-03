const userServices = require("../../services/authenticator");

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const validateLogin = await userServices.login(email, password);
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", validateLogin.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "Login realizado com sucesso.",
      user: validateLogin.user,
    });
  } catch (err) {
    return res.status(401).json({
      message: "E-mail ou senha inválidos.",
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
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
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
