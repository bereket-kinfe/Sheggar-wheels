import carsSeed from "../app/car-details.json";
import { getCurrentSession, hasRole, getUsers, saveUsers } from "./auth";

export { getUsers };

export const KEYS = { users: "sw_users_v1", cars: "sw_cars_v1", bookings: "sheggar_wheels_bookings", reviews: "sw_reviews_v1", disputes: "sw_disputes_v1", announcements: "sw_announcements_v1", draft: "sw_checkout_draft_v1" };
const now = () => new Date().toISOString();
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const id = (prefix) => `${prefix}_${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`}`;
export function readStorage(key, fallback = []) {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); if (raw == null) return fallback; const value = JSON.parse(raw); if (value == null) return fallback; if (Array.isArray(fallback) && !Array.isArray(value)) return fallback; if (!Array.isArray(fallback) && typeof fallback === "object" && fallback !== null && (typeof value !== "object" || Array.isArray(value))) return fallback; return value; }
  catch { return fallback; }
}
export function writeStorage(key, value) {
  if (typeof window === "undefined") return { ok: false, error: "Browser storage is unavailable." };
  try { localStorage.setItem(key, JSON.stringify(value)); return { ok: true }; }
  catch { return { ok: false, error: "Could not save demo data. Check browser storage permissions or available space." }; }
}
export function initializeDemoData() {
  if (typeof window === "undefined") return;
  const seedCars = carsSeed.map((c, i) => ({ id: String(c.id), ownerId: i < 3 ? "demo-owner" : "demo-owner", make: c.name.split(" ")[0], model: c.name.split(" ").slice(1).join(" "), name: c.name, year: c.year, transmission: c.transmission, seats: c.seats, city: "Addis Ababa", neighbourhood: c.location.split(",")[0], latitude: 8.98 + i * 0.001, longitude: 38.76 + i * 0.001, pricePerDay: c.price, price: c.price, photos: [c.image], image: c.image, description: `${c.type} available for a simulated peer-to-peer rental in Addis Ababa.`, status: "approved", unavailableDates: [], createdAt: "2026-01-01T00:00:00.000Z" }));
  const savedCars = readStorage(KEYS.cars, null);
  if (savedCars == null) {
    writeStorage(KEYS.cars, seedCars);
  } else {
    // Refresh images for the built-in demo cars when older browser data still
    // points at the removed placeholder, while leaving owner-created cars intact.
    const seedById = new Map(seedCars.map((car) => [car.id, car]));
    const refreshedCars = savedCars.map((car) => {
      const seed = seedById.get(String(car.id));
      if (!seed || (car.image && car.image !== "/car-placeholder.svg")) return car;
      return { ...car, image: seed.image, photos: [seed.image] };
    });
    if (refreshedCars.some((car, index) => car !== savedCars[index])) writeStorage(KEYS.cars, refreshedCars);
  }
  if (localStorage.getItem(KEYS.bookings) == null) {
    const samples = [
      { id: "demo-booking-requested", carId: "6", carName: "Hyundai Bayon", renterId: "demo-renter", userId: "demo-renter", ownerId: "demo-owner", startDate: "2026-11-12", endDate: "2026-11-14", days: 2, pricePerDay: 3200, subtotal: 6400, fee: 320, total: 6720, paymentStatus: "unpaid", status: "requested", createdAt: now(), updatedAt: now() },
      { id: "demo-booking-confirmed", carId: "7", carName: "Hyundai Tucson", renterId: "demo-renter", userId: "demo-renter", ownerId: "demo-owner", startDate: "2026-11-20", endDate: "2026-11-22", days: 2, pricePerDay: 4500, subtotal: 9000, fee: 450, total: 9450, paymentStatus: "paid", status: "confirmed", createdAt: now(), updatedAt: now() },
      { id: "demo-booking-completed", carId: "8", carName: "Mazda MX-5", renterId: "demo-renter", userId: "demo-renter", ownerId: "demo-owner", startDate: "2026-09-10", endDate: "2026-09-12", days: 2, pricePerDay: 5200, subtotal: 10400, fee: 520, total: 10920, paymentStatus: "paid", status: "completed", createdAt: now(), updatedAt: now() },
      { id: "demo-booking-cancelled", carId: "5", carName: "Ford Mustang", renterId: "demo-renter", userId: "demo-renter", ownerId: "demo-owner", startDate: "2026-08-01", endDate: "2026-08-03", days: 2, pricePerDay: 7000, subtotal: 14000, fee: 700, total: 14700, paymentStatus: "unpaid", status: "cancelled", createdAt: now(), updatedAt: now() },
      { id: "demo-booking-owner-request", carId: "4", carName: "Chevrolet Corvette Stingray", renterId: "demo-renter", userId: "demo-renter", ownerId: "demo-owner", startDate: "2026-12-03", endDate: "2026-12-05", days: 2, pricePerDay: 8500, subtotal: 17000, fee: 850, total: 17850, paymentStatus: "unpaid", status: "requested", createdAt: now(), updatedAt: now() },
    ];
    writeStorage(KEYS.bookings, samples);
  }
  const legacyBookings = readStorage("sw_bookings_v1", []);
  if (legacyBookings.length) {
    const savedBookings = readStorage(KEYS.bookings, []);
    const savedIds = new Set(savedBookings.map((booking) => String(booking.id)));
    const migratedBookings = legacyBookings
      .filter((booking) => !savedIds.has(String(booking.id)))
      .map((booking) => ({
        ...booking,
        renterId: booking.renterId || booking.userId,
        ownerId: booking.ownerId || getCars().find((car) => String(car.id) === String(booking.carId))?.ownerId,
      }));
    if (migratedBookings.length) writeStorage(KEYS.bookings, [...savedBookings, ...migratedBookings]);
  }
  for (const key of [KEYS.reviews, KEYS.disputes, KEYS.announcements]) if (localStorage.getItem(key) == null) writeStorage(key, []);
  // getUsers migrates/seeds the demo accounts.
  getUsers();
}
export const getCars = () => readStorage(KEYS.cars, []);
export const getBookings = () => readStorage(KEYS.bookings, []).map((b) => ({ ...b, renterId: b.renterId || b.userId, status: b.status === "pending" ? "requested" : b.status, total: b.total ?? b.totalPrice ?? 0, subtotal: b.subtotal ?? b.totalPrice ?? 0, fee: b.fee ?? 0, ownerId: b.ownerId ?? getCars().find(c => String(c.id) === String(b.carId))?.ownerId }));
export const getReviews = () => readStorage(KEYS.reviews, []);
export const getDisputes = () => readStorage(KEYS.disputes, []);
export const getAnnouncements = () => readStorage(KEYS.announcements, []);
export function saveCar(car) { const cars = getCars(); const index = cars.findIndex((x) => x.id === car.id); if (index < 0) cars.push(car); else cars[index] = car; return writeStorage(KEYS.cars, cars); }
function fail(error) { return { ok: false, error }; }
function sessionFor(role) { const user = getCurrentSession(); if (!user) return fail("Not signed in"); if (user.status === "suspended") return fail("Account suspended"); if (role && !hasRole(user, role)) return fail(`Requires ${role} role`); return { ok: true, user }; }
export function createBooking({ carId, startDate, endDate }) {
  const auth = sessionFor("renter"); if (!auth.ok) return auth;
  initializeDemoData();
  const car = getCars().find((c) => String(c.id) === String(carId)); if (!car) return fail("Car not found");
  if (car.status !== "approved") return fail("This car is not available for public booking.");
  if (car.ownerId === auth.user.id) return fail("You cannot book a car you own.");
  const start = new Date(`${startDate}T00:00:00`); const end = new Date(`${endDate}T00:00:00`); const today = new Date(); today.setHours(0,0,0,0);
  if (!startDate || !endDate || Number.isNaN(+start) || Number.isNaN(+end) || start < today || end <= start) return fail("Choose valid future dates; return date must be after pickup.");
  const blocked = new Set(car.unavailableDates || []); for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) if (blocked.has(dateKey(d))) return fail("Selected dates include an owner-blocked unavailable date.");
  const bookings = getBookings();
  // A booking's end date is checkout, so the next rental may start that day.
  const overlap = bookings.some((b) => String(b.carId) === String(carId) && !["cancelled", "declined", "resolved"].includes(b.status) && startDate < b.endDate && endDate > b.startDate);
  if (overlap) return fail("These dates overlap another active booking.");
  const days = Math.round((end - start) / 86400000); const pricePerDay = Number(car.pricePerDay ?? car.price); const subtotal = days * pricePerDay; const fee = Math.round(subtotal * 0.05);
  const booking = { id: id("booking"), carId: String(car.id), carName: car.name || `${car.make} ${car.model}`, renterId: auth.user.id, userId: auth.user.id, renterName: auth.user.name, renterEmail: auth.user.email, ownerId: car.ownerId, startDate, endDate, days, pricePerDay, subtotal, fee, total: subtotal + fee, paymentStatus: "unpaid", status: "requested", createdAt: now(), updatedAt: now() };
  const saved = writeStorage(KEYS.bookings, [...bookings, booking]); return saved.ok ? { ok: true, booking } : saved;
}
export function transitionBooking(bookingId, action) {
  const auth = sessionFor(); if (!auth.ok) return auth;
  const bookings = getBookings(); const index = bookings.findIndex((b) => b.id === bookingId); if (index < 0) return fail("Booking not found");
  const booking = bookings[index];
  const ownerActions = {
    approve: ["requested", "confirmed"],
    decline: ["requested", "declined"],
    start: ["confirmed", "in_progress"],
    complete: ["in_progress", "completed"],
  };
  const renterActions = {
    pay: ["confirmed", "confirmed"],
    review: ["completed", "reviewed"],
  };
  let next;
  if (ownerActions[action]) { if (!hasRole(auth.user, "owner") || booking.ownerId !== auth.user.id) return fail("Not yours: this booking does not belong to your car."); if (booking.status !== ownerActions[action][0]) return fail("Invalid booking state transition."); if (action === "start" && booking.paymentStatus !== "paid") return fail("The renter must complete demo payment before the trip starts."); next = ownerActions[action][1]; }
  else if (action === "cancel") {
    if (booking.renterId !== auth.user.id) return fail("Not yours: this booking belongs to another renter.");
    if (!["requested", "confirmed"].includes(booking.status)) return fail("Invalid booking state transition.");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (booking.status === "confirmed" && new Date(`${booking.startDate}T00:00:00`) <= today) return fail("This booking is no longer eligible for cancellation.");
    next = "cancelled";
  }
  else if (action === "dispute") {
    if (booking.renterId !== auth.user.id && booking.ownerId !== auth.user.id) return fail("Not yours: only this booking's renter or owner can raise an issue.");
    if (booking.status !== "in_progress") return fail("An issue can only be raised while a rental is in progress.");
    next = "disputed";
  }
  else if (renterActions[action]) { if (booking.renterId !== auth.user.id) return fail("Not yours: this booking belongs to another renter."); if (booking.status !== renterActions[action][0]) return fail("Invalid booking state transition."); next = renterActions[action][1]; }
  else if (action === "resolve") { if (!hasRole(auth.user, "admin")) return fail("Requires admin role"); if (booking.status !== "disputed") return fail("Only disputed bookings can be resolved."); next = "resolved"; }
  else if (action === "revert-review") { if (booking.renterId !== auth.user.id || booking.status !== "reviewed") return fail("Cannot roll back this review transition."); next = "completed"; }
  else if (action === "revert-dispute") { if ((booking.renterId !== auth.user.id && booking.ownerId !== auth.user.id) || booking.status !== "disputed") return fail("Cannot roll back this issue transition."); next = "in_progress"; }
  else if (action === "revert-resolution") { if (!hasRole(auth.user, "admin") || booking.status !== "resolved") return fail("Cannot roll back this resolution."); next = "disputed"; }
  else return fail("Unknown booking action.");
  if (action === "pay") booking.paymentStatus = "paid";
  booking.status = next; booking.updatedAt = now(); bookings[index] = booking;
  const saved = writeStorage(KEYS.bookings, bookings); return saved.ok ? { ok: true, booking } : saved;
}
export function saveOwnedCar(input, carId = null) {
  const auth = sessionFor("owner"); if (!auth.ok) return auth;
  const cars = getCars(); let car;
  if (carId) { car = cars.find((c) => String(c.id) === String(carId)); if (!car) return fail("Car not found"); if (car.ownerId !== auth.user.id) return fail("Not yours: you cannot edit another owner's car."); }
  car = { ...(car || {}), ...input, id: car?.id || id("car"), ownerId: auth.user.id, status: "pending", createdAt: car?.createdAt || now() };
  const next = carId ? cars.map((c) => String(c.id) === String(carId) ? car : c) : [...cars, car]; const saved = writeStorage(KEYS.cars, next); return saved.ok ? { ok: true, car } : saved;
}
export function saveAvailability(carId, startDate, endDate) {
  const auth = sessionFor("owner"); if (!auth.ok) return auth;
  if (!startDate || !endDate || endDate < startDate) return fail("Choose a valid unavailable date range.");
  const cars = getCars(); const index = cars.findIndex(c => String(c.id) === String(carId));
  if (index < 0) return fail("Car not found.");
  if (cars[index].ownerId !== auth.user.id) return fail("Not yours: you cannot change another owner's availability.");
  const dates = new Set(cars[index].unavailableDates || []);
  const cursor = new Date(`${startDate}T00:00:00`); const end = new Date(`${endDate}T00:00:00`);
  while (cursor <= end) { dates.add(dateKey(cursor)); cursor.setDate(cursor.getDate() + 1); }
  cars[index].unavailableDates = [...dates].sort(); cars[index].updatedAt = now();
  return writeStorage(KEYS.cars, cars);
}
export function moderateCar(carId, status) {
  const auth = sessionFor("admin"); if (!auth.ok) return auth;
  if (!['approved', 'rejected', 'inactive'].includes(status)) return fail("Invalid moderation status.");
  const cars = getCars(); const index = cars.findIndex((c) => String(c.id) === String(carId)); if (index < 0) return fail("Car not found"); cars[index].status = status; cars[index].updatedAt = now(); return writeStorage(KEYS.cars, cars);
}
export function setUserStatus(userId, status) {
  const auth = sessionFor("admin"); if (!auth.ok) return auth;
  if (!['active', 'suspended'].includes(status)) return fail("Invalid account status.");
  const users = getUsers(); const index = users.findIndex((u) => u.id === userId); if (index < 0) return fail("User not found");
  users[index].status = status; return saveUsers(users);
}
export function createReview({ bookingId, rating, comment }) {
  const auth = sessionFor("renter"); if (!auth.ok) return auth; const booking = getBookings().find((b) => b.id === bookingId);
  if (!booking || booking.renterId !== auth.user.id) return fail("Not yours: review must belong to your booking."); if (booking.status !== "completed") return fail("Only completed bookings can be reviewed.");
  const reviews = getReviews(); if (reviews.some((r) => r.bookingId === bookingId)) return fail("One review per booking is allowed.");
  const n = Number(rating); if (!Number.isInteger(n) || n < 1 || n > 5 || !comment?.trim()) return fail("Provide a rating from 1–5 and a comment.");
  const review = { id: id("review"), bookingId, carId: booking.carId, renterId: auth.user.id, ownerId: booking.ownerId, rating: n, comment: comment.trim(), ownerReply: "", createdAt: now() };
  const transition = transitionBooking(bookingId, "review"); if (!transition.ok) return transition;
  const saved = writeStorage(KEYS.reviews, [...reviews, review]);
  if (!saved.ok) {
    transitionBooking(bookingId, "revert-review");
    return saved;
  }
  return { ok: true, review };
}
export function createDispute({ bookingId, reason, description }) {
  const auth = sessionFor(); if (!auth.ok) return auth; const booking = getBookings().find((b) => b.id === bookingId);
  if (!booking || (booking.renterId !== auth.user.id && booking.ownerId !== auth.user.id)) return fail("Not yours: only a related renter or owner can raise a dispute.");
  if (booking.status !== "in_progress") return fail("An issue can only be raised while a rental is in progress.");
  if (!reason || !description?.trim()) return fail("Provide a reason and description.");
  const disputes = getDisputes(); const dispute = { id: id("dispute"), bookingId, openedBy: auth.user.id, reason, description: description.trim(), status: "open", resolutionNotes: "", resolvedBy: null, createdAt: now(), resolvedAt: null };
  const transition = transitionBooking(bookingId, "dispute"); if (!transition.ok) return transition;
  const saved = writeStorage(KEYS.disputes, [...disputes, dispute]);
  if (!saved.ok) {
    transitionBooking(bookingId, "revert-dispute");
    return saved;
  }
  return { ok: true, dispute };
}
export function resolveDispute(disputeId, resolutionNotes) {
  const auth = sessionFor("admin"); if (!auth.ok) return auth; if (!resolutionNotes?.trim()) return fail("Resolution notes are required.");
  const disputes = getDisputes(); const index = disputes.findIndex((d) => d.id === disputeId); if (index < 0) return fail("Dispute not found");
  const booking = getBookings().find((entry) => entry.id === disputes[index].bookingId);
  if (!booking || booking.status !== "disputed") return fail("This dispute is not attached to a disputed booking.");
  const transition = transitionBooking(booking.id, "resolve"); if (!transition.ok) return transition;
  disputes[index] = { ...disputes[index], status: "resolved", resolutionNotes: resolutionNotes.trim(), resolvedBy: auth.user.id, resolvedAt: now() };
  const saved = writeStorage(KEYS.disputes, disputes);
  if (!saved.ok) {
    transitionBooking(booking.id, "revert-resolution");
    return saved;
  }
  return { ok: true, dispute: disputes[index] };
}
export function exportCsv(filename, rows) {
  if (typeof window === "undefined") return fail("Export is only available in the browser.");
  const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(quote).join(",")).join("\r\n"); const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); return { ok: true };
}
