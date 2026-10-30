"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "../../lib/auth";
import carDetails from "../car-details.json";

const BOOKINGS_KEY = "sw_bookings_v1";

export default function CheckoutPage() {
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- load client-only session and local booking data after hydration */
  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace("/signin?next=%2Fdashboard%2Fbookings");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("bookingId");

    if (!bookingId) {
      setError("No booking was selected for checkout.");
      setLoading(false);
      return;
    }

    try {
      const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");

      const found = bookings.find(
        (item) =>
          String(item.id) === String(bookingId) &&
          String(item.userId) === String(session.id),
      );

      if (!found) {
        setError("Booking not found. Please check your bookings.");
        setLoading(false);
        return;
      }

      const foundCar = carDetails.find(
        (item) => String(item.id) === String(found.carId),
      );

      if (!foundCar) {
        setError("The car for this booking could not be found.");
        setLoading(false);
        return;
      }

      setBooking(found);
      setCar(foundCar);
      setPaid(found.paymentStatus === "paid");
    } catch {
      setError("We couldn't load your booking. Please try again.");
    }

    setLoading(false);
  }, [router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function simulatePayment() {
    if (!booking || paying || paid) return;
    if (booking.status !== "confirmed") {
      setError(
        "Payment is available only after the owner confirms your booking.",
      );
      return;
    }

    setPaying(true);
    setError("");

    try {
      const bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");

      const index = bookings.findIndex(
        (item) =>
          String(item.id) === String(booking.id) &&
          String(item.renterId || item.userId) === String(getSession()?.id),
      );

      if (index === -1) {
        setError("Your booking could not be found.");
        setPaying(false);
        return;
      }

      // Demo payment only — no real TeleBirr transaction occurs.
      const updatedBooking = {
        ...bookings[index],
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "TeleBirr (Demo)",
        paidAt: new Date().toISOString(),
      };

      bookings[index] = updatedBooking;

      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));

      setBooking(updatedBooking);
      setPaid(true);
    } catch {
      setError("Payment confirmation failed. Please try again.");
    }

    setPaying(false);
  }

  if (loading) {
    return <main className="checkout-page">Loading checkout...</main>;
  }

  if (error && !booking) {
    return (
      <main className="checkout-page">
        <div className="checkout-card">
          <h1>Checkout unavailable</h1>
          <p>{error}</p>
          <Link href="/dashboard/bookings" className="checkout-button">
            View my bookings
          </Link>
        </div>
      </main>
    );
  }

  if (!booking || !car) return null;

  const total = Number(booking.total ?? booking.totalPrice ?? 0);

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <Link href="/dashboard/bookings" className="checkout-back">
          ← Back to my bookings
        </Link>

        <header className="checkout-heading">
          <p className="checkout-eyebrow">SHEGGAR WHEELS</p>
          <h1>
            {paid
              ? "Payment recorded (Demo)"
              : booking.status === "requested"
                ? "Awaiting owner approval"
                : "Complete your booking"}
          </h1>
          <p>
            {paid
              ? "Your demo payment has been recorded successfully."
              : booking.status === "requested"
                ? "Your request is saved. The owner must confirm it before mock payment is available."
                : "Review your confirmed reservation before continuing."}
          </p>
        </header>

        <section className="checkout-card">
          <Image
            src={car.image}
            alt={car.name}
            width={1200}
            height={800}
            className="checkout-car-image"
          />

          <div className="checkout-car-info">
            <p className="checkout-eyebrow">YOUR SELECTED CAR</p>
            <h2>{car.name}</h2>
            <p>{car.location}</p>
          </div>

          <div className="checkout-detail">
            <span>Pick-up date</span>
            <strong>{booking.startDate}</strong>
          </div>

          <div className="checkout-detail">
            <span>Return date</span>
            <strong>{booking.endDate}</strong>
          </div>

          <div className="checkout-detail">
            <span>Booking reference</span>
            <strong>{String(booking.id).slice(0, 8)}</strong>
          </div>

          <div className="checkout-total">
            <span>Total amount</span>
            <strong>
              {Number(
                booking.total ?? booking.totalPrice ?? total,
              ).toLocaleString()}{" "}
              ETB
            </strong>
          </div>

          {paid ? (
            <div className="checkout-success">
              <h3>Payment successful (Demo)</h3>
              <p>
                Your booking has been paid in the demo. No real payment was
                processed.
              </p>
              <Link href="/dashboard/bookings" className="checkout-button">
                View my bookings
              </Link>
            </div>
          ) : (
            <>
              <div className="checkout-payment-method">
                <div>
                  <strong>TeleBirr</strong>
                  <p>Simulated payment for this frontend demo</p>
                </div>
                <span>Selected</span>
              </div>

              {error && <p className="checkout-error">{error}</p>}

              <button
                type="button"
                className="checkout-button"
                onClick={simulatePayment}
                disabled={paying || booking.status !== "confirmed"}
              >
                {paying
                  ? "Processing..."
                  : `Simulate payment · ${total.toLocaleString()} ETB`}
              </button>

              <p className="checkout-disclaimer">
                Demo only. This button does not connect to the real TeleBirr
                service or transfer money.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
