const productsServices = require('../services/productsServices');

async function createProduct(req, res){
    try{
        const product = await productsServices.createProduct(
            req.body, req.usuario.id
        );

        res.status(200).json({
            message: product,
            
        })
    }catch(err){
        res.status(500).json({
            message: `${err}.`
        })
    }

}

module.exports = {
    createProduct,
}