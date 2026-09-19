const express = require("express");
const autenticar = require("../middleware/auth");

const clientController = require("../controllers/clientController");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const AuthController = require("../controllers/Auth/AuthController");
const router = express.Router();

// AUTH
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/logout", AuthController.logout);

// USER
router.get("/user/:id", autenticar, AuthController.getMe);

// CLIENT
router.post("/create-client", autenticar, clientController.createClient);
router.get("/list-clients", autenticar, clientController.listClients);
router.post("/delete-client", autenticar, clientController.deleteClient);
router.patch("/client/:id", autenticar, clientController.editClient);

//PRODUCT
router.post("/create-product", autenticar, productController.createProduct);
router.patch("/product/:id", autenticar, productController.editProduct);
router.delete("/product/:id", autenticar, productController.deleteProduct);
router.get("/products", autenticar, productController.listProducts);

//ORDERS
router.post("/create-order", autenticar, orderController.createOrder);
router.patch("/order/:id", autenticar, orderController.editOrder);
router.get("/orders", autenticar, orderController.viewOrders);
router.get("/orders/client/:clienteId", autenticar, orderController.orderByClient);

//ORDERS ITEMS


module.exports = router;
