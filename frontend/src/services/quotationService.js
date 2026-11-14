import api from './api';

export const quotationService = {
  // Create quotation from design
  createQuotation: async (designId, quotationData = {}) => {
    const response = await api.post(`/designs/${designId}/quotations`, quotationData);
    return response.data;
  },

  // List quotations for a project
  getQuotationsForProject: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/quotations`);
    return response.data;
  },

  // Get full quotation details
  getQuotationById: async (id) => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },

  // Update status (e.g. DRAFT -> ISSUED, or ISSUED -> CANCELLED)
  updateStatus: async (id, status) => {
    const response = await api.patch(`/quotations/${id}/status`, { status });
    return response.data;
  },

  // Download PDF file as blob
  downloadPdf: async (id, quotationNumber) => {
    const response = await api.get(`/quotations/${id}/pdf`, {
      responseType: 'blob',
    });

    // Create a local blob URL and trigger download in browser
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KitchenCraft-Quotation-${quotationNumber || id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
