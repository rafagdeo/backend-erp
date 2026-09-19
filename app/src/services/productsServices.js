const productsModel = require("../models/products");

async function createProduct(data, userId) {
  const { nome, quantidade_estoque, preco_venda, custo_produto } = data || {};

  if (nome === undefined || nome === null || nome === "") {
    return "Nome inválido";
  }

  if (
    typeof quantidade_estoque !== "number" ||
    quantidade_estoque === null ||
    quantidade_estoque === undefined ||
    quantidade_estoque < 0
  ) {
    return "Quantidade de estoque inválida";
  }

  if (
    typeof preco_venda !== "number" ||
    preco_venda === null ||
    preco_venda === undefined ||
    preco_venda < 0
  ) {
    return "Preço do produto inválido";
  }

  if (
    typeof custo_produto !== "number" ||
    custo_produto === null ||
    custo_produto === undefined ||
    custo_produto < 0
  ) {
    return "Custo do produto inválido";
  }

  const produtoCriado = await productsModel.createProduct(data, userId);

  return produtoCriado;
}

module.exports = {
  createProduct,
};
