'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AssignmentList from '@/components/teacher/AssignmentList';
import SubmissionGrader from '@/components/teacher/SubmissionGrader';
import Icon from '@/components/ui/Icons';
import { teacherService } from '@/services/teacher.service';

export default function TeacherDashboard() {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const [assignments, subjects] = await Promise.all([
          teacherService.getAssignments().catch(() => ({ items: [] })),
          teacherService.getMySubjects().catch(() => []),
        ]);
        if (!cancelled) {
          const items = assignments?.items ?? [];
          setStats({
            assignments: items.length,
            published: items.filter((a) => a.status === 'Published').length,
            drafts: items.filter((a) => a.status !== 'Published').length,
            subjects: Array.isArray(subjects) ? subjects.length : 0,
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
    <DashboardLayout role="Teacher">
      <header className="page-header">
        <h1>
          <span className="header-icon"><Icon name="bookOpen" size={24} /></span>
          Teacher Dashboard
        </h1>
        <p>Manage your assignments and grade student submissions.</p>
      </header>

      {stats && (
        <div className="stats-grid animate-fade-up">
          <div className="glass-panel stat-card card-hover">
            <div className="stat-icon stat-icon-grad-1"><Icon name="clipboard" size={22} /></div>
            <div>
              <div className="stat-value">{stats.assignments}</div>
              <div className="stat-label">Total Assignments</div>
            </div>
          </div>
          <div className="glass-panel stat-card card-hover">
            <div className="stat-icon stat-icon-grad-4"><Icon name="send" size={22} /></div>
            <div>
              <div className="stat-value">{stats.published}</div>
              <div className="stat-label">Published</div>
            </div>
          </div>
          <div className="glass-panel stat-card card-hover">
            <div className="stat-icon stat-icon-grad-3"><Icon name="edit" size={22} /></div>
            <div>
              <div className="stat-value">{stats.drafts}</div>
              <div className="stat-label">Drafts</div>
            </div>
          </div>
          <div className="glass-panel stat-card card-hover">
            <div className="stat-icon stat-icon-grad-2"><Icon name="bookOpen" size={22} /></div>
            <div>
              <div className="stat-value">{stats.subjects}</div>
              <div className="stat-label">My Subjects</div>
            </div>
          </div>
        </div>
      )}

      <div className="animate-fade-in" key={selectedAssignment?.id || 'list'}>
        {selectedAssignment ? (
          <SubmissionGrader
            assignment={selectedAssignment}
            onBack={() => setSelectedAssignment(null)}
          />
        ) : (
          <AssignmentList
            onSelectAssignment={(assignment) => setSelectedAssignment(assignment)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
