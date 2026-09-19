const userServices = require('../../services/authenticator');

async function login(req, res) {
    try {
        const { email, password } = req.body || {}
        const validateLogin = await userServices.login(email, password)

        return res.status(200).json({
            message: "Sucessfully!",
            user: validateLogin
        })
    }catch(err){
        res.status(500).json({
            message: `${err}`
        })
    }
}

async function register(req, res) {
    try{
        const projectData = req.body || {};
        const registerUser = await userServices.register(projectData);

        return res.status(200).json ({
            message: "User sucessfully created!",
            user: registerUser
        })
    }catch(err){
        return res.status(500).json({
            message: err
        })
    }
}

async function getMe(req, res) {
    try {

        const usuarioId = req.usuario.id;

        const user = await userServices.getUserById(usuarioId);

        return res.status(200).json({
            user
        });

    } catch (err) {

        return res.status(500).json({
            message: err.message
        });

    }
}


module.exports = {
    login,
    register,
    getMe
}