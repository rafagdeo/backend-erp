const productsModel = require("../models/products");

function validaNumber(value, integer = false) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return `${value} inválida`;
  }
  if (integer && !Number.isInteger(value)) {
    return `${value} inválida`;
  }
}

async function createProduct(data, userId) {
  const { nome, quantidade_estoque, preco_venda, custo_produto } = data || {};

  if (typeof nome !== "string" || !nome.trim() || nome.trim().length > 120) {
    return {
      success: false,
      message: "Nome inválido",
    };
  }

  const estoqueError = validaNumber(quantidade_estoque, true);

  if (estoqueError) {
    return {
      success: false,
      message: estoqueError,
    };
  }

  const precoError = validaNumber(preco_venda);

  if (precoError) {
    return {
      success: false,
      message: precoError,
    };
  }

  const custoError = validaNumber(custo_produto);

  if (custoError) {
    return {
      success: false,
      message: custoError,
    };
  }

  return await productsModel.createProduct({ ...data, nome: nome.trim() }, userId);
}

async function editProduct(data, productId, userId) {
  const { nome, quantidade_estoque, preco_venda, custo_produto } = data || {};

  if (nome !== undefined) {
    if (typeof nome !== "string" || !nome.trim() || nome.trim().length > 120) {
      return "Nome inválido";
    }
  }

  if (quantidade_estoque !== undefined) {
    const estoqueError = validaNumber(quantidade_estoque, true);

    if (estoqueError) {
      return estoqueError;
    }
  }

  if (preco_venda !== undefined) {
    const precoError = validaNumber(preco_venda);

    if (precoError) {
      return precoError;
    }
  }

  if (custo_produto !== undefined) {
    const custoError = validaNumber(custo_produto);

    if (custoError) {
      return custoError;
    }
  }

  const produtoEditado = await productsModel.editProduct(
    data,
    productId,
    userId,
  );

  return produtoEditado;
}

async function deleteProduct(productId, userId) {
  const produtoDeletado = await productsModel.deleteProduct(productId, userId);

  return produtoDeletado;
}

async function listProducts(userId) {
  const result = await productsModel.listProducts(userId);

  return result;
}

module.exports = {
  createProduct,
  editProduct,
  deleteProduct,
  listProducts,
};
