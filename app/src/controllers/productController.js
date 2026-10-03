const productsServices = require("../services/productsServices");

async function createProduct(req, res) {
  try {
    const product = await productsServices.createProduct(
      req.body,
      req.usuario.id,
    );

    if (!product.success) {
      return res.status(400).json({
        message: product.message,
      });
    }

    return res.status(201).json({
      message: "Produto criado com sucesso",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}

async function editProduct(req, res) {
  try {
    const product = await productsServices.editProduct(
      req.body,
      req.params.id,
      req.usuario.id,
    );

    if (typeof product === "string") {
      return res.status(400).json({
        message: product,
      });
    }

    if (!product) {
      return res.status(404).json({
        message: "Produto não encontrado",
      });
    }

    return res.status(200).json({
      message: "Produto editado com sucesso",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await productsServices.deleteProduct(
      req.params.id,
      req.usuario.id,
    );

    if (!product) {
      return res.status(404).json({
        message: "Produto não encontrado.",
      });
    }

    return res.status(200).json({
      message: "Produto deletado com sucesso",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}

async function listProducts(req, res) {
  try {
    const usuarioId = req.usuario.id;

    const resultado = await productsServices.listProducts(usuarioId);

    return res.status(200).json({ products: resultado });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}

module.exports = {
  createProduct,
  editProduct,
  deleteProduct,
  listProducts,
};
