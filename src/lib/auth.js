const USERS_KEY = "sw_users_v1";
const SESSION_KEY = "sw_session_v1";
const PASSWORD_ITERATIONS = 210_000;

const DEMO_USERS = [
  { id: "demo-renter", name: "Demo Renter", email: "renter@sheggar.demo", phone: "+251900000001", roles: ["renter"], role: "renter", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "demo-owner", name: "Demo Owner", email: "owner@sheggar.demo", phone: "+251900000002", roles: ["renter", "owner"], role: "owner", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "demo-admin", name: "Demo Admin", email: "admin@sheggar.demo", phone: "+251900000003", roles: ["admin"], role: "admin", status: "active", createdAt: "2026-01-01T00:00:00.000Z" },
];

function safeParse(raw, fallback) {
  try { const value = JSON.parse(raw); return value ?? fallback; } catch { return fallback; }
}

function loadUsers() {
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

function withoutCredentials(user) {
  const { password, passwordHash, passwordSalt, passwordIterations, ...publicUser } = user;
  return publicUser;
}

export function getUsers() {
  return loadUsers().map(withoutCredentials);
}

export function saveUsers(users) {
  if (typeof window === "undefined") return { ok: false, error: "Browser storage is unavailable." };
  try {
    const storedCredentials = new Map(
      loadUsers().map((user) => [user.id, {
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
        passwordIterations: user.passwordIterations,
      }]),
    );
    const clean = users.filter((u) => u && typeof u === "object" && !Array.isArray(u)).map((user) => {
      const { password, ...publicFields } = user;
      const previousCredentials = storedCredentials.get(user.id) || {};
      return {
        ...publicFields,
        ...previousCredentials,
        passwordHash: user.passwordHash || previousCredentials.passwordHash,
        passwordSalt: user.passwordSalt || previousCredentials.passwordSalt,
        passwordIterations: user.passwordIterations || previousCredentials.passwordIterations,
        roles: Array.isArray(user.roles) ? user.roles : [user.role || "renter"],
      };
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(clean));
    return { ok: true };
  } catch { return { ok: false, error: "Could not save users. Check browser storage space and permissions." }; }
}

async function derivePasswordHash(password, salt, iterations = PASSWORD_ITERATIONS) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Password sign-in requires a browser with Web Crypto support.");
  }
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    keyMaterial,
    256,
  );
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value) {
  if (typeof value !== "string" || !/^(?:[0-9a-f]{2})+$/i.test(value)) return null;
  return new Uint8Array(value.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
}

export async function registerAccount({ name, email, phone = "", password }) {
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (cleanName.length < 2) return { ok: false, error: "Enter a name with at least 2 characters." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, error: "Enter a valid email address." };
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return { ok: false, error: "Use a password between 8 and 128 characters." };
  }

  const users = loadUsers();
  const existingUser = users.find((user) => user.email?.toLowerCase() === cleanEmail);
  if (existingUser?.passwordHash) {
    return { ok: false, error: "An account with this email already exists. Please sign in." };
  }
  if (existingUser && !String(existingUser.id).startsWith("renter_")) {
    return { ok: false, error: "This is a demo account. Select it from the demo accounts below." };
  }

  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const user = {
      ...(existingUser || {}),
      id: existingUser?.id || `renter_${crypto.randomUUID()}`,
      name: cleanName,
      email: cleanEmail,
      phone: typeof phone === "string" ? phone.trim() : "",
      roles: ["renter"],
      role: "renter",
      status: "active",
      passwordHash: await derivePasswordHash(password, salt),
      passwordSalt: toHex(salt),
      passwordIterations: PASSWORD_ITERATIONS,
      createdAt: new Date().toISOString(),
    };
    const updatedUsers = existingUser
      ? users.map((record) => (record.id === existingUser.id ? user : record))
      : [...users.map(withoutCredentials), user];
    const result = saveUsers(updatedUsers);
    if (!result.ok) return result;
    const session = createSession(user);
    if (!session) {
      return { ok: false, accountSaved: true, error: "Your account was saved, but this browser could not create a session. Please sign in." };
    }
    return { ok: true, user: withoutCredentials(user) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not create your account." };
  }
}

export async function signInWithPassword(email, password) {
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!cleanEmail || typeof password !== "string") {
    return { ok: false, error: "Email or password is incorrect." };
  }
  const user = loadUsers().find((record) => record.email?.toLowerCase() === cleanEmail);
  if (!user || !user.passwordHash || !user.passwordSalt) {
    return { ok: false, error: "Email or password is incorrect. Demo accounts can be selected below." };
  }
  if (user.status === "suspended") return { ok: false, error: "This account is suspended." };

  const salt = fromHex(user.passwordSalt);
  if (!salt) return { ok: false, error: "This account's saved credentials are invalid. Please create a new account." };
  try {
    const iterations = Number.isInteger(user.passwordIterations) &&
      user.passwordIterations >= PASSWORD_ITERATIONS &&
      user.passwordIterations <= 500_000
      ? user.passwordIterations
      : PASSWORD_ITERATIONS;
    const hash = await derivePasswordHash(password, salt, iterations);
    if (hash !== user.passwordHash) return { ok: false, error: "Email or password is incorrect." };
    if (!createSession(user)) return { ok: false, error: "Session storage is unavailable in this browser." };
    return { ok: true, user: withoutCredentials(user) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not sign in." };
  }
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
  const user = loadUsers().find((u) => u.id === (session.userId || session.id));
  if (!user || user.status === "suspended") return null;
  return { ...withoutCredentials(user), sessionId: session.userId || session.id, signedInAt: session.signedInAt };
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
  const user = loadUsers().find((u) => u.id === userId);
  if (!user) return { ok: false, error: "Demo account not found." };
  if (user.status === "suspended") return { ok: false, error: "This demo account is suspended." };
  const session = createSession(user);
  if (!session) return { ok: false, error: "Session storage is unavailable in this browser." };
  return { ok: true, user: withoutCredentials(user) };
}
export function getDemoUsers() { return DEMO_USERS.map(({ id, name, email, roles }) => ({ id, name, email, roles })); }
