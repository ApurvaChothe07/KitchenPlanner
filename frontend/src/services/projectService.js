import api from './api';

export const projectService = {
  async getProjects() {
    const res = await api.get('/projects');
    return res.data;
  },

  async getProject(id) {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  async createProject(data) {
    const res = await api.post('/projects', data);
    return res.data;
  },

  async updateProject(id, data) {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },

  async deleteProject(id) {
    await api.delete(`/projects/${id}`);
  }
};
