import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-12">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 px-8 py-14 text-emerald-50 shadow-lg">
        <p className="text-sm font-medium uppercase tracking-wider text-amber-300/90">
          Rwanda · Digital marketplace
        </p>
        <h1 className="mt-3 max-w-xl text-4xl font-bold leading-tight tracking-tight">
          Agribridge
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-emerald-100/95">
          Connect farmers with farmers and buyers. List produce, see bulk supply
          by area, browse market prices, and send purchase requests — all in one
          prototype.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/marketplace"
            className="rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-emerald-950 shadow hover:bg-amber-300"
          >
            Browse marketplace
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-emerald-300/50 px-5 py-2.5 font-medium text-emerald-50 hover:bg-emerald-900/40"
          >
            Create account
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-emerald-900">Farmers</h2>
          <p className="mt-2 text-sm text-stone-600">
            Add products with quantity, price, and location. View listings you
            posted and incoming buyer requests.
          </p>
          <Link
            href="/dashboard/farmer"
            className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            Farmer dashboard →
          </Link>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-emerald-900">Buyers</h2>
          <p className="mt-2 text-sm text-stone-600">
            Filter by product type and location, request bulk purchases, and
            track your requests.
          </p>
          <Link
            href="/dashboard/buyer"
            className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            Buyer dashboard →
          </Link>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-emerald-900">Market insight</h2>
          <p className="mt-2 text-sm text-stone-600">
            Sample regional prices and combined supply (“bulk”) for the same
            product in an area.
          </p>
          <div className="mt-3 flex flex-col gap-1 text-sm font-medium text-emerald-700">
            <Link href="/prices" className="hover:underline">
              Market prices →
            </Link>
            <Link href="/bulk" className="hover:underline">
              Bulk by area →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
