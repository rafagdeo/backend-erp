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
            message: `${err}. erro ao efetuar o login`
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
            message: "Error to create user."
        })
    }
}

async function getUserByEmail(req, res){
    try {
        const userData = req.params.email || {};
        const getEmail = await userServices.getUser(userData)

        return res.status(200).json({
            message: "E-mail encontrado",
            user: getEmail
        })
    }catch(err){
        return res.status(500).json({
            message: `${err}. Erro ao buscar o email`
        })
    }
}


module.exports = {
    login,
    register,
    getUserByEmail
}