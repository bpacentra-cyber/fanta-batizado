"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function RoleBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
      {children}
    </span>
  );
}

function TopLeftNav() {
  const [hasSession, setHasSession] = useState(false);
  const [canScore, setCanScore] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isFounder, setIsFounder] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!mounted) return;

      setHasSession(!!user);

      if (!user) {
        setCanScore(false);
        setIsAdmin(false);
        setIsFounder(false);
        return;
      }

      const { data: p } = await supabase
        .from("profiles")
        .select("is_admin, is_founder")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      const admin = !!p?.is_admin;
      const founder = !!p?.is_founder;

      setIsAdmin(admin);
      setIsFounder(founder);
      setCanScore(admin || founder);
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="fixed left-4 top-4 z-50 flex flex-col gap-2">
      {/* Riga bottoni */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 backdrop-blur"
        >
          🏠 Home
        </Link>

        <Link
          href="/regolamento"
          className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 backdrop-blur"
        >
          📜 Regolamento
        </Link>

        <Link
          href={hasSession ? "/profile" : "/login"}
          className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 backdrop-blur"
          title={hasSession ? "Vai al profilo" : "Vai al login"}
        >
          👤 Profilo
        </Link>

        {canScore ? (
          <Link
            href="/admin/punteggi"
            className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 backdrop-blur"
            title="Assegna azioni ai partecipanti"
          >
            🎯 Punteggi
          </Link>
        ) : null}
      </div>

      {/* Riga badge (sotto i bottoni) */}
      {(isAdmin || isFounder) && (
        <div className="flex flex-wrap gap-2">
          {isAdmin ? <RoleBadge>👑 Admin Supremo</RoleBadge> : null}
          {!isAdmin && isFounder ? <RoleBadge>🫡 Founder</RoleBadge> : null}
        </div>
      )}
    </div>
  );
}

function StatMini({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/30 p-4 backdrop-blur">
      <div className="text-white/60 text-xs">{label}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
      <div className="mt-1 text-white/65 text-sm">{sub}</div>
    </div>
  );
}

function Tile({
  href,
  icon,
  title,
  note,
}: {
  href: string;
  icon: string;
  title: string;
  note: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[22px] border border-white/10 bg-white/[0.06] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur transition hover:bg-white/[0.10]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-lg">
          {icon}
        </div>
        <div className="ml-auto text-white/35 text-sm group-hover:text-white/55">
          →
        </div>
      </div>

      <div className="mt-3">
        <div className="text-base font-extrabold tracking-tight">{title}</div>
        <div className="mt-1 text-sm text-white/65 leading-snug">{note}</div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null);

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    setUser(data.user);
  });
}, []);

if (user === null) return null;

if (!user) {
  window.location.href = "/login";
  return null;
}

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <TopLeftNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.15),rgba(0,0,0,0.78)_70%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-neutral-950" />
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-44 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-60" />
          <div className="absolute -bottom-60 right-[-140px] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl opacity-60" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-6 pt-16 pb-10">
          <h1 className="mt-5 flex items-center gap-4 text-5xl sm:text-6xl font-extrabold tracking-tight">
            <span className="text-6xl sm:text-7xl drop-shadow-[0_0_18px_rgba(255,255,255,0.25)]">
              🪘
            </span>
            Fanta Batizado 🇮🇹🇧🇷
          </h1>

          <p className="mt-4 max-w-2xl text-white/75 leading-relaxed text-base sm:text-lg">
            Il gioco che nessuno aveva chiesto
            <br />
            ma che ora nessuno potrà più ignorare.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
            <StatMini label="Budget" value="500 Dbr" sub="per squadra" />
            <StatMini label="Squadra" value="1–6" sub="membri" />
            <StatMini label="Obiettivo" value="+Punti" sub="bonus & malus" />
          </div>
        </div>
      </section>

      {/* TILES */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-14">
        <div className="grid grid-cols-2 gap-3 max-w-3xl">
          <Tile href="/mercato" icon="🪙" title="Mercato" note="Crea la tua squadra" />
          <Tile href="/squadre" icon="👥" title="Squadre" note="Vedi gli altri team" />
          <Tile href="/azioni" icon="⚡" title="Azioni" note="Bonus / malus" />
          <Tile href="/classifica" icon="🏆" title="Classifica" note="Podio finale" />
        </div>

        <div className="mt-8 flex items-center justify-between text-xs text-white/45">
          <span>© Fanta Batizado</span>
          <span>App by Instrutor Frodo</span>
        </div>
      </section>
    </main>
  );
}
