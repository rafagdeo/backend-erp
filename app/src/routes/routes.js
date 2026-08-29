const express = require('express');
const ProjectController = require('../controllers/ProjectController')
const AuthController = require('../controllers/Auth/AuthController')

const router = express.Router()

//users
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/user/:email', AuthController.getUserByEmail);

//projects
router.get('/', ProjectController.index);
router.get('/projects', ProjectController.listProjects);
router.post('/projects', ProjectController.createProject);
router.get('/projects/:id', ProjectController.searchProject);


module.exports = router;