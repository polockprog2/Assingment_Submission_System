import api from '@/lib/api';

export const teacherService = {
  // Assignments
  getAssignments: () => api.get('/assignments', { retry: true, retryAttempts: 2 }),
  createAssignment: (assignmentData) => api.post('/assignments', assignmentData),
  publishAssignment: (id) => api.post(`/assignments/${id}/publish`),
  updateAssignment: (id, assignmentData) => api.put(`/assignments/${id}`, assignmentData),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),

  // Subjects the teacher is assigned to (each includes its Class)
  getMySubjects: () => api.get('/assignments/subjects', { retry: true, retryAttempts: 2 }),

  // Submissions
  getSubmissionsForAssignment: (assignmentId) => api.get(`/submissions/assignment/${assignmentId}`, { retry: true, retryAttempts: 2 }),
  gradeSubmission: (submissionId, gradeData) => api.post(`/submissions/${submissionId}/grade`, gradeData),
  downloadSubmissionFile: (submissionId, filename) => api.download(`/submissions/${submissionId}/file`, { filename }),
};
