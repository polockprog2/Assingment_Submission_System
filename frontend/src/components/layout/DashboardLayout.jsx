'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icons';

const ROLE_AVATAR = {
  Admin: 'avatar-amber',
  Teacher: 'avatar-violet',
  Student: 'avatar-cyan',
};

const ROLE_ICON = {
  Admin: 'shield',
  Teacher: 'bookOpen',
  Student: 'book',
};

export default function DashboardLayout({ children, role }) {
  const [user] = useState(() => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== role) {
      router.push(`/${user.role.toLowerCase()}`);
      return;
    }
  }, [user, role, router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)' }}>
        <div className="spinner" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const rolePath = `/${role.toLowerCase()}`;
  const avatarClass = ROLE_AVATAR[role] || 'avatar-gradient';

  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        <div className="brand-logo">E</div>
        <div>
          <div className="brand-name">EduManage</div>
          <span className="brand-role">{role} Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        <Link href={rolePath} className={`nav-link ${pathname === rolePath ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
          <Icon name="dashboard" size={18} />
          Dashboard
          <span className="nav-badge">Live</span>
        </Link>

        <div className="nav-section-label" style={{ marginTop: '0.75rem' }}>Workspace</div>
        <Link
          href={rolePath}
          className={`nav-link ${pathname === rolePath ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
          title="Your assignments"
        >
          <Icon name={ROLE_ICON[role]} size={18} />
          Assignments
        </Link>
      </nav>

      <div style={{ padding: '0.75rem 1.5rem 1rem' }}>
        <div
          style={{
            padding: '1rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(0,173,181,0.3), rgba(238,238,238,0.06))',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          <Icon name="sparkles" size={18} style={{ color: 'var(--primary-color)' }} />
          <span style={{ fontSize: '0.8rem', color: '#e8edf2', fontWeight: 600, lineHeight: 1.35 }}>
            Keep up the momentum — every task you finish brings you closer to your goals.
          </span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className={`avatar ${avatarClass}`}>{user.name.charAt(0).toUpperCase()}</div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {user.name}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(183,190,200,0.8)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {user.email}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.06)',
            color: '#aab2d0',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
        >
          <Icon name="logout" size={16} />
        </button>
      </div>
    </>
  );

  return (
    <>
      {sidebarOpen && <div className="drawer-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {sidebarContent}
      </aside>

      <div className="layout-main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={20} />
          </button>

          <div className="topbar-greeting">
            <small>{today}</small>
            <strong>{greeting}, {user.name.split(' ')[0]}!</strong>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-pill">
              {role}
            </span>
            <div className={`avatar ${avatarClass}`} style={{ width: 38, height: 38, fontSize: '0.9rem', borderRadius: 11 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="page-content animate-fade-up">
          <div className="container" style={{ padding: 0 }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
