import carDetails from "./car-details.json";
import Link from "next/link";
import Image from "next/image";

const featuredCars = carDetails.slice(0, 3);

function formatPrice(price) {
  return new Intl.NumberFormat("en-ET").format(price);
}

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-mark">S</span>
          <span>
            sheggar<span className="brand-light"> wheels</span>
          </span>
        </Link>

        <nav className="main-nav">
          <Link href="/">Home</Link>
          <Link href="/cars">Explore cars</Link>
          <a href="#how-it-works">How it works</a>
        </nav>

        <div className="header-actions">
          <Link href="/signin" className="signin-link">
            Sign in
          </Link>
          <Link href="/signup" className="button button-dark">
            Get started
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">CAR RENTAL, MADE PERSONAL</span>

          <h1>
            The right car.
            <br />
            <span>For your next journey.</span>
          </h1>

          <p className="hero-description">
            Discover cars from local owners in Addis Ababa. Find your ride,
            choose your dates, and get moving.
          </p>

          <form action="/cars" className="search-panel">
            <label className="search-field">
              <span>Pick-up location</span>
              <select name="city" defaultValue="Addis Ababa">
                <option value="Addis Ababa">Addis Ababa</option>
                <option value="Bole">Bole</option>
                <option value="Kazanchis">Kazanchis</option>
                <option value="Piazza">Piassa</option>
                <option value="CMC">CMC</option>
                <option value="Megenagna">Megenagna</option>
              </select>
            </label>

            <label className="search-field">
              <span>Pick-up date</span>
              <input type="date" name="startDate" />
            </label>

            <label className="search-field">
              <span>Return date</span>
              <input type="date" name="endDate" />
            </label>

            <button className="button button-dark search-button">
              Explore cars <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="demo-note">Demo data · sample vehicles and prices</p>
        </div>

        <div className="hero-visual">
          <Image
            src={featuredCars[0].image}
            alt="Example car available for rental"
            width={1200}
            height={800}
          />
          <div className="image-caption">
            <span>YOUR NEXT JOURNEY STARTS HERE</span>
            <span>Addis Ababa, Ethiopia</span>
          </div>
        </div>
      </section>

      <section className="featured-section" id="featured">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EXPLORE THE COLLECTION</span>
            <h2>Find your kind of drive.</h2>
            <p>Sample vehicles for different journeys and budgets.</p>
          </div>
          <Link href="/cars" className="text-link">
            View all cars →
          </Link>
        </div>

        <div className="car-grid">
          {featuredCars.map((car) => (
            <article className="car-card" key={car.id}>
              <Link href={`/cars/${car.id}`} className="car-image">
                <Image src={car.image} alt={car.name} width={1200} height={800} />
              </Link>

              <div className="car-details">
                <span className="car-type">{car.type}</span>
                <h3>{car.name}</h3>
                <p className="car-price">
                  <strong>ETB {formatPrice(car.price)}</strong>
                  <span> / day</span>
                </p>
                <Link href={`/cars/${car.id}`} className="car-link">
                  View details <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <span className="eyebrow">SIMPLE BY DESIGN</span>
        <h2>Your journey in three steps.</h2>

        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <h3>Find your car</h3>
            <p>Explore vehicles and compare rental options.</p>
          </article>

          <article className="step-card">
            <span className="step-number">02</span>
            <h3>Request a booking</h3>
            <p>Choose your dates and submit a rental request.</p>
          </article>

          <article className="step-card">
            <span className="step-number">03</span>
            <h3>Enjoy the journey</h3>
            <p>Keep track of your booking and its status.</p>
          </article>
        </div>
      </section>

      <section className="owner-banner">
        <div>
          <span className="eyebrow">FOR CAR OWNERS</span>
          <h2>Your car. Your terms. Extra opportunity.</h2>
          <p>
            Share your available car with people looking for their next journey.
          </p>
        </div>
        <Link href="/signup" className="button button-light">
          Get started
        </Link>
      </section>

      <footer className="site-footer">
        <Link href="/" className="brand footer-brand">
          <span className="brand-mark">S</span>
          <span>
            sheggar<span className="brand-light"> wheels</span>
          </span>
        </Link>
        <p>Built for journeys in Addis Ababa, Ethiopia.</p>
      </footer>
    </main>
  );
}
