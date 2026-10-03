const express = require("express");
const autenticar = require("../middleware/auth");

const clientController = require("../controllers/clientController");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const AuthController = require("../controllers/Auth/AuthController");
const { rateLimit } = require("express-rate-limit");
const router = express.Router();
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Muitas tentativas de cadastro. Tente novamente mais tarde." },
});

router.get('/', (req, res) => {
    res.send('Olá mundo')
})

// AUTH
router.post("/login", loginLimiter, AuthController.login);
router.post("/register", registerLimiter, AuthController.register);
router.post("/logout", AuthController.logout);

// USER
router.get("/me", autenticar, AuthController.getMe);
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


module.exports = router;
