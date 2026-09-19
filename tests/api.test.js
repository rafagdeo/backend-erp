const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const projectsService = require('../app/src/services/projects');
const clientController = require('../app/src/controllers/clientController');

describe('Projeto backend', () => {
  it('deve exportar os métodos do service corretamente', () => {
    assert.equal(typeof projectsService.createProject, 'function');
    assert.equal(typeof projectsService.listProjects, 'function');
  });

  it('deve exportar os métodos do controller corretamente', () => {
    assert.equal(typeof clientController.createProject, 'function');
    assert.equal(typeof clientController.listProjects, 'function');
  });
});
