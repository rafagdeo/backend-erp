const userServices = require("../../services/authenticator");

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const validateLogin = await userServices.login(email, password);

    return res.status(200).json({
      message: "Sucessfully!",
      user: validateLogin,
    });
  } catch (err) {
    res.status(500).json({
      message: `${err}`,
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

async function logout(req, res) {
  try {
    res.clearCookie("token");

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
  logout,
};
