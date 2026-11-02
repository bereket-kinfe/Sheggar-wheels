"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAccount, safeReturnPath } from "../../lib/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const result = await registerAccount({ name, email, phone, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    router.push(
      safeReturnPath(next) === "/"
        ? "/dashboard/bookings"
        : safeReturnPath(next),
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border bg-white p-7 shadow-sm">
        <Link href="/" className="font-bold">
          ← sheggar wheels
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-slate-600">
          Create a renter account to book cars. You can sign in again using your
          email and password.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label>
            Name
            <input
              required
              minLength={2}
              autoComplete="name"
              className="mt-1 block w-full rounded border p-3"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              autoComplete="email"
              className="mt-1 block w-full rounded border p-3"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Phone (optional)
            <input
              type="tel"
              autoComplete="tel"
              className="mt-1 block w-full rounded border p-3"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              required
              minLength={8}
              maxLength={128}
              type="password"
              autoComplete="new-password"
              className="mt-1 block w-full rounded border p-3"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label>
            Confirm password
            <input
              required
              minLength={8}
              maxLength={128}
              type="password"
              autoComplete="new-password"
              className="mt-1 block w-full rounded border p-3"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded border border-red-300 bg-red-50 p-3"
            >
              {error}
            </p>
          )}

          <button
            disabled={submitting}
            className="rounded bg-slate-900 p-3 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm">
          Already have an account?{" "}
          <Link className="underline" href="/signin">
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-slate-500">
          Your password hash is stored in this browser only. Browser storage
          does not provide production-grade account security.
        </p>
      </div>
    </main>
  );
}
