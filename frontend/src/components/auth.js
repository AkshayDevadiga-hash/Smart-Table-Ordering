const AUTH_KEY = 'tableorder-token';
const AUTH_ROLE_KEY = 'tableorder-role';

function getToken() {
  return localStorage.getItem(AUTH_KEY);
}

function getRole() {
  return localStorage.getItem(AUTH_ROLE_KEY);
}

function setAuth(token, role) {
  localStorage.setItem(AUTH_KEY, token);
  localStorage.setItem(AUTH_ROLE_KEY, role);
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
}

function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return false;
  return payload.exp * 1000 > Date.now();
}

function requireAuth(expectedRole, loginPath) {
  const token = getToken();
  const role = getRole();
  if (!isTokenValid(token) || role !== expectedRole) {
    clearAuth();
    window.location.replace(loginPath);
    return false;
  }
  return true;
}

function requireAdminAuth() {
  return requireAuth('admin', '/admin/login');
}

function requireKitchenAuth() {
  return requireAuth('kitchen', '/kitchen/login');
}

function logout(loginPath) {
  clearAuth();
  window.location.replace(loginPath);
}

async function login(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Login failed');
  }
  const data = await res.json();
  setAuth(data.token, data.role);
  return data;
}
