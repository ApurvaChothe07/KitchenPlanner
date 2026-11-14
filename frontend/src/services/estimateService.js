import api from './api';

export const estimateService = {
  // Calculate itemized BOM cost estimate for a design
  calculateEstimate: async (designId, estimateRequest = {}) => {
    const response = await api.post(`/designs/${designId}/estimate`, estimateRequest);
    return response.data;
  },

  // Calculate side-by-side comparison between Option A and Option B
  compareEstimates: async (designId, comparisonRequest) => {
    const response = await api.post(`/designs/${designId}/estimate/compare`, comparisonRequest);
    return response.data;
  },
};
