import Link from 'next/link';

export const metadata = {
  title: 'EduManage',
};

export default function Home() {
  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background:
          'radial-gradient(48rem 32rem at 12% -8%, rgba(0,173,181,0.07) 0, transparent 60%), radial-gradient(42rem 30rem at 105% 12%, rgba(34,40,49,0.05) 0, transparent 60%)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 560, width: '100%' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '2.5rem' }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--primary-grad)',
              color: '#fff',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: '0.95rem',
              boxShadow: 'var(--shadow-primary)',
            }}
          >
            E
          </span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-color)' }}>
            EduManage
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.25rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: '1.1rem' }}>
          Assignments, submissions &amp; grades —<br />
          in one <span className="gradient-text">calm</span> place.
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: '26rem', margin: '0 auto 2.25rem' }}>
          A quiet, focused workspace for teachers, students and admins to create, submit and review work.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/login" className="btn btn-primary btn-lg" style={{ width: '100%', maxWidth: 320 }}>
            Sign In
          </Link>
          <Link href="/register" className="btn btn-secondary btn-lg" style={{ width: '100%', maxWidth: 320 }}>
            Create Student Account
          </Link>
        </div>

        {/* Portal links */}
        <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-faint)' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, fontSize: '0.7rem' }}>Portals</span>
          {['Admin', 'Teacher', 'Student'].map((role) => (
            <Link
              key={role}
              href="/login"
              style={{ fontWeight: 600, color: 'var(--text-muted)', transition: 'color 0.2s ease' }}
            >
              {role}
            </Link>
          ))}
        </div>
      </div>

      <footer style={{ position: 'absolute', bottom: '1.5rem', left: 0, right: 0, textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-faint)' }}>
        © {new Date().getFullYear()} EduManage
      </footer>
    </main>
  );
}
