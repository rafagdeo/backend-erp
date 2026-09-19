const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {

    const authHeader = req.headers['authorization'];

    console.log('AUTH HEADER:', authHeader);

    const token = authHeader && authHeader.split(' ')[1];

    console.log('TOKEN:', token);

    if (!token) {
        return res.status(401).json({
            erro: 'Token não enviado'
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, usuario) => {

            if (err) {
                console.log('ERRO JWT:', err);

                return res.status(403).json({
                    erro: 'Token inválido'
                });
            }

            console.log('USUARIO:', usuario);

            req.usuario = usuario;

            next();
        }
    );
}

module.exports = autenticar;