'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagement from '@/components/admin/UserManagement';
import ClassManagement from '@/components/admin/ClassManagement';
import SubjectManagement from '@/components/admin/SubjectManagement';
import TeacherSubjectManagement from '@/components/admin/TeacherSubjectManagement';
import Icon from '@/components/ui/Icons';
import { adminService } from '@/services/admin.service';

const TABS = [
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'classes', label: 'Classes', icon: 'school' },
  { key: 'subjects', label: 'Subjects', icon: 'bookOpen' },
  { key: 'teachers', label: 'Teachers & Subjects', icon: 'clipboard' },
];

const STATS = [
  { key: 'users', label: 'Total Users', icon: 'users', grad: 'stat-icon-grad-1' },
  { key: 'classes', label: 'Classes', icon: 'school', grad: 'stat-icon-grad-2' },
  { key: 'subjects', label: 'Subjects', icon: 'bookOpen', grad: 'stat-icon-grad-3' },
  { key: 'assignments', label: 'Teacher Assignments', icon: 'clipboard', grad: 'stat-icon-grad-4' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const [users, classes, subjects, teacherAssignments] = await Promise.all([
          adminService.getUsers().catch(() => ({ items: [] })),
          adminService.getClasses().catch(() => ({ items: [] })),
          adminService.getSubjects().catch(() => ({ items: [] })),
          adminService.listTeacherSubjectAssignments().catch(() => ({ items: [] })),
        ]);
        if (!cancelled) {
          setStats({
            users: users?.items?.length ?? 0,
            classes: classes?.items?.length ?? 0,
            subjects: subjects?.items?.length ?? 0,
            assignments: teacherAssignments?.items?.length ?? 0,
          });
        }
      } catch {
        if (!cancelled) setStats(null);
      }
    };
    loadStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardLayout role="Admin">
      <header className="page-header">
        <h1>
          <span className="header-icon"><Icon name="shield" size={24} /></span>
          Admin Dashboard
        </h1>
        <p>Manage users, classes, and subjects across the institution.</p>
      </header>

      {stats && (
        <div className="stats-grid animate-fade-up">
          {STATS.map((s) => (
            <div className="glass-panel stat-card card-hover" key={s.key}>
              <div className={`stat-icon ${s.grad}`}>
                <Icon name={s.icon} size={22} />
              </div>
              <div>
                <div className="stat-value">{stats[s.key]}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Icon name={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in" key={activeTab}>
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'classes' && <ClassManagement />}
        {activeTab === 'subjects' && <SubjectManagement />}
        {activeTab === 'teachers' && <TeacherSubjectManagement />}
      </div>
    </DashboardLayout>
  );
}
