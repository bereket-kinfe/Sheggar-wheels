"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDemoUsers, signInAsDemo, safeReturnPath } from "../../lib/auth";

export default function SignInPage() {
  const router = useRouter(); const [error,setError] = useState(""); const [nextPath,setNextPath] = useState("/");
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(()=>{ const next = new URLSearchParams(window.location.search).get("next"); setNextPath(safeReturnPath(next)); },[]);
  /* eslint-enable react-hooks/set-state-in-effect */
  function signIn(id){ const result=signInAsDemo(id); if(!result.ok){setError(result.error);return;} const roles=result.user.roles||[result.user.role]; const destination=nextPath!=="/"?nextPath:(roles.includes("admin")?"/admin":roles.includes("owner")?"/owner":"/dashboard/bookings"); router.push(safeReturnPath(destination)); }
  return <main className="min-h-screen bg-slate-50 px-5 py-12"><div className="mx-auto max-w-xl rounded-2xl border bg-white p-7 shadow-sm"><Link href="/" className="font-bold">← sheggar wheels</Link><h1 className="mt-6 text-3xl font-bold">Choose a demo account</h1><p className="mt-2 text-slate-600">No password is needed or stored. These fictional accounts are for demonstrating the capstone only.</p>{error&&<p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3">{error}</p>}<div className="mt-6 grid gap-3">{getDemoUsers().map(u=><button key={u.id} onClick={()=>signIn(u.id)} className="rounded-xl border p-4 text-left hover:bg-slate-50"><strong className="block">{u.name}</strong><span className="text-sm text-slate-600">{u.email}</span><span className="mt-1 block text-xs uppercase tracking-wide">{u.roles.join(" + ")}</span></button>)}</div><p className="mt-6 text-sm text-slate-500">For a real product, authentication and authorization must be implemented on a trusted backend.</p><p className="mt-4 text-sm">Need a demo renter account? <Link className="underline" href="/signup">Create one</Link>.</p></div></main>;
}
