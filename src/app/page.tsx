import { connectDb, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

async function dbStatus(): Promise<{ label: string; ok: boolean; hint: string }> {
  if (!isDbConfigured()) return { label: "Nog niet gekoppeld", ok: false, hint: "Zet MONGODB_URI in .env.local om de database te koppelen." };
  try {
    const m = await connectDb();
    await m.connection.db?.admin().ping();
    return { label: `Verbonden met ${m.connection.name}`, ok: true, hint: "De database is bereikbaar." };
  } catch {
    return { label: "Kan database niet bereiken", ok: false, hint: "Controleer de connection string en de IP-toegangslijst in MongoDB Atlas." };
  }
}

export default async function Home() {
  const db = await dbStatus();
  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <header style={{ background: "var(--brand)", color: "var(--brand-ink)", padding: "14px max(16px, 4vw)" }}>
        <b style={{ letterSpacing: ".14em", fontWeight: 800 }}>NEXT<span style={{ color: "#7fd3df" }}>2</span>CARE</b>
        <span style={{ color: "var(--brand-muted)", marginLeft: 10, fontSize: ".85rem" }}>Planning</span>
      </header>
      <section style={{ padding: "48px max(16px, 4vw)", maxWidth: 760 }}>
        <p style={{ textTransform: "uppercase", letterSpacing: ".08em", fontSize: ".75rem", color: "var(--muted)", fontWeight: 600 }}>In opbouw</p>
        <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", lineHeight: 1.1, letterSpacing: "-.03em", margin: "0 0 12px" }}>
          De juiste zorgprofessional op de juiste plek.
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: "60ch" }}>
          Hier komt het planningssysteem van Next2Care: zorginstellingen zetten diensten open, zzp&apos;ers melden zich aan en
          Next2Care keurt goed. De werkende versie staat nu nog als prototype in <code>prototype/</code>.
        </p>
        <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)" }}>
          <strong style={{ color: db.ok ? "var(--good)" : "var(--bad)" }}>Database: {db.label}</strong>
          <div style={{ color: "var(--muted)", fontSize: ".9rem" }}>{db.hint}</div>
        </div>
      </section>
    </main>
  );
}
