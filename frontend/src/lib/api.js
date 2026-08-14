
const DEFAULT_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || '/api';
const DEFAULT_TIMEOUT = 10000; // ms

class ApiError extends Error {
  constructor(message, { status = 0, body = null, url = '', method = '' } = {}){
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.url = url;
    this.method = method;
  }
}

function buildUrl(path, base){
  const b = base || DEFAULT_BASE;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function sleep(ms){ return new Promise(res => setTimeout(res, ms)); }

async function fetchWithTimeout(url, fetchOpts = {}, timeout = DEFAULT_TIMEOUT){
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, ...fetchOpts });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function parseBody(response){
  const ct = response.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  try {
    return isJson ? await response.json() : await response.text();
  } catch (e){
    return null;
  }
}

async function request(method, path, body, opts = {}){
  const base = opts.baseURL || DEFAULT_BASE;
  const url = buildUrl(path, base);

  const headers = new Headers(opts.headers || {});
  if (!headers.has('Content-Type') && !(body instanceof FormData)){
    headers.set('Content-Type', 'application/json');
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOpts = {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: opts.credentials || 'include',
    redirect: 'follow',
  };

  const timeout = typeof opts.timeout === 'number' ? opts.timeout : DEFAULT_TIMEOUT;

  const maxRetries = (opts.retry && method === 'GET') ? (opts.retryAttempts || 2) : 0;
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries){
    try {
      const res = await fetchWithTimeout(url, fetchOpts, timeout);
      const data = await parseBody(res);

      if (res.status === 401 && typeof window !== 'undefined'){
        try { localStorage.removeItem('user'); } catch {}
        if (typeof window !== 'undefined') window.location.href = '/login';
        throw new ApiError('Unauthorized', { status: 401, body: data, url, method });
      }

      if (!res.ok){
        const msg = (data && (data.error || data.message || data.title)) || (typeof data === 'string' ? data : res.statusText) || 'API request failed';
        throw new ApiError(msg, { status: res.status, body: data, url, method });
      }

      return data;
    } catch (err){
      lastError = err;
      // If aborted due to timeout, wrap in ApiError
      if (err.name === 'AbortError'){
        lastError = new ApiError('Request timeout', { status: 0, body: null, url, method });
      }

      // Retry only on network failures or 5xx responses (ApiError with status 5xx)
      const shouldRetry = attempt < maxRetries && (
        lastError instanceof TypeError || // network error
        (lastError instanceof ApiError && lastError.status >= 500 && lastError.status < 600)
      );

      if (!shouldRetry) break;

      const backoff = Math.pow(2, attempt) * 300; // 300ms, 600ms, 1200ms...
      await sleep(backoff);
      attempt++;
    }
  }

  // If we exit loop with an error, normalize and throw
  if (lastError instanceof ApiError) throw lastError;
  throw new ApiError(lastError?.message || 'Network error', { status: 0, body: null, url, method });
}

const api = {
  get: (path, opts) => request('GET', path, undefined, opts),
  post: (path, body, opts) => request('POST', path, body, opts),
  put: (path, body, opts) => request('PUT', path, body, opts),
  patch: (path, body, opts) => request('PATCH', path, body, opts),
  delete: (path, opts) => request('DELETE', path, undefined, opts),
  download: async (path, opts = {}) => {
    const base = opts.baseURL || DEFAULT_BASE;
    const url = buildUrl(path, base);

    const headers = new Headers(opts.headers || {});
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const timeout = typeof opts.timeout === 'number' ? opts.timeout : DEFAULT_TIMEOUT;
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers,
      credentials: opts.credentials || 'include',
      redirect: 'follow',
    }, timeout);

    if (res.status === 401 && typeof window !== 'undefined'){
      try { localStorage.removeItem('user'); } catch {}
      window.location.href = '/login';
      throw new ApiError('Unauthorized', { status: 401, url, method: 'GET' });
    }

    if (!res.ok){
      let body = null;
      try { body = await res.json(); } catch {}
      const msg = (body && (body.error || body.message || body.title)) || res.statusText || 'Download failed';
      throw new ApiError(msg, { status: res.status, body, url, method: 'GET' });
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition') || '';
    const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
    const filename = match ? match[1].replace(/"/g, '') : (opts.filename || 'download');
    return {
      blob,
      filename,
      contentType: res.headers.get('content-type') || 'application/octet-stream',
    };
  },
  ApiError,
};

export default api;
