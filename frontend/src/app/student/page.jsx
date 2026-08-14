'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AssignmentSubmission from '@/components/student/AssignmentSubmission';
import Icon from '@/components/ui/Icons';
import { studentService } from '@/services/student.service';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const [assignments, submissions] = await Promise.all([
          studentService.getAssignments().catch(() => ({ items: [] })),
          studentService.getMySubmissions().catch(() => []),
        ]);
        if (!cancelled) {
          const subs = Array.isArray(submissions) ? submissions : [];
          const assigned = assignments?.items?.length ?? 0;
          const submitted = subs.filter((s) => s.submissionStatus).length;
          const graded = subs.filter((s) => s.gradingStatus === 'Graded').length;
          setStats({
            assigned,
            submitted,
            pending: assigned - submitted,
            graded,
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
    <DashboardLayout role="Student">
      <header className="page-header">
        <h1>
          <span className="header-icon"><Icon name="book" size={24} /></span>
          Student Dashboard
        </h1>
        <p>View assignments, submit your work, and check your grades.</p>
      </header>

      {stats && (
        <div className="stats-grid animate-fade-up">
          <div className="glass-panel stat-card card-hover">
            <div className="stat-icon stat-icon-grad-2"><Icon name="clipboard" size={22} /></div>
            <div>
              <div className="stat-value">{stats.assigned}</div>
              <div className="stat-label">Assigned</div>
            </div>
          </div>
          <div className="glass-panel stat-card card-hover">
            <div className="stat-icon stat-icon-grad-4"><Icon name="send" size={22} /></div>
            <div>
              <div className="stat-value">{stats.submitted}</div>
              <div className="stat-label">Submitted</div>
            </div>
          </div>
          <div className="glass-panel stat-card card-hover">
            <div className="stat-icon stat-icon-grad-3"><Icon name="clock" size={22} /></div>
            <div>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="glass-panel stat-card card-hover">
            <div className="stat-icon stat-icon-grad-1"><Icon name="grade" size={22} /></div>
            <div>
              <div className="stat-value">{stats.graded}</div>
              <div className="stat-label">Graded</div>
            </div>
          </div>
        </div>
      )}

      <div className="animate-fade-in">
        <AssignmentSubmission />
      </div>
    </DashboardLayout>
  );
}
