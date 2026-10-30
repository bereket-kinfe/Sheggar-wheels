"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import carDetails from "../car-details.json";
import { getSession } from "../../lib/auth";

const BOOKINGS_KEY = "sw_bookings_v1";

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date, numberOfDays) {
  const result = new Date(date);
  result.setDate(result.getDate() + numberOfDays);
  return getLocalDateString(result);
}

function calculateDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US").format(price);
}

export default function BookingPage() {
  const router = useRouter();

  const [carId, setCarId] = useState("");
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const selectedCarId = query.get("carId") || "";

    setCarId(selectedCarId);

    const session = getSession();
    setUser(session);

    if (!session) {
      const destination = `/booking?carId=${encodeURIComponent(selectedCarId)}`;
      router.replace(`/signin?next=${encodeURIComponent(destination)}`);
      setCheckingSession(false);
      return;
    }

    const today = new Date();
    setStartDate(addDays(today, 1));
    setEndDate(addDays(today, 2));
    setCheckingSession(false);
  }, [router]);
 
  const car = carDetails.find((item) => item.id === Number(carId));

  const rentalDays = calculateDays(startDate, endDate);
  const totalPrice = car && rentalDays > 0 ? car.price * rentalDays : 0;

  function handleBooking(event) {
    event.preventDefault();
    setError("");

    if (!user) {
      setError("Please sign in before making a booking.");
      return;
    }

    if (!(user.roles || [user.role]).includes("renter")) {
      setError(
        "Only renter accounts can book cars. Please use a renter account.",
      );
      return;
    }

    if (!car) {
      setError("We could not find the selected car.");
      return;
    }

    const today = getLocalDateString(new Date());

    if (!startDate || !endDate || startDate < today) {
      setError("Please select a valid pickup date.");
      return;
    }

    if (rentalDays < 1) {
      setError("Your return date must be after your pickup date.");
      return;
    }

    let existingBookings = [];

    try {
      existingBookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
    } catch {
      existingBookings = [];
    }

    const hasConflict = existingBookings.some((existing) => {
      if (String(existing.carId) !== String(car.id) || ["cancelled", "declined", "resolved"].includes(existing.status)) {
        return false;
      }

      return startDate < existing.endDate && endDate > existing.startDate;
    });

    if (hasConflict) {
      setError(
        "This car already has a booking during those dates. Please choose different dates.",
      );
      return;
    }

    const newBooking = {
      id: crypto.randomUUID(),
      userId: user.id,
      renterId: user.id,
      renterName: user.name,
      renterEmail: user.email,
      carId: car.id,
      carName: car.name,
      startDate,
      endDate,
      days: rentalDays,
      pricePerDay: car.price,
      totalPrice,
      ownerId: car.ownerId || "demo-owner",
      subtotal: totalPrice,
      fee: Math.round(totalPrice * 0.05),
      total: totalPrice + Math.round(totalPrice * 0.05),
      paymentStatus: "unpaid",
      status: "requested",
      createdAt: new Date().toISOString(),
    };

    const updatedBookings = [...existingBookings, newBooking];

    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updatedBookings));
    router.push(`/checkout?bookingId=${newBooking.id}`);
  }

  if (checkingSession) {
    return (
      <main className="booking-page">
        <p className="booking-message">Checking your session...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="booking-page">
        <p className="booking-message">Redirecting you to sign in...</p>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="booking-page">
        <header className="booking-header">
          <Link href="/" className="catalogue-logo">
            SHEGGAR<span>WHEELS</span>
          </Link>
        </header>

        <section className="booking-message">
          <h1>Car not found</h1>
          <p>Please return to the catalogue and select a car.</p>
          <Link href="/cars" className="booking-button">
            Browse cars
          </Link>
        </section>
      </main>
    );
  }

  if (!(user.roles || [user.role]).includes("renter")) {
    return (
      <main className="booking-page">
        <header className="booking-header">
          <Link href="/" className="catalogue-logo">
            SHEGGAR<span>WHEELS</span>
          </Link>
        </header>

        <section className="booking-message">
          <h1>Renter account required</h1>
          <p>
            You are signed in as a {user.role}. To book a car, use a renter
            account.
          </p>
          <Link href="/cars" className="booking-button">
            Return to cars
          </Link>
        </section>
      </main>
    );
  }

  if (booking) {
    return (
      <main className="booking-page">
        <header className="booking-header">
          <Link href="/" className="catalogue-logo">
            SHEGGAR<span>WHEELS</span>
          </Link>
        </header>

        <section className="booking-success">
          <div className="booking-success-icon">✓</div>
          <p className="booking-eyebrow">REQUEST SAVED</p>
          <h1>Your booking request is ready.</h1>
          <p>
            Your request for the {booking.carName} has been saved in this
            browser. It is pending and is not yet confirmed.
          </p>

          <div className="booking-summary">
            <p>
              <span>Booking reference</span>
              <strong>{booking.id.slice(0, 8).toUpperCase()}</strong>
            </p>
            <p>
              <span>Vehicle</span>
              <strong>{booking.carName}</strong>
            </p>
            <p>
              <span>Pickup</span>
              <strong>{booking.startDate}</strong>
            </p>
            <p>
              <span>Return</span>
              <strong>{booking.endDate}</strong>
            </p>
            <p>
              <span>Rental duration</span>
              <strong>
                {booking.days} {booking.days === 1 ? "day" : "days"}
              </strong>
            </p>
            <p>
              <span>Total estimated price</span>
              <strong>ETB {formatPrice(booking.totalPrice)}</strong>
            </p>
            <p>
              <span>Status</span>
              <strong>Pending</strong>
            </p>
          </div>

          <Link href="/cars" className="booking-button">
            Browse more cars
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <header className="booking-header">
        <Link href="/" className="catalogue-logo">
          SHEGGAR<span>WHEELS</span>
        </Link>

        <nav>
          <span>Hi, {user.name}</span>
          <Link href="/cars">Browse cars</Link>
        </nav>
      </header>

      <div className="booking-container">
        <Link href={`/cars/${car.id}`} className="booking-back-link">
          ← Back to car details
        </Link>

        <div className="booking-layout">
          <section className="booking-form-panel">
            <p className="booking-eyebrow">YOUR NEXT JOURNEY</p>
            <h1>Request a booking.</h1>
            <p className="booking-description">
              Choose your pickup and return dates to calculate your estimated
              rental price.
            </p>

            <form onSubmit={handleBooking} className="booking-form">
              <label>
                Pickup date
                <input
                  type="date"
                  value={startDate}
                  min={getLocalDateString(new Date())}
                  onChange={(event) => {
                    const nextStart = event.target.value;
                    setStartDate(nextStart);

                    if (endDate <= nextStart) {
                      setEndDate(addDays(new Date(`${nextStart}T00:00:00`), 1));
                    }
                  }}
                  required
                />
              </label>

              <label>
                Return date
                <input
                  type="date"
                  value={endDate}
                  min={startDate || getLocalDateString(new Date())}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                />
              </label>

              <div className="booking-price-breakdown">
                <p>
                  <span>Daily price</span>
                  <strong>ETB {formatPrice(car.price)}</strong>
                </p>
                <p>
                  <span>Rental duration</span>
                  <strong>
                    {rentalDays > 0 ? rentalDays : 0}{" "}
                    {rentalDays === 1 ? "day" : "days"}
                  </strong>
                </p>
                <div className="booking-total">
                  <span>Estimated total</span>
                  <strong>ETB {formatPrice(totalPrice)}</strong>
                </div>
              </div>

              {error && (
                <p className="booking-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="booking-button">
                Submit booking request
              </button>

              <small className="booking-disclaimer">
                Demo only. No payment will be taken. Submitting creates a
                pending request, not a confirmed reservation.
              </small>
            </form>
          </section>

          <aside className="booking-car-card">
            <Image src={car.image} alt={car.name} width={1200} height={800} />
            <div className="booking-car-card-body">
              <p className="booking-eyebrow">YOUR SELECTED CAR</p>
              <h2>{car.name}</h2>
              <p>{car.type}</p>
              <p>{car.location}</p>

              <div className="booking-car-specs">
                <span>{car.year}</span>
                <span>{car.transmission}</span>
                <span>{car.seats} seats</span>
              </div>

              <p className="booking-card-price">
                ETB {formatPrice(car.price)}
                <span> / day</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
