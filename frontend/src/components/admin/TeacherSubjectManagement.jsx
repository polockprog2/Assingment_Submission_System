'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/admin.service';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/ui/Icons';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';

export default function TeacherSubjectManagement() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(() => {
    Promise.all([
      adminService.listTeacherSubjectAssignments(),
      adminService.getUsers(),
      adminService.getSubjects()
    ])
      .then(([tsaRes, userRes, subRes]) => {
        setAssignments(tsaRes.items);
        setTeachers(userRes.items.filter(u => u.role === 'Teacher'));
        setSubjects(subRes.items);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!teacherId || !subjectId) return;

    try {
      setCreating(true);
      await adminService.assignSubjectToTeacher({
        teacherId: parseInt(teacherId, 10),
        subjectId: parseInt(subjectId, 10)
      });
      setTeacherId('');
      setSubjectId('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to assign subject to teacher');
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Are you sure you want to remove this teacher-subject assignment?')) return;
    try {
      await adminService.removeTeacherSubjectAssignment(id);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to remove assignment');
    }
  };

  if (loading && assignments.length === 0) {
    return <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />;
  }

  return (
    <Card icon="clipboard" title="Manage Teacher-Subject Assignments" subtitle="Link teachers to the subjects they teach" padding="2rem">
      <Alert type="error" message={error} />

      <form onSubmit={handleAssign} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
        <Input
          label="Teacher"
          type="select"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          required
          options={[{ value: '', label: 'Select a teacher' }, ...teachers.map(t => ({ value: t.id, label: `${t.email} (ID: ${t.id})` }))]}
        />
        <Input
          label="Subject"
          type="select"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          required
          options={[{ value: '', label: 'Select a subject' }, ...subjects.map(s => ({ value: s.id, label: `${s.name} (ID: ${s.id})` }))]}
        />
        <Button type="submit" loading={creating} disabled={teachers.length === 0 || subjects.length === 0} style={{ height: '44px' }}>
          Assign Subject
        </Button>
      </form>

      <Table>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Teacher</Th>
            <Th>Subject</Th>
            <Th style={{ textAlign: 'right' }}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {assignments.length === 0 ? (
            <Tr><Td colSpan="4">
              <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                <Icon name="clipboard" size={44} />
                <strong>No assignments yet</strong>
                <span>Link a teacher to a subject using the form above.</span>
              </div>
            </Td></Tr>
          ) : (
            assignments.map((item) => (
              <Tr key={item.id}>
                <Td>{item.id}</Td>
                <Td style={{ fontWeight: 500 }}>{item.teacher ? item.teacher.email : `ID: ${item.teacherId}`}</Td>
                <Td>{item.subject ? item.subject.name : `ID: ${item.subjectId}`}</Td>
                <Td style={{ textAlign: 'right' }}>
                  <Button variant="danger" onClick={() => handleRemove(item.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                    Remove
                  </Button>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </Card>
  );
}
