const projectsService = require('../services/projects');

function index(req, res) {
    return res.json({
        message: 'Olá mundo.'
    });
}

async function createProject(req, res) {
    try {
        const projectData = req.body || {};
        const createdProject = await projectsService.createProject(projectData);

        return res.status(201).json({
            message: 'Project successfully created!',
            project: createdProject
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Error creating project'
        });
    }
}

function searchProject(req, res) {
    const { id } = req.params;

    return res.json({
        message: `searching project ${id}`
    });
}

async function listProjects(req, res) {
    try {
        const projectsListed = await projectsService.listProjects();

        return res.status(200).json(projectsListed);
    } catch (err) {
        return res.status(500).json({
            message: 'Error to listing projects'
        });
    }
}

module.exports = {
    index,
    createProject,
    searchProject,
    listProjects
};