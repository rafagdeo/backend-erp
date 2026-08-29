const modelProject = require("../models/projects")

async function createProject(data) {
    if(!data.name || !data.category_id || !data.image_url){
        throw new Error("Todos os campos são obrigatótios")
    }

    const projectId = await modelProject.create(data); 
    const project = await modelProject.findById(projectId);
    
    return project;
}

async function listProjects(id) {
    const project = await modelProject.findAll(id)
    if(!project){
        throw new Error("Projetos não encontrado");
    }

    return project;
}

module.exports = {
    createProject,
    listProjects
};