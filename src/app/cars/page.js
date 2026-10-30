"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import cars from "../car-details.json";

function formatPrice(price) {
  return new Intl.NumberFormat("en-US").format(price);
}

export default function CarsPage() {
  const [search, setSearch] = useState("");
  const [transmission, setTransmission] = useState("All");
  const [maxPrice, setMaxPrice] = useState("All");
  const [sort, setSort] = useState("recommended");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filteredCars = useMemo(() => {
    let results = cars.filter((car) => {
      const matchesSearch =
        car.name.toLowerCase().includes(search.toLowerCase()) ||
        car.location.toLowerCase().includes(search.toLowerCase());

      const matchesTransmission =
        transmission === "All" || car.transmission === transmission;

      const matchesPrice = maxPrice === "All" || car.price <= Number(maxPrice);

      return matchesSearch && matchesTransmission && matchesPrice;
    });

    if (sort === "price-low") {
      results.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      results.sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      results.sort((a, b) => b.year - a.year);
    }

    return results;
  }, [search, transmission, maxPrice, sort]);
  const pageCount = Math.max(1, Math.ceil(filteredCars.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageCars = filteredCars.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="catalogue">
      <header className="catalogue-header">
        <Link href="/" className="catalogue-logo">
          SHEGGAR<span>WHEELS</span>
        </Link>

        <nav>
          <Link href="/">Home</Link>
          <Link href="/cars" className="active-link">
            Browse Cars
          </Link>
          <Link href="/signin">Sign in</Link>
        </nav>
      </header>

      <section className="catalogue-intro">
        <p className="eyebrow">FIND YOUR NEXT RIDE</p>
        <h1>Cars for every journey.</h1>
        <p>Discover cars available to rent from owners across Addis Ababa.</p>
      </section>

      <section className="catalogue-content">
        <div className="catalogue-toolbar">
          <label className="search-field">
            <span>Search by car or location</span>
            <input
              type="search"
              placeholder="e.g. Toyota, Bole..."
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            />
          </label>

          <label>
            <span>Transmission</span>
            <select
              value={transmission}
              onChange={(event) => { setTransmission(event.target.value); setPage(1); }}
            >
              <option value="All">All types</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </label>

          <label>
            <span>Maximum daily price</span>
            <select
              value={maxPrice}
              onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }}
            >
              <option value="All">Any price</option>
              <option value="2000">ETB 2,000</option>
              <option value="3000">ETB 3,000</option>
              <option value="4000">ETB 4,000</option>
              <option value="5000">ETB 5,000</option>
            </select>
          </label>

          <label>
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(event) => { setSort(event.target.value); setPage(1); }}
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="newest">Newest year</option>
            </select>
          </label>
        </div>

        <div className="catalogue-results-heading">
          <h2>Available cars</h2>
          <p>{filteredCars.length} cars found</p>
        </div>

        {filteredCars.length > 0 ? (
          <div className="catalogue-grid">
            {pageCars.map((car) => (
              <article className="catalogue-card" key={car.id}>
                <div className="catalogue-image-wrap">
                  <Image src={car.image} alt={car.name} width={1200} height={800} />
                  <span className="car-year">{car.year}</span>
                </div>

                <div className="catalogue-card-body">
                  <p className="car-location">{car.location}</p>
                  <h3>{car.name}</h3>

                  <div className="car-specs">
                    <span>{car.transmission}</span>
                    <span>{car.seats} seats</span>
                    <span>{car.fuel}</span>
                  </div>

                  <div className="car-card-bottom">
                    <p className="car-price">
                      ETB {formatPrice(car.price)}
                      <span> / day</span>
                    </p>
                    <Link href={`/cars/${car.id}`} className="view-car-button">
                      View car
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-results">
            <h3>No cars match your search</h3>
            <p>Try another location or change your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setTransmission("All");
                setMaxPrice("All");
                setSort("recommended");
                setPage(1);
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        {filteredCars.length > pageSize && (
          <nav aria-label="Catalogue pages" className="mt-6 flex items-center justify-center gap-4">
            <button className="rounded border bg-white px-4 py-2 disabled:opacity-50" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
            <span aria-live="polite">Page {currentPage} of {pageCount}</span>
            <button className="rounded border bg-white px-4 py-2 disabled:opacity-50" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button>
          </nav>
        )}
      </section>

      <footer className="catalogue-footer">
        <Link href="/">SHEGGAR WHEELS</Link>
        <p>Find a car. Make the journey yours.</p>
      </footer>
    </main>
  );
}

