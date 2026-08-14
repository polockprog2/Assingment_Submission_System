import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_API_URL;


// Utility to decode JWT payload (server-side, safe to use atob in Node 18+)
const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64').toString('utf-8').split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Headers that should NOT be forwarded to the backend
const HOP_BY_HOP_HEADERS = new Set([
  'host', 'connection', 'keep-alive', 'proxy-authenticate',
  'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade',
  'origin', 'referer', // Don't forward browser origin — backend CORS won't match
]);

async function handleProxy(req, context) {
  // In Next.js 15+, params is a Promise and must be awaited
  const { path: pathArr = [] } = await context.params;
  const pathStr = pathArr.join('/');
  
  // Handle custom logout route (no backend call needed)
  if (pathStr === 'auth/logout') {
    const response = NextResponse.json({ success: true });
    // cookies() is async in Next.js 15+ — must be awaited
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    return response;
  }

  const url = `${BACKEND_URL}/${pathStr}${req.nextUrl.search}`;
  
  // Forward request headers, preserving content type and form boundaries
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && !key.toLowerCase().startsWith('x-forwarded')) {
      headers.set(key, value);
    }
  });

  // Attach token from HttpOnly cookie if present and if Authorization header is not already set
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (token && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Handle body
  let body = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      body = await req.arrayBuffer();
    } catch (e) {}
  }

  try {
    // Debug log the proxied request (method + url)
    console.debug('[API Proxy] forwarding', req.method, url);

    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const noContentStatus = response.status === 204 || response.status === 205;
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const isBinary = !isJson && !contentType.includes('text/');

    if (isBinary) {
      const arrayBuffer = await response.arrayBuffer();
      const passthrough = new NextResponse(arrayBuffer, { status: response.status });
      passthrough.headers.set('Content-Type', contentType);
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) passthrough.headers.set('Content-Disposition', contentDisposition);
      const contentLength = response.headers.get('content-length');
      if (contentLength) passthrough.headers.set('Content-Length', contentLength);
      return passthrough;
    }

    let data = null;

    if (!noContentStatus) {
      try {
        data = isJson ? await response.json() : await response.text();
      } catch (e) {
        data = null;
      }
    }

    if (noContentStatus) {
      return new NextResponse(null, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    // Improved logging with context
    console.error('[API Proxy Error] method=%s url=%s path=%s message=%s', req.method, url, pathStr, error?.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error?.stack || error);
    }

    const detail = process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined;
    return NextResponse.json(
      { error: 'Could not reach the API server. Make sure the backend is running.', detail, url },
      { status: 502 }
    );
  }
}

export async function GET(req, ctx) { return handleProxy(req, ctx); }
export async function POST(req, ctx) { return handleProxy(req, ctx); }
export async function PUT(req, ctx) { return handleProxy(req, ctx); }
export async function DELETE(req, ctx) { return handleProxy(req, ctx); }
export async function PATCH(req, ctx) { return handleProxy(req, ctx); }

