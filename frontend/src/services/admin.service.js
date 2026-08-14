import api from '@/lib/api';

// Admin-facing endpoints (per backend OpenAPI spec)
export const adminService = {
  // Users
  getUsers: () => api.get('/users', { retry: true, retryAttempts: 2 }),
  createUser: (userData) => api.post('/users', userData),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Classes
  getClasses: () => api.get('/classes', { retry: true, retryAttempts: 2 }),
  createClass: (classData) => api.post('/classes', classData),
  updateClass: (id, classData) => api.put(`/classes/${id}`, classData),
  deleteClass: (id) => api.delete(`/classes/${id}`),

  // Subjects
  getSubjects: () => api.get('/subjects', { retry: true, retryAttempts: 2 }),
  createSubject: (subjectData) => api.post('/subjects', subjectData),
  updateSubject: (id, subjectData) => api.put(`/subjects/${id}`, subjectData),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),

  // Teacher-Subject assignments
  listTeacherSubjectAssignments: () => api.get('/teacher-subject-assignments', { retry: true, retryAttempts: 2 }),
  assignSubjectToTeacher: (payload) => api.post('/teacher-subject-assignments', payload),
  removeTeacherSubjectAssignment: (id) => api.delete(`/teacher-subject-assignments/${id}`),
};
