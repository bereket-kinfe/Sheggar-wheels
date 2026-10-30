import Link from "next/link";
import Image from "next/image";
import carDetails from "../../car-details.json";

export function generateStaticParams() {
  return carDetails.map((car) => ({ id: String(car.id) }));
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US").format(price);
}

export default async function CarDetailsPage({ params }) {
  const { id } = await params;
  const carId = Number(id);

  const car = carDetails.find((item) => item.id === carId);

  // Show a helpful message if the car ID does not exist.
  if (!car) {
    return (
      <main className="car-details-page">
        <header className="details-header">
          <Link href="/" className="catalogue-logo">
            SHEGGAR<span>WHEELS</span>
          </Link>
        </header>

        <section className="car-not-found">
          <h1>Car not found</h1>
          <p>
            We couldn&apos;t find this vehicle. It may not exist or its link may be
            incorrect.
          </p>
          <Link href="/cars" className="details-primary-button">
            Browse all cars
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="car-details-page">
      <header className="details-header">
        <Link href="/" className="catalogue-logo">
          SHEGGAR<span>WHEELS</span>
        </Link>

        <nav>
          <Link href="/">Home</Link>
          <Link href="/cars">Browse Cars</Link>
        </nav>
      </header>

      <div className="details-container">
        <Link href="/cars" className="back-to-cars">
          ← Back to all cars
        </Link>

        <section className="details-layout">
          <div className="details-image-section">
            <Image
              src={car.image}
              alt={car.name}
              width={1200}
              height={800}
              className="details-main-image"
            />
            <p className="details-image-caption">{car.location}</p>
          </div>

          <div className="details-info">
            <p className="details-eyebrow">{car.type}</p>
            <h1>{car.name}</h1>

            <p className="details-location">
              <span aria-hidden="true">⌖</span> {car.location}
            </p>

            <a className="mt-2 inline-block text-sm underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(car.location)}`} target="_blank" rel="noreferrer">View location on map</a>

            <div className="details-divider" />

            <div className="details-price">
              <span>Daily rental price</span>
              <p>
                ETB {formatPrice(car.price)}
                <small> / day</small>
              </p>
            </div>

            <div className="details-divider" />

            <h2>Vehicle specifications</h2>

            <div className="details-spec-grid">
              <div className="details-spec">
                <span>Year</span>
                <strong>{car.year}</strong>
              </div>

              <div className="details-spec">
                <span>Transmission</span>
                <strong>{car.transmission}</strong>
              </div>

              <div className="details-spec">
                <span>Seats</span>
                <strong>{car.seats} people</strong>
              </div>

              <div className="details-spec">
                <span>Fuel type</span>
                <strong>{car.fuel}</strong>
              </div>

              <div className="details-spec">
                <span>Category</span>
                <strong>{car.type}</strong>
              </div>

              <div className="details-spec">
                <span>Vehicle ID</span>
                <strong>#{car.id}</strong>
              </div>
            </div>

            <section className="mt-5 rounded-xl border bg-white p-4" aria-labelledby="availability-heading">
              <h2 id="availability-heading" className="font-semibold">Availability</h2>
              <p className="mt-2 text-sm text-slate-600">Choose pickup and return dates in the booking form. The request checks owner-blocked dates and existing bookings before it is saved.</p>
            </section>

            <div className="details-booking-box">
              <p>
                Ready to plan your journey? Continue to start your rental
                request.
              </p>

              <Link
                href={`/booking?carId=${car.id}`}
                className="details-primary-button"
              >
                Book this car
              </Link>
              <small>
                Your booking is not confirmed until you complete the booking
                process.
              </small>
            </div>
          </div>
        </section>
      </div>

      <footer className="catalogue-footer">
        <Link href="/">SHEGGAR WHEELS</Link>
        <p>Find a car. Make the journey yours.</p>
      </footer>
    </main>
  );
}
