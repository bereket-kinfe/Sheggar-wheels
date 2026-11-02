"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentSession, hasRole, signOut } from "../lib/auth";
import {
  initializeDemoData,
  getCars,
  getBookings,
  getReviews,
  getDisputes,
  getAnnouncements,
  getUsers,
  saveOwnedCar,
  saveAvailability,
  moderateCar,
  setUserStatus,
  transitionBooking,
  createReview,
  createDispute,
  resolveDispute,
  writeStorage,
  KEYS,
  exportCsv,
} from "../lib/data";

const config = {
  owner: {
    role: "owner",
    title: "Owner workspace",
    links: [
      ["Overview", "/owner"],
      ["My cars", "/owner/cars"],
      ["Add a car", "/owner/cars/new"],
      ["Earnings", "/owner/earnings"],
      ["Reviews", "/owner/reviews"],
      ["Disputes", "/owner/disputes"],
    ],
  },
  admin: {
    role: "admin",
    title: "Admin console",
    links: [
      ["Overview", "/admin"],
      ["Listings", "/admin/listings"],
      ["Users", "/admin/users"],
      ["Bookings", "/admin/bookings"],
      ["Disputes", "/admin/disputes"],
      ["Reports", "/admin/reports"],
      ["Announcements", "/admin/announcements"],
    ],
  },
};
const money = (n) =>
  `ETB ${new Intl.NumberFormat("en-ET").format(Number(n || 0))}`;
export default function WorkspacePage({
  section,
  title,
  kind = "owner",
  pathId = null,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [form, setForm] = useState({
    name: "",
    year: "2022",
    pricePerDay: "3000",
    transmission: "Automatic",
    seats: "5",
    neighbourhood: "Bole",
    description: "",
    startDate: "",
    endDate: "",
    rating: "5",
    comment: "",
    reason: "Vehicle condition",
    resolutionNotes: "",
    title: "",
    message: "",
    image: "",
  });
  const role = config[kind]?.role || kind;
  function refresh() {
    initializeDemoData();
    setUser(getCurrentSession());
    setCars(getCars());
    setBookings(getBookings());
    setReviews(getReviews());
    setDisputes(getDisputes());
    setAnnouncements(getAnnouncements());
    setUsers(getUsers());
  }
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (section === "edit-car" && pathId && cars.length) {
      const car = cars.find((c) => String(c.id) === pathId);
      if (car && car.ownerId === user?.id)
        setForm((f) => ({
          ...f,
          name: car.name || `${car.make} ${car.model}`,
          year: String(car.year || 2022),
          pricePerDay: String(car.pricePerDay ?? car.price ?? 3000),
          transmission: car.transmission || "Automatic",
          seats: String(car.seats || 5),
          neighbourhood: car.neighbourhood || "Bole",
          description: car.description || "",
          image: car.image || car.photos?.[0] || "",
        }));
    }
  }, [section, pathId, cars, user?.id]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const visibleCars = cars.filter(
    (c) =>
      kind === "admin" ||
      (kind === "owner" ? c.ownerId === user?.id : c.status === "approved"),
  );
  const visibleBookings = bookings.filter(
    (b) =>
      kind === "admin" ||
      (kind === "owner" ? b.ownerId === user?.id : b.renterId === user?.id),
  );
  const filteredBookings = visibleBookings.filter((booking) =>
    bookingStatusFilter === "all" || booking.status === bookingStatusFilter,
  );
  const selectedCar = cars.find((c) => String(c.id) === pathId);
  const visibleCarBookings =
    selectedCar?.ownerId === user?.id
      ? bookings.filter((b) => String(b.carId) === pathId)
      : [];
  const visibleDisputes = disputes.filter(
    (d) =>
      kind === "admin" ||
      d.openedBy === user?.id ||
      bookings.some((b) => b.id === d.bookingId && b.ownerId === user?.id),
  );
  function act(result) {
    setMessage(
      result?.ok
        ? "Saved successfully."
        : result?.error || "Action could not be completed.",
    );
    refresh();
  }
  function chooseCarImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Choose an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setForm((current) => ({ ...current, image: String(reader.result) }));
    reader.readAsDataURL(file);
    setMessage("");
  }
  function submitCar(e) {
    e.preventDefault();
    act(
      saveOwnedCar(
        {
          name: form.name.trim(),
          make: form.name.trim().split(" ")[0],
          model: form.name.trim().split(" ").slice(1).join(" "),
          year: Number(form.year),
          pricePerDay: Number(form.pricePerDay),
          price: Number(form.pricePerDay),
          transmission: form.transmission,
          seats: Number(form.seats),
          city: "Addis Ababa",
          neighbourhood: form.neighbourhood,
          description: form.description,
          photos: form.image ? [form.image] : [],
          image: form.image || "/car-placeholder.svg",
          unavailableDates: [],
        },
        section === "edit-car" ? pathId : null,
      ),
    );
  }
  if (!user)
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-2xl font-bold">Sign in required</h1>
        <p className="my-3">This workspace requires a demo account.</p>
        <Link
          className="underline"
          href={`/signin?next=${encodeURIComponent(pathname || "/")}`}
        >
          Sign in
        </Link>
      </main>
    );
  if (user.status === "suspended")
    return (
      <main className="p-8">
        <h1>Access blocked</h1>
        <p>This demo account is suspended.</p>
      </main>
    );
  if (kind === "participant" ? !(hasRole(user, "renter") || hasRole(user, "owner")) : !hasRole(user, role))
    return (
      <main className="p-8">
        <h1>Access denied</h1>
        <p>This page requires the {role} demo role.</p>
        <Link href="/">Return home</Link>
      </main>
    );
  const rows =
    section === "users"
      ? users
      : section === "listings"
        ? visibleCars
      : section === "bookings"
          ? filteredBookings
          : section === "disputes"
            ? visibleDisputes
            : [];
  const activeOwnerUrl =
    section === "owner-overview"
      ? "/owner"
      : section === "new-car"
        ? "/owner/cars/new"
        : ["listings", "edit-car", "availability", "car-bookings"].includes(
              section,
            )
          ? "/owner/cars"
          : `/owner/${section}`;
  const activeAdminUrl =
    config.admin.links.find(
      ([, url]) =>
        pathname === url ||
        (url !== "/admin" && pathname.startsWith(`${url}/`)),
    )?.[1] || "/admin";
  const exportRows = (data) =>
    exportCsv(`${section || kind}-report.csv`, [
      ["ID", "Status", "Details"],
      ...data.map((x) => [
        x.id,
        x.status,
        x.name || x.carName || x.reason || x.email || "",
      ]),
    ]);
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-white px-5 py-4 md:px-10">
        <Link href="/" className="font-bold text-xl">
          sheggar wheels
        </Link>
        {kind !== "owner" && kind !== "admin" && (
          <nav className="flex flex-wrap gap-3 text-sm">
            {config[kind]?.links.map(([label, url]) => (
              <Link key={url} className="underline" href={url}>
                {label}
              </Link>
            ))}
          </nav>
        )}
        <button
          className="text-sm underline"
          onClick={() => {
            signOut();
            router.push("/");
          }}
        >
          Sign out
        </button>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 md:flex-row md:px-8">
        {(kind === "owner" || kind === "admin") && (
          <aside className="w-full shrink-0 rounded-xl border bg-white p-4 md:sticky md:top-6 md:h-fit md:w-60">
            <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {config[kind].title}
            </p>
            <nav className="flex gap-2 overflow-x-auto md:flex-col">
              {config[kind].links.map(([label, url]) => (
                <Link
                  key={url}
                  aria-current={
                    url === (kind === "admin" ? activeAdminUrl : activeOwnerUrl)
                      ? "page"
                      : undefined
                  }
                  className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm ${url === (kind === "admin" ? activeAdminUrl : activeOwnerUrl) ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-100"}`}
                  href={url}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        )}
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
            Demo workspace · {user.name}
          </p>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold">
              {title ||
                section
                  ?.replaceAll("-", " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()) ||
                config[kind]?.title}
            </h1>
            <button
              className="rounded bg-slate-900 px-4 py-2 text-white"
              onClick={() =>
                exportRows(
                  rows.length
                    ? rows
                    : kind === "owner"
                      ? visibleBookings
                      : bookings,
                )
              }
            >
              Export CSV
            </button>
          </div>
          {message && (
            <p role="status" className="mb-4 rounded border p-3">
              {message}
            </p>
          )}
          {section === "new-car" || section === "edit-car" ? (
            <form
              onSubmit={submitCar}
              className="grid max-w-3xl gap-4 rounded-xl border bg-white p-5 md:grid-cols-2"
            >
              <label className="md:col-span-2">
                Car photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={chooseCarImage}
                  className="mt-2 block w-full rounded-lg border border-dashed border-slate-300 p-3 text-sm"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Upload a JPG, PNG, or other image up to 2 MB.
                </span>
                {form.image && (
                  <img
                    src={form.image}
                    alt="Car preview"
                    className="mt-3 h-48 w-full rounded-lg object-cover md:w-96"
                  />
                )}
              </label>
              <label>
                Make and model
                <input
                  required
                  className="mt-1 block w-full rounded border p-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Year
                <input
                  required
                  type="number"
                  min="1990"
                  max="2035"
                  className="mt-1 block w-full rounded border p-2"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </label>
              <label>
                Price per day (ETB)
                <input
                  required
                  type="number"
                  min="1"
                  className="mt-1 block w-full rounded border p-2"
                  value={form.pricePerDay}
                  onChange={(e) =>
                    setForm({ ...form, pricePerDay: e.target.value })
                  }
                />
              </label>
              <label>
                Seats
                <input
                  required
                  type="number"
                  min="1"
                  max="15"
                  className="mt-1 block w-full rounded border p-2"
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: e.target.value })}
                />
              </label>
              <label>
                Transmission
                <select
                  className="mt-1 block w-full rounded border p-2"
                  value={form.transmission}
                  onChange={(e) =>
                    setForm({ ...form, transmission: e.target.value })
                  }
                >
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </label>
              <label>
                Neighbourhood
                <input
                  required
                  className="mt-1 block w-full rounded border p-2"
                  value={form.neighbourhood}
                  onChange={(e) =>
                    setForm({ ...form, neighbourhood: e.target.value })
                  }
                />
              </label>
              <label className="md:col-span-2">
                Description
                <textarea
                  className="mt-1 block w-full rounded border p-2"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <p className="md:col-span-2 text-sm text-slate-600">
                New listings are marked pending until an admin approves them.
              </p>
              <button className="w-fit rounded bg-slate-900 px-4 py-2 text-white">
                Save listing
              </button>
            </form>
          ) : null}
          {section === "availability" ? (
            <form
              className="mb-5 flex flex-wrap gap-3 rounded border bg-white p-4"
              onSubmit={(e) => {
                e.preventDefault();
                act(saveAvailability(pathId, form.startDate, form.endDate));
              }}
            >
              <label>
                Unavailable from
                <input
                  className="ml-2 rounded border p-2"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </label>
              <label>
                Until
                <input
                  className="ml-2 rounded border p-2"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </label>
              <button className="rounded bg-slate-900 px-4 py-2 text-white">
                Save dates
              </button>
            </form>
          ) : null}
          {section === "reviews" ? (
            <div className="grid gap-3">
              {reviews
                .filter((r) => kind === "admin" || r.ownerId === user.id)
                .map((r) => (
                  <article key={r.id} className="rounded border bg-white p-4">
                    <b>{r.rating}/5</b>
                    <p>{r.comment}</p>
                    <p className="text-sm text-slate-500">
                      Booking {r.bookingId}
                    </p>
                    <label className="mt-3 block">
                      Owner reply
                      <input
                        className="mt-1 block w-full rounded border p-2"
                        defaultValue={r.ownerReply || ""}
                        onBlur={(e) => {
                          const all = getReviews().map((x) =>
                            x.id === r.id
                              ? { ...x, ownerReply: e.target.value }
                              : x,
                          );
                          act(writeStorage(KEYS.reviews, all));
                        }}
                      />
                    </label>
                  </article>
                ))}
              {!reviews.length && <p>No reviews to display yet.</p>}
            </div>
          ) : null}
          {section === "announcements" ? (
            <>
              <div className="mb-4 space-y-2">
                {announcements
                  .filter((a) => a.active)
                  .map((a) => (
                    <article key={a.id} className="rounded border bg-white p-3">
                      <b>{a.title}</b>
                      <p>{a.message}</p>
                    </article>
                  ))}
              </div>
              <form
                className="mb-5 grid max-w-xl gap-3 rounded border bg-white p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const result = writeStorage(KEYS.announcements, [
                    ...getAnnouncements(),
                    {
                      id: `announcement_${Date.now()}`,
                      title: form.title,
                      message: form.message,
                      active: true,
                      createdAt: new Date().toISOString(),
                      createdBy: user.id,
                    },
                  ]);
                  act(result);
                }}
              >
                <label>
                  Title
                  <input
                    required
                    className="mt-1 block w-full rounded border p-2"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </label>
                <label>
                  Message
                  <textarea
                    required
                    className="mt-1 block w-full rounded border p-2"
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                  />
                </label>
                <button className="rounded bg-slate-900 px-4 py-2 text-white">
                  Publish announcement
                </button>
              </form>
            </>
          ) : null}
          {section === "create-review" ? (
            <form
              className="grid max-w-xl gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                act(
                  createReview({
                    bookingId: pathId,
                    rating: form.rating,
                    comment: form.comment,
                  }),
                );
              }}
            >
              <label>
                Rating
                <select
                  className="ml-2 rounded border p-2"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label>
                Review
                <textarea
                  required
                  className="block w-full rounded border p-2"
                  value={form.comment}
                  onChange={(e) =>
                    setForm({ ...form, comment: e.target.value })
                  }
                />
              </label>
              <button className="rounded bg-slate-900 px-4 py-2 text-white">
                Submit review
              </button>
            </form>
          ) : null}
          {section === "create-dispute" ? (
            <form
              className="grid max-w-xl gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                act(
                  createDispute({
                    bookingId: pathId,
                    reason: form.reason,
                    description: form.description,
                  }),
                );
              }}
            >
              <label>
                Reason
                <input
                  required
                  className="block w-full rounded border p-2"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </label>
              <label>
                Description
                <textarea
                  required
                  className="block w-full rounded border p-2"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <button className="rounded bg-slate-900 px-4 py-2 text-white">
                Raise dispute
              </button>
            </form>
          ) : null}
          {section === "reports" ||
          section === "overview" ||
          section === "owner-overview" ||
          section === "admin-overview" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Listings", visibleCars.length],
                ["Bookings", visibleBookings.length],
                ["Reviews", reviews.length],
                [
                  "Open disputes",
                  disputes.filter((d) => d.status !== "resolved").length,
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-white p-5">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
          {section === "resolve-dispute" ? (
            <form
              className="mb-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                act(resolveDispute(pathId, form.resolutionNotes));
              }}
            >
              <label className="flex-1">
                Resolution notes
                <input
                  required
                  className="ml-2 w-full rounded border p-2"
                  value={form.resolutionNotes}
                  onChange={(e) =>
                    setForm({ ...form, resolutionNotes: e.target.value })
                  }
                />
              </label>
              <button className="self-end rounded bg-slate-900 px-4 py-2 text-white">
                Resolve
              </button>
            </form>
          ) : null}
          {section === "listings" && (
            <p className="mb-3 text-sm text-slate-600">
              Pending listings are hidden from public browse until approved.
            </p>
          )}
          {section === "listings" ? (
            <div className="space-y-3">
              {visibleCars.map((c) => (
                <article
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border bg-white p-4"
                >
                  <div>
                    <b>{c.name || `${c.make} ${c.model}`}</b>
                    <p className="text-sm text-slate-500">
                      {c.neighbourhood} · {money(c.pricePerDay ?? c.price)} /
                      day · {c.status}
                    </p>
                  </div>
                  {kind === "admin" ? (
                    <div className="flex gap-2">
                      <button
                        className="rounded border px-3 py-2"
                        onClick={() => act(moderateCar(c.id, "approved"))}
                      >
                        Approve
                      </button>
                      <button
                        className="rounded border px-3 py-2"
                        onClick={() => act(moderateCar(c.id, "rejected"))}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <Link
                        className="underline"
                        href={`/owner/cars/${c.id}/edit`}
                      >
                        Edit
                      </Link>
                      <Link
                        className="underline"
                        href={`/owner/cars/${c.id}/availability`}
                      >
                        Availability
                      </Link>
                      <Link
                        className="underline"
                        href={`/owner/cars/${c.id}/bookings`}
                      >
                        Bookings
                      </Link>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : null}
          {section === "user-detail" ? (() => {
            const selectedUser = users.find((entry) => entry.id === pathId);
            if (!selectedUser) return <p role="alert" className="rounded border bg-white p-5">User not found.</p>;
            const userBookings = bookings.filter((booking) => booking.renterId === selectedUser.id || booking.ownerId === selectedUser.id);
            const userCars = cars.filter((car) => car.ownerId === selectedUser.id);
            return <section className="grid gap-4 rounded-xl border bg-white p-5">
              <div><h2 className="text-xl font-semibold">{selectedUser.name}</h2><p className="text-slate-600">{selectedUser.email}</p></div>
              <dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">Account ID</dt><dd>{selectedUser.id}</dd></div><div><dt className="text-sm text-slate-500">Phone</dt><dd>{selectedUser.phone || "Not provided"}</dd></div><div><dt className="text-sm text-slate-500">Roles</dt><dd>{(selectedUser.roles || [selectedUser.role]).join(", ")}</dd></div><div><dt className="text-sm text-slate-500">Status</dt><dd>{selectedUser.status || "active"}</dd></div><div><dt className="text-sm text-slate-500">Joined</dt><dd>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "Unknown"}</dd></div><div><dt className="text-sm text-slate-500">Related records</dt><dd>{userBookings.length} bookings · {userCars.length} cars</dd></div></dl>
              <div className="flex flex-wrap gap-3"><button className="rounded border px-3 py-2" onClick={() => act(setUserStatus(selectedUser.id, selectedUser.status === "suspended" ? "active" : "suspended"))}>{selectedUser.status === "suspended" ? "Reinstate account" : "Suspend account"}</button><Link className="self-center underline" href="/admin/users">Back to users</Link></div>
              <h3 className="font-semibold">Related bookings</h3>{userBookings.length ? userBookings.map((booking) => <p key={booking.id} className="text-sm">{booking.carName} · {booking.startDate} to {booking.endDate} · {booking.status}</p>) : <p className="text-sm text-slate-600">No related bookings.</p>}
            </section>;
          })() : null}
          {section === "users" ? (
            <div className="space-y-3">
              {users.map((u) => (
                <article
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border bg-white p-4"
                >
                  <div>
                    <b>{u.name}</b>
                    <p className="text-sm text-slate-500">
                      {u.email} · {(u.roles || [u.role]).join(", ")} ·{" "}
                      {u.status || "active"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3"><Link className="underline" href={`/admin/users/${u.id}`}>Details</Link><button
                    className="rounded border px-3 py-2"
                    onClick={() =>
                      act(
                        setUserStatus(
                          u.id,
                          u.status === "suspended" ? "active" : "suspended",
                        ),
                      )
                    }
                  >
                    {u.status === "suspended" ? "Reinstate" : "Suspend"}
                  </button></div>
                </article>
              ))}
            </div>
          ) : null}
          {section === "bookings" || section === "car-bookings" ? (
            <div className="space-y-3">
              {section === "bookings" && (
                <div className="mb-4 flex flex-wrap items-end gap-3 rounded border bg-white p-4">
                  <label className="grid gap-1 text-sm">Filter by status
                    <select className="rounded border p-2" value={bookingStatusFilter} onChange={(event) => setBookingStatusFilter(event.target.value)}>
                      <option value="all">All statuses</option>
                      {["requested", "confirmed", "in_progress", "completed", "reviewed", "cancelled", "declined", "disputed", "resolved"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                    </select>
                  </label>
                  <p className="text-sm text-slate-600">{filteredBookings.length} booking(s)</p>
                  <button className="ml-auto rounded border px-3 py-2 text-sm" onClick={() => exportCsv("my-bookings.csv", [["Booking ID", "Car", "Pickup", "Return", "Total ETB", "Status"], ...filteredBookings.map((b) => [b.id, b.carName, b.startDate, b.endDate, b.total, b.status])])}>Export filtered CSV</button>
                </div>
              )}
              {(section === "car-bookings"
                ? visibleCarBookings
                : filteredBookings
              ).map((b) => (
                <article
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border bg-white p-4"
                >
                  <div>
                    <b>{b.carName || `Car ${b.carId}`}</b>
                    <p>
                      {b.startDate} → {b.endDate} · {money(b.total)} ·{" "}
                      <strong>{b.status}</strong>
                    </p>
                    <p className="text-xs text-slate-500">Booking {b.id}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {kind === "owner" && b.status === "requested" && (
                      <>
                        <button
                          className="rounded border px-3 py-2"
                          onClick={() =>
                            act(transitionBooking(b.id, "approve"))
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="rounded border px-3 py-2"
                          onClick={() =>
                            act(transitionBooking(b.id, "decline"))
                          }
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {kind === "owner" && b.status === "confirmed" && b.paymentStatus === "paid" && (
                      <button
                        className="rounded border px-3 py-2"
                        onClick={() => act(transitionBooking(b.id, "start"))}
                      >
                        Start trip
                      </button>
                    )}
                    {kind === "owner" && b.status === "confirmed" && b.paymentStatus !== "paid" && <span className="self-center text-sm text-slate-500">Waiting for renter payment</span>}
                    {kind === "owner" && b.status === "in_progress" && (
                      <><button className="rounded border px-3 py-2" onClick={() => act(transitionBooking(b.id, "complete"))}>Complete trip</button><Link className="self-center underline" href={`/bookings/${b.id}/dispute`}>Raise issue</Link></>
                    )}
                    {kind === "admin" && (
                      <Link className="underline" href={`/admin/bookings`}>
                        Inspect
                      </Link>
                    )}
                  </div>
                </article>
              ))}
              {(section === "car-bookings"
                ? visibleCarBookings
                : filteredBookings
              ).length === 0 && <p>No bookings to display yet.</p>}
            </div>
          ) : null}
          {section === "disputes" ? (
            <div className="space-y-3">
              {visibleDisputes.map((d) => (
                <article key={d.id} className="rounded border bg-white p-4">
                  <b>{d.reason}</b>
                  <p>{d.description}</p>
                  <p className="text-sm">Status: {d.status}</p>
                  {kind === "admin" && d.status !== "resolved" && (
                    <Link
                      className="underline"
                      href={`/admin/disputes/${d.id}`}
                    >
                      Resolve dispute
                    </Link>
                  )}
                </article>
              ))}
              {!visibleDisputes.length && <p>No disputes to review.</p>}
            </div>
          ) : null}
          {section === "earnings" ? (
            <div className="rounded border bg-white p-4">
              <h2 className="font-semibold">Earnings summary</h2>
              <p className="mt-2">
                Completed / confirmed booking value:{" "}
                {money(
                  visibleBookings
                    .filter((b) =>
                      [
                        "confirmed",
                        "in_progress",
                        "completed",
                        "reviewed",
                      ].includes(b.status),
                    )
                    .reduce((sum, b) => sum + Number(b.subtotal || 0), 0),
                )}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Demo estimate based on browser-stored booking records; not
                actual payouts.
              </p>
            </div>
          ) : null}
          {section === "booking-detail"
            ? (() => {
                const b = bookings.find((x) => x.id === pathId);
                if (!b || b.renterId !== user.id)
                  return <p role="alert">Booking not found or not yours.</p>;
                return (
                  <article className="rounded border bg-white p-5">
                    <h2 className="text-xl font-bold">
                      {b.carName || `Car ${b.carId}`}
                    </h2>
                    <p className="mt-2">
                      {b.startDate} → {b.endDate} · {b.days} day(s)
                    </p>
                    <p className="mt-2">
                      Subtotal: {money(b.subtotal)} · Platform fee:{" "}
                      {money(b.fee)} · Total: <b>{money(b.total)}</b>
                    </p>
                    <p className="mt-2">
                      Status: <b>{b.status}</b> · Payment: {b.paymentStatus}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {b.status === "requested" && (
                        <button
                          className="rounded border px-3 py-2"
                          onClick={() => act(transitionBooking(b.id, "cancel"))}
                        >
                          Cancel request
                        </button>
                      )}
                      {b.status === "confirmed" && (
                        <button className="rounded border px-3 py-2" onClick={() => act(transitionBooking(b.id, "cancel"))}>Cancel booking</button>
                      )}
                      {b.status === "confirmed" && (
                        <button
                          className="rounded border px-3 py-2"
                          onClick={() => act(transitionBooking(b.id, "pay"))}
                        >
                          Complete demo payment
                        </button>
                      )}
                      {b.status === "completed" && (
                        <Link
                          className="underline"
                          href={`/bookings/${b.id}/review`}
                        >
                          Leave review
                        </Link>
                      )}
                      {b.status === "in_progress" && (
                        <>
                          <Link
                            className="underline"
                            href={`/bookings/${b.id}/track`}
                          >
                            Track (simulation)
                          </Link>
                          <Link
                            className="underline"
                            href={`/bookings/${b.id}/dispute`}
                          >
                            Raise issue
                          </Link>
                        </>
                      )}
                    </div>
                    <p className="mt-5 text-sm text-slate-500">
                      Mock receipt only. No real payment is processed.
                    </p>
                  </article>
                );
              })()
            : null}
          {section === "renter-overview" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Upcoming",
                  visibleBookings.filter((b) =>
                    ["requested", "confirmed"].includes(b.status),
                  ).length,
                ],
                [
                  "Completed",
                  visibleBookings.filter((b) =>
                    ["completed", "reviewed"].includes(b.status),
                  ).length,
                ],
                [
                  "Cancelled",
                  visibleBookings.filter((b) => b.status === "cancelled")
                    .length,
                ],
                [
                  "Demo spend",
                  money(
                    visibleBookings
                      .filter((b) => b.paymentStatus === "paid")
                      .reduce((s, b) => s + Number(b.total || 0), 0),
                  ),
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-white p-5">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
          {section === "track"
            ? (() => {
                const b = bookings.find((x) => x.id === pathId);
                if (
                  !b ||
                  b.renterId !== user.id ||
                  !["confirmed", "in_progress", "completed"].includes(b.status)
                )
                  return (
                    <p role="alert">
                      Tracking is unavailable for this booking.
                    </p>
                  );
                return (
                  <div className="rounded border bg-white p-5">
                    <p className="font-semibold">Trip tracking — Simulation</p>
                    <p className="mt-2">
                      This is a seeded demo status only. No live GPS data is
                      collected.
                    </p>
                    <p className="mt-2">Booking status: {b.status}</p>
                  </div>
                );
              })()
            : null}
          {![
            "new-car",
            "edit-car",
            "availability",
            "reviews",
            "announcements",
            "create-review",
            "create-dispute",
            "reports",
            "overview",
            "owner-overview",
            "admin-overview",
            "renter-overview",
            "resolve-dispute",
            "listings",
            "users",
            "user-detail",
            "bookings",
            "booking-detail",
            "car-bookings",
            "disputes",
            "earnings",
            "track",
          ].includes(section) && (
            <div className="rounded border bg-white p-5">
              <p>No records to display.</p>
            </div>
          )}
          <p className="mt-8 text-xs text-slate-500">
            Demo data only. Browser storage is editable and these frontend
            checks are not production security.
          </p>
        </div>
      </div>
    </main>
  );
}
