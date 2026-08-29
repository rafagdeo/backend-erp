const express = require('express');
const SiteController = require('../controllers/SiteController')
const router = express.Router()

router.get('/', SiteController.index);
router.get('/projects', SiteController.listProjects);
router.post('/projects', SiteController.createProject);
router.get('/projects/:id', SiteController.searchProject);


module.exports = router;