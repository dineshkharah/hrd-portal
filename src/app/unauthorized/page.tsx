import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#180F04] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-[#D4A017] text-xs uppercase tracking-widest mb-3 font-['Geist']">
          403 — Forbidden
        </p>
        <h1 className="font-['Fraunces'] text-4xl font-semibold text-[#FBF7EE] mb-4">
          Access Denied
        </h1>
        <p className="font-['Geist'] text-[#FBF7EE]/60 text-sm mb-8">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          href="/"
          className="inline-block text-sm font-medium bg-[#D4A017] text-[#180F04] px-6 py-2.5 rounded-md hover:bg-[#b8860b] transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
