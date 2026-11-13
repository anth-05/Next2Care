import { NextResponse } from "next/server";
import { connectDb, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/health — shows whether the app can reach MongoDB. */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: true, db: "niet_ingesteld" });
  }
  try {
    const m = await connectDb();
    await m.connection.db?.admin().ping();
    return NextResponse.json({ ok: true, db: "verbonden", database: m.connection.name });
  } catch (err) {
    console.error("MongoDB health check failed", err);
    return NextResponse.json({ ok: false, db: "fout", message: "Kan MongoDB niet bereiken. Controleer MONGODB_URI en het IP-toegangslijstje in Atlas." }, { status: 503 });
  }
}
