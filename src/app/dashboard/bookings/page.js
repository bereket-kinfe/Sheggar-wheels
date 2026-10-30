
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSession, signOut } from "../../../lib/auth";
import carDetails from "../../car-details.json";

const BOOKINGS_KEY = "sheggar_wheels_bookings";

function formatPrice(price) {
  return new Intl.NumberFormat("en-US").format(Number(price) || 0);
}

function formatDate(date) {
  if (!date) return "Not specified";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatus(status) {
  const normalized = String(status || "pending").toLowerCase();

  if (normalized === "confirmed") return "Confirmed";
  if (normalized === "cancelled") return "Cancelled";
  if (normalized === "completed") return "Completed";

  return "Pending";
}

export default function MyBookingsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect -- load client-only session and local booking data after hydration */
  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace(
        "/signin?next=%2Fdashboard%2Fbookings"
      );
      return;
    }

    if (session.role !== "renter") {
      router.replace("/cars");
      return;
    }

    setUser(session);

    try {
      const stored = JSON.parse(
        localStorage.getItem(BOOKINGS_KEY) || "[]"
      );

      if (!Array.isArray(stored)) {
        throw new Error("Invalid bookings data");
      }

      // Show only bookings created by this renter.
      const mine = stored.filter(
        (booking) =>
          String(booking.userId) === String(session.id)
      );

      setBookings(mine);
    } catch {
      setError("We couldn't load your bookings. Please refresh the page.");
    }

    setReady(true);
  }, [router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSignOut() {
    signOut();
    router.replace("/signin");
  }

  if (!ready) {
    return (
      <main className="dashboard-page">
        <p className="dashboard-loading">Loading your bookings...</p>
      </main>
    );
  }

  if (!user) return null;

  const pendingCount = bookings.filter(
    (booking) => getStatus(booking.status) === "Pending"
  ).length;

  const confirmedCount = bookings.filter(
    (booking) => getStatus(booking.status) === "Confirmed"
  ).length;

  const completedCount = bookings.filter(
    (booking) => getStatus(booking.status) === "Completed"
  ).length;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link href="/" className="catalogue-logo">
          SHEGGAR<span>WHEELS</span>
        </Link>

        <nav>
          <Link href="/cars">Browse cars</Link>
          <button onClick={handleSignOut} className="dashboard-signout">
            Sign out
          </button>
        </nav>
      </header>

      <div className="dashboard-container">
        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">RENTER DASHBOARD</p>
            <h1>Welcome, {user.name}.</h1>
            <p>Manage your car rental requests in one place.</p>
          </div>

          <Link href="/cars" className="dashboard-primary-button">
            Find a car
          </Link>
        </section>

        <section className="dashboard-stats">
          <article className="dashboard-stat">
            <span>Total bookings</span>
            <strong>{bookings.length}</strong>
          </article>

          <article className="dashboard-stat">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </article>

          <article className="dashboard-stat">
            <span>Confirmed</span>
            <strong>{confirmedCount}</strong>
          </article>

          <article className="dashboard-stat">
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </article>
        </section>

        <section className="dashboard-bookings-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>My bookings</h2>
              <p>View the status and details of your rental requests.</p>
            </div>
          </div>

          {error && (
            <p className="dashboard-error" role="alert">
              {error}
            </p>
          )}

          {!error && bookings.length === 0 && (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">
                <span aria-hidden="true">⌑</span>
              </div>

              <h3>No bookings yet</h3>

              <p>
                When you request a rental, it will appear here.
              </p>

              <Link href="/cars" className="dashboard-primary-button">
                Browse available cars
              </Link>
            </div>
          )}

          {!error && bookings.length > 0 && (
            <div className="dashboard-booking-list">
              {bookings.map((booking) => {
                const car = carDetails.find(
                  (item) => String(item.id) === String(booking.carId)
                );

                const status = getStatus(booking.status);

                return (
                  <article
                    className="dashboard-booking-card"
                    key={booking.id}
                  >
                    <div className="dashboard-booking-image">
                      {car ? (
                        <Image src={car.image} alt={car.name} width={1200} height={800} />
                      ) : (
                        <div className="dashboard-image-placeholder">
                          Car unavailable
                        </div>
                      )}
                    </div>

                    <div className="dashboard-booking-info">
                      <div className="dashboard-booking-title">
                        <div>
                          <p className="dashboard-booking-reference">
                            Booking {booking.id ? `#${String(booking.id).slice(0, 8)}` : ""}
                          </p>

                          <h3>{car?.name || "Unknown car"}</h3>
                          <p className="dashboard-booking-location">
                            {car?.location || "Location unavailable"}
                          </p>
                        </div>

                        <span
                          className={`booking-status status-${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="dashboard-booking-dates">
                        <div>
                          <span>Pick-up</span>
                          <strong>{formatDate(booking.startDate)}</strong>
                        </div>

                        <div>
                          <span>Return</span>
                          <strong>{formatDate(booking.endDate)}</strong>
                        </div>
                      </div>

                      <div className="dashboard-booking-bottom">
                        <p>
                          <span>Total</span>
                          <strong>
                            ETB {formatPrice(booking.totalPrice)}
                          </strong>
                        </p>

                        {car && (
                          <Link
                            href={`/cars/${car.id}`}
                            className="dashboard-view-link"
                          >
                            View car
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <footer className="catalogue-footer">
        <Link href="/">SHEGGAR WHEELS</Link>
        <p>Find a car. Make the journey yours.</p>
      </footer>
    </main>
  );
}
