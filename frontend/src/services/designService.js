import api from './api';

export const designService = {
  async getDesignsByProject(projectId) {
    const res = await api.get(`/projects/${projectId}/designs`);
    return res.data;
  },

  async createDesign(projectId, data) {
    const res = await api.post(`/projects/${projectId}/designs`, data);
    return res.data;
  },

  async getDesign(id) {
    const res = await api.get(`/designs/${id}`);
    return res.data;
  },

  async updateDesign(id, data) {
    const res = await api.put(`/designs/${id}`, data);
    return res.data;
  },

  async addCabinet(designId, data) {
    const res = await api.post(`/designs/${designId}/cabinets`, data);
    return res.data;
  },

  async updateCabinet(designId, cabinetId, data) {
    const res = await api.put(`/designs/${designId}/cabinets/${cabinetId}`, data);
    return res.data;
  },

  async deleteCabinet(designId, cabinetId) {
    await api.delete(`/designs/${designId}/cabinets/${cabinetId}`);
  }
};
