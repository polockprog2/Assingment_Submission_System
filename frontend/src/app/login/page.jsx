'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/ui/Icons';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@example.com', password: 'AdminPass1!' },
  { role: 'Teacher', email: 'teacher@example.com', password: 'TeacherPass1!' },
  { role: 'Student', email: 'student@example.com', password: 'StudentPass1!' },
];

const FEATURES = [
  { icon: 'clipboard', title: 'Streamlined Assignments', desc: 'Create, publish and track assignments in a single glance.' },
  { icon: 'checkCircle', title: 'Frictionless Grading', desc: 'Grade submissions with rich feedback and clear mark breakdowns.' },
  { icon: 'shield', title: 'Role-Based Portals', desc: 'Dedicated, secure workspaces for admins, teachers and students.' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authService.login(email, password);
      if (!user) throw new Error('No user data received from server');

      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'Admin') router.push('/admin');
      else if (user.role === 'Teacher') router.push('/teacher');
      else if (user.role === 'Student') router.push('/student');
      else throw new Error(`Unknown role: ${user.role}`);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="auth-shell">
      {/* ── Brand / feature panel ── */}
      <div className="auth-panel">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="brand-logo" style={{ width: 48, height: 48, borderRadius: 15 }}>E</div>
            <div>
              <div className="brand-name" style={{ fontSize: '1.5rem' }}>EduManage</div>
              <span className="brand-role">Assignment &amp; Submission Management</span>
            </div>
          </div>

          <div style={{ marginTop: '3.5rem' }}>
            <h1 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#fff', lineHeight: 1.15, maxWidth: '26rem' }}>
              Where learning meets <span className="gradient-text">effortless</span> management.
            </h1>
            <p style={{ marginTop: '1rem', color: 'rgba(232,237,242,0.75)', maxWidth: '28rem', lineHeight: 1.6 }}>
              One central hub for teachers, students and admins to create, submit and grade work — beautifully.
            </p>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'grid', gap: '0.75rem', maxWidth: '28rem' }}>
            {FEATURES.map((f) => (
              <div className="auth-feature animate-fade-up" key={f.title}>
                <Icon name={f.icon} size={22} />
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{f.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(232,237,242,0.7)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: '0.8rem', color: 'rgba(232,237,242,0.5)' }}>
          © {new Date().getFullYear()} EduManage — Assignment Management System
        </div>
      </div>

      {/* ── Form panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
        <div className="glass-panel auth-card animate-scale-in">
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <div className="avatar avatar-gradient" style={{ width: 56, height: 56, borderRadius: 17, margin: '0 auto 1rem', fontSize: 0 }}>
              <Icon name="shield" size={26} />
            </div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800 }}>Welcome back</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              Sign in to access your portal
            </p>
          </div>

          <Alert type="error" message={error} />

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@example.com"
              required
              icon="mail"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              icon="lock"
            />
            <Button type="submit" loading={loading} className="btn-gradient" style={{ marginTop: '0.35rem', padding: '0.8rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Don&apos;t have an account? </span>
            <Link href="/register" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
              Register as Student
            </Link>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
                Quick demo access
              </span>
              <span style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            </div>
            <div className="demo-accounts">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  type="button"
                  key={acc.role}
                  className="demo-account"
                  onClick={() => fillDemo(acc)}
                  title={`Use ${acc.role} demo account`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                    <span className="role-tag">{acc.role}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {acc.email}
                    </span>
                  </span>
                  <Icon name="arrowRight" size={15} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
