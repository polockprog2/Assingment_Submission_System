'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/ui/Icons';

const STEPS = [
  { icon: 'mail', title: 'Join your class', desc: 'Register with your email and your teacher-provided Class ID.' },
  { icon: 'bookOpen', title: 'See assignments', desc: 'Published assignments for your class appear instantly.' },
  { icon: 'checkCircle', title: 'Submit & get graded', desc: 'Submit answers, attach files and track your grades.' },
];

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.register(email, password, parseInt(classId, 10));
      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="brand-logo" style={{ width: 48, height: 48, borderRadius: 15 }}>E</div>
            <div>
              <div className="brand-name" style={{ fontSize: '1.5rem' }}>EduManage</div>
              <span className="brand-role">Student Registration</span>
            </div>
          </div>

          <div style={{ marginTop: '3.5rem' }}>
            <h1 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#fff', lineHeight: 1.15, maxWidth: '26rem' }}>
              Begin your <span className="gradient-text">journey</span> in three simple steps.
            </h1>
            <div style={{ marginTop: '2rem', display: 'grid', gap: '0.75rem', maxWidth: '28rem' }}>
              {STEPS.map((s, i) => (
                <div className="auth-feature animate-fade-up" key={s.title} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', width: '100%' }}>
                    <Icon name={s.icon} size={22} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                        {i + 1}. {s.title}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'rgba(232,237,242,0.7)' }}>{s.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: '0.8rem', color: 'rgba(232,237,242,0.5)' }}>
          © {new Date().getFullYear()} EduManage — Assignment Management System
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="glass-panel auth-card animate-scale-in">
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <div className="avatar avatar-gradient" style={{ width: 56, height: 56, borderRadius: 17, margin: '0 auto 1rem', fontSize: 0 }}>
              <Icon name="book" size={26} />
            </div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800 }}>Create account</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              Join your class and start submitting
            </p>
          </div>

          <Alert type="error" message={error} />
          <Alert type="success" message={success} />

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. new.student@example.com"
              required
              icon="mail"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter strong password"
              required
              icon="lock"
            />
            <Input
              label="Class ID"
              type="number"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              placeholder="e.g. 1"
              required
              min="1"
              icon="school"
              helperText="Ask your teacher for your Class ID."
            />
            <Button type="submit" loading={loading} className="btn-gradient" style={{ marginTop: '0.35rem', padding: '0.8rem' }}>
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
            <Link href="/login" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
