"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getDemoUsers,
  safeReturnPath,
  signInAsDemo,
  signInWithPassword,
} from "../../lib/auth";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [nextPath, setNextPath] = useState("/");
  const [submitting, setSubmitting] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    setNextPath(safeReturnPath(next));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function redirectFor(user) {
    const roles = user.roles || [user.role];
    const destination =
      nextPath !== "/"
        ? nextPath
        : roles.includes("admin")
          ? "/admin"
          : roles.includes("owner")
            ? "/owner"
            : "/dashboard/bookings";
    router.push(safeReturnPath(destination));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await signInWithPassword(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    redirectFor(result.user);
  }

  function signInDemo(id) {
    setError("");
    const result = signInAsDemo(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    redirectFor(result.user);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border bg-white p-7 shadow-sm">
        <Link href="/" className="font-bold">
          ← sheggar wheels
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-slate-600">
          Sign in with the email and password you used to create your account.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded border border-red-300 bg-red-50 p-3"
          >
            {error}
          </p>
        )}

        <form className="mt-6 grid gap-4" onSubmit={submit}>
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
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              className="mt-1 block w-full rounded border p-3"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button
            disabled={submitting}
            className="rounded bg-slate-900 p-3 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-7 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          OR USE A DEMO ACCOUNT
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid gap-3">
          {getDemoUsers().map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => signInDemo(user.id)}
              className="rounded-xl border p-4 text-left hover:bg-slate-50"
            >
              <strong className="block">{user.name}</strong>
              <span className="text-sm text-slate-600">{user.email}</span>
              <span className="mt-1 block text-xs uppercase tracking-wide">
                {user.roles.join(" + ")}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm">
          New to Sheggar Wheels?{" "}
          <Link className="underline" href="/signup">
            Create an account
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-slate-500">
          Accounts are saved in this browser for this demo. This is not secure
          authentication for a production service.
        </p>
      </div>
    </main>
  );
}
