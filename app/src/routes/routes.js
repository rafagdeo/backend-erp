const express = require("express");
const autenticar = require("../middleware/auth"); 

const clientController = require("../controllers/clientController");
const productController = require("../controllers/productController");
const AuthController = require("../controllers/Auth/AuthController");
const router = express.Router();

// AUTH
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);

// USER
router.get("/user/me", autenticar, AuthController.getMe);

// CLIENT
router.post("/create-client", autenticar, clientController.createClient);
router.get("/list-clients", autenticar, clientController.listClients);
router.post("/delete-client", autenticar, clientController.deleteClient);

//PRODUCT
router.post("/create-product", autenticar, productController.createProduct)
module.exports = router;
