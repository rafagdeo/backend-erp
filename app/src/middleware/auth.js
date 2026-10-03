const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;
    const cookieToken = req.headers.cookie
        ?.split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('token='))
        ?.slice('token='.length);
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : cookieToken;

    if (!token) {
        return res.status(401).json({
            erro: 'Usuário não autenticado'
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, usuario) => {

            if (err) {
                return res.status(403).json({
                    erro: 'Usuário não autenticado'
                });
            }

            req.usuario = usuario;

            next();
        }
    );
}

module.exports = autenticar;