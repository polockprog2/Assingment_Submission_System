import api from '@/lib/api';

const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const ROLE_CLAIMS = [
  'role',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
];

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const token = response?.token;
    if (!token) throw new Error('No token received from server');

    localStorage.setItem('token', token);

    const claims = decodeJwtPayload(token) || {};
    const role = ROLE_CLAIMS.map(k => claims[k]).find(Boolean) || 'Student';
    const userEmail = claims.email || claims.emailaddress || email;
    const user = {
      id: claims.sub || claims.nameid,
      email: userEmail,
      role,
      name: (userEmail || '').split('@')[0] || 'User',
    };

    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  register: async (email, password, classId) => {
    const payload = { email, password };
    if (classId !== undefined && classId !== null && classId !== '' && !Number.isNaN(classId)) {
      payload.classId = classId;
    }
    return api.post('/auth/register', payload);
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
};
