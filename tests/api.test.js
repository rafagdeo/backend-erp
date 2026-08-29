const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const projectsService = require('../app/src/services/projects');
const ProjectController = require('../app/src/controllers/ProjectController');

describe('Projeto backend', () => {
  it('deve exportar os métodos do service corretamente', () => {
    assert.equal(typeof projectsService.createProject, 'function');
    assert.equal(typeof projectsService.listProjects, 'function');
  });

  it('deve exportar os métodos do controller corretamente', () => {
    assert.equal(typeof ProjectController.createProject, 'function');
    assert.equal(typeof ProjectController.listProjects, 'function');
  });
});
