const USERS_KEY = "sw_users_v1";
const SESSION_KEY = "sw_session_v1";

const DEMO_USERS = [
  { id: "demo-renter", name: "Demo Renter", email: "renter@sheggar.demo", phone: "+251900000001", roles: ["renter"], role: "renter", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "demo-owner", name: "Demo Owner", email: "owner@sheggar.demo", phone: "+251900000002", roles: ["renter", "owner"], role: "owner", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "demo-admin", name: "Demo Admin", email: "admin@sheggar.demo", phone: "+251900000003", roles: ["admin"], role: "admin", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
];

function safeParse(raw, fallback) {
  try { const value = JSON.parse(raw); return value ?? fallback; } catch { return fallback; }
}

export function getUsers() {
  if (typeof window === "undefined") return [];
  let stored = null;
  try {
    stored = safeParse(localStorage.getItem(USERS_KEY), null);
    if (stored == null) {
      const legacy = safeParse(localStorage.getItem("sheggar_wheels_users"), null);
      if (Array.isArray(legacy)) {
        stored = legacy.filter((u) => u && typeof u === "object" && !Array.isArray(u)).map(({ password, ...u }) => u);
        localStorage.removeItem("sheggar_wheels_users");
      }
    }
  } catch { return DEMO_USERS; }
  const users = Array.isArray(stored) ? stored.filter((u) => u && typeof u === "object" && !Array.isArray(u)) : [];
  // Migrate legacy records and deliberately strip any previously stored password fields.
  const migrated = users.map(({ password, ...u }) => ({ ...u, roles: Array.isArray(u.roles) ? u.roles : [u.role || "renter"], status: u.status || "active" }));
  const byId = new Map(migrated.map((u) => [u.id, u]));
  for (const demo of DEMO_USERS) if (!byId.has(demo.id)) byId.set(demo.id, demo);
  const result = [...byId.values()];
  try { localStorage.setItem(USERS_KEY, JSON.stringify(result)); } catch { /* surfaced by write actions */ }
  return result;
}

export function saveUsers(users) {
  if (typeof window === "undefined") return { ok: false, error: "Browser storage is unavailable." };
  try {
    const clean = users.filter((u) => u && typeof u === "object" && !Array.isArray(u)).map(({ password, ...u }) => ({ ...u, roles: Array.isArray(u.roles) ? u.roles : [u.role || "renter"] }));
    localStorage.setItem(USERS_KEY, JSON.stringify(clean));
    return { ok: true };
  } catch { return { ok: false, error: "Could not save users. Check browser storage space and permissions." }; }
}

export function createSession(user) {
  if (typeof window === "undefined") return null;
  if (!user || user.status === "suspended") throw new Error("This demo account is suspended.");
  const session = { userId: user.id, id: user.id, signedInAt: new Date().toISOString() };
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); return session; }
  catch { return null; }
}

export function getCurrentSession() {
  if (typeof window === "undefined") return null;
  let session;
  try { session = safeParse(sessionStorage.getItem(SESSION_KEY), null); } catch { return null; }
  if (!session || !(session.userId || session.id)) return null;
  const user = getUsers().find((u) => u.id === (session.userId || session.id));
  if (!user || user.status === "suspended") return null;
  return { ...user, sessionId: session.userId || session.id, signedInAt: session.signedInAt };
}
export const getSession = getCurrentSession;
export function signOut() {
  if (typeof window !== "undefined") {
    try { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem("sw_checkout_draft_v1"); } catch { /* unavailable session storage */ }
  }
}
export function hasRole(user, role) { return Boolean(user && (user.roles || [user.role]).includes(role)); }
export function requireRole(role) {
  const user = getCurrentSession();
  if (!user) return { ok: false, error: "Not signed in", user: null };
  if (!hasRole(user, role)) return { ok: false, error: `This action requires the ${role} demo role.`, user };
  if (user.status === "suspended") return { ok: false, error: "This demo account is suspended.", user: null };
  return { ok: true, user };
}
export function safeReturnPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) return "/";
  try { const url = new URL(value, "https://sheggar.invalid"); if (url.origin !== "https://sheggar.invalid") return "/"; return `${url.pathname}${url.search}${url.hash}`; } catch { return "/"; }
}
export function signInAsDemo(userId) {
  const user = getUsers().find((u) => u.id === userId);
  if (!user) return { ok: false, error: "Demo account not found." };
  if (user.status === "suspended") return { ok: false, error: "This demo account is suspended." };
  const session = createSession(user);
  if (!session) return { ok: false, error: "Session storage is unavailable in this browser." };
  return { ok: true, user };
}
export function getDemoUsers() { return DEMO_USERS.map(({ id, name, email, roles }) => ({ id, name, email, roles })); }
