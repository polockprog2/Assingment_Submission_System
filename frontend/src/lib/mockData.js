export const MOCK_USERS = [
  { id: '1', email: 'admin@edu.com', name: 'Admin User', role: 'Admin' },
  { id: '2', email: 'teacher@edu.com', name: 'Teacher One', role: 'Teacher' },
  { id: '3', email: 'student@edu.com', name: 'Student One', role: 'Student' },
];

export const loginMock = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find((u) => u.email === email);
      if (user && password === 'password123') {
        resolve({ token: 'mock-jwt-token-123', user });
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 500);
  });
};
