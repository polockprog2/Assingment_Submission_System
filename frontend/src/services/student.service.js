import api from '@/lib/api';

export const studentService = {
  getAssignments: () => api.get('/assignments/available', { retry: true, retryAttempts: 2 }),

  getMySubmissions: () => api.get('/submissions/mine', { retry: true, retryAttempts: 2 }),
  createSubmission: (submissionData) => api.post('/submissions', submissionData),
  updateSubmission: (id, submissionData) => api.put(`/submissions/${id}`, submissionData),
  uploadFile: (submissionId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/submissions/${submissionId}/file`, form);
  },
  downloadFile: (submissionId, filename) => api.download(`/submissions/${submissionId}/file`, { filename }),
};
