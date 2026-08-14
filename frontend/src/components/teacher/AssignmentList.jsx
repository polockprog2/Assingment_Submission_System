'use client';

import { useState, useEffect, useCallback } from 'react';
import { teacherService } from '@/services/teacher.service';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icons';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';

export default function AssignmentList({ onSelectAssignment }) {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(() => {
    Promise.all([
      teacherService.getAssignments(),
      teacherService.getMySubjects()
    ])
      .then(([assignRes, subjRes]) => {
        setAssignments(assignRes.items);
        setSubjects(subjRes);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch assignments');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const classes = [];
  const classMap = new Map();
  subjects.forEach(s => {
    if (s.class) classMap.set(s.class.id, s.class);
  });
  classMap.forEach(c => classes.push(c));

  const filteredSubjects = subjects.filter(s =>
    s.class && String(s.class.id) === String(classId)
  );

  const handleClassChange = (e) => {
    setClassId(e.target.value);
    setSubjectId('');
  };

  const handleSubjectChange = (e) => {
    setSubjectId(e.target.value);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError('');
      await teacherService.createAssignment({
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        maxMarks: parseInt(maxMarks),
        subjectId: parseInt(subjectId)
      });
      setTitle('');
      setDescription('');
      setDeadline('');
      setMaxMarks(100);
      setClassId('');
      setSubjectId('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await teacherService.publishAssignment(id);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to publish assignment');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await teacherService.deleteAssignment(id);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete assignment');
    }
  };

  if (loading && assignments.length === 0) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <Card icon="plus" title="Create New Assignment" subtitle="Publish a new assignment for your class" padding="2rem">
        <Alert type="error" message={error} />

        {subjects.length === 0 ? (
          <div className="empty-state">
            <Icon name="bookOpen" size={44} />
            <strong>No subjects assigned yet</strong>
            <span>Ask an admin to assign you to a subject before creating assignments.</span>
          </div>
        ) : (
          <form onSubmit={handleCreateAssignment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                label="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Assignment Title"
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Input
                type="textarea"
                label="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detailed description..."
                required
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
            <Input
              type="datetime-local"
              label="Deadline"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              required
            />
            <Input
              type="number"
              label="Max Marks"
              value={maxMarks}
              onChange={e => setMaxMarks(e.target.value)}
              required
              min="1"
            />
            <Input
              type="select"
              label="Class"
              value={classId}
              onChange={handleClassChange}
              required
              options={[{ value: '', label: 'Select a class' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
            />
            <Input
              type="select"
              label="Subject"
              value={subjectId}
              onChange={handleSubjectChange}
              required
              disabled={!classId}
              options={[{ value: '', label: classId ? 'Select a subject' : 'Select a class first' }, ...filteredSubjects.map(s => ({ value: s.id, label: s.name }))]}
            />
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <Button type="submit" loading={creating} disabled={!classId || !subjectId}>
                Create Assignment
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card icon="clipboard" title="Your Assignments" subtitle="Track, publish and review your assignments" padding="2rem">
        <Table>
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Subject</Th>
              <Th>Class</Th>
              <Th>Deadline</Th>
              <Th>Status</Th>
              <Th style={{ textAlign: 'right' }}>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {assignments.length === 0 ? (
              <Tr><Td colSpan="6">
                <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                  <Icon name="clipboard" size={44} />
                  <strong>No assignments created yet</strong>
                  <span>Use the form above to create your first assignment.</span>
                </div>
              </Td></Tr>
            ) : (
              assignments.map((assignment) => {
                const subj = subjects.find(x => x.id === assignment.subjectId);
                return (
                  <Tr key={assignment.id}>
                    <Td style={{ fontWeight: 500 }}>
                      {assignment.title}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 400 }}>Max Marks: {assignment.maxMarks}</div>
                    </Td>
                    <Td>{subj ? subj.name : `Subject #${assignment.subjectId}`}</Td>
                    <Td>{subj && subj.class ? subj.class.name : '-'}</Td>
                    <Td>{new Date(assignment.deadline).toLocaleString()}</Td>
                    <Td>
                      <Badge type={assignment.status === 'Published' ? 'success' : 'warning'}>
                        {assignment.status}
                      </Badge>
                    </Td>
                    <Td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {assignment.status === 'Draft' && (
                          <Button variant="secondary" onClick={() => handlePublish(assignment.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                            Publish
                          </Button>
                        )}
                        <Button variant="primary" onClick={() => onSelectAssignment(assignment)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                          Submissions
                        </Button>
                        <Button variant="danger" onClick={() => handleDelete(assignment.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                          Delete
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
