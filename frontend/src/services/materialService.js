import api from './api';

export const materialService = {
  // Get active materials, optionally filtered by category
  getAllMaterials: async (category) => {
    const params = category ? { category } : {};
    const response = await api.get('/materials', { params });
    return response.data;
  },

  // Get material by ID
  getMaterialById: async (id) => {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },

  // Create new catalogue material (admin/authorized)
  createMaterial: async (materialData) => {
    const response = await api.post('/materials', materialData);
    return response.data;
  },

  // Update catalogue material
  updateMaterial: async (id, materialData) => {
    const response = await api.put(`/materials/${id}`, materialData);
    return response.data;
  },
};
