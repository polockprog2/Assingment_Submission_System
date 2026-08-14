'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/admin.service';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/ui/Icons';
import Modal from '@/components/ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingSubject, setEditingSubject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSubjects = useCallback(() => {
    Promise.all([
      adminService.getSubjects(),
      adminService.getClasses()
    ])
      .then(([subsRes, clsRes]) => {
        setSubjects(subsRes.items);
        setClasses(clsRes.items);
        if (clsRes.items.length > 0) setSelectedClassId(clsRes.items[0].id.toString());
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch subjects');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !selectedClassId) return;

    try {
      setCreating(true);
      setError('');
      setSuccess('');
      await adminService.createSubject({ name: newSubjectName, classId: parseInt(selectedClassId) });
      setNewSubjectName('');
      setSuccess('Subject created successfully.');
      fetchSubjects();
    } catch (err) {
      setError(err.message || 'Failed to create subject');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (sub) => {
    setEditingSubject(sub);
    setEditName(sub.name);
    setEditClassId(sub.classId ? String(sub.classId) : '');
    setError('');
    setSuccess('');
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    if (!editingSubject) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await adminService.updateSubject(editingSubject.id, {
        name: editName,
        classId: parseInt(editClassId)
      });
      setEditingSubject(null);
      setSuccess('Subject updated successfully.');
      fetchSubjects();
    } catch (err) {
      setError(err.message || 'Failed to update subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await adminService.deleteSubject(id);
      setSuccess('Subject deleted successfully.');
      fetchSubjects();
    } catch (err) {
      setError(err.message || 'Failed to delete subject');
    }
  };

  if (loading && subjects.length === 0) {
    return <div className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />;
  }

  return (
    <Card icon="bookOpen" title="Manage Subjects" subtitle="Add, edit and assign subjects to classes" padding="2rem">
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form onSubmit={handleCreateSubject} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <Input
          label="New Subject Name"
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          placeholder="e.g. Mathematics"
          required
          style={{ flex: '1 1 200px' }}
        />
        <Input
          label="Class"
          type="select"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          required
          style={{ flex: '0 1 200px' }}
          options={classes.map(cls => ({ value: cls.id, label: cls.name }))}
        />
        <Button type="submit" loading={creating} disabled={classes.length === 0} style={{ height: '44px' }}>
          Add Subject
        </Button>
      </form>

      <Table>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Subject Name</Th>
            <Th>Class</Th>
            <Th style={{ textAlign: 'right' }}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {subjects.length === 0 ? (
            <Tr><Td colSpan="4">
              <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                <Icon name="bookOpen" size={44} />
                <strong>No subjects found</strong>
                <span>Add your first subject using the form above.</span>
              </div>
            </Td></Tr>
          ) : (
            subjects.map((sub) => {
              const cls = classes.find(c => c.id === sub.classId);
              return (
                <Tr key={sub.id}>
                  <Td>{sub.id}</Td>
                  <Td style={{ fontWeight: 500 }}>{sub.name}</Td>
                  <Td>{cls ? cls.name : `Class ID: ${sub.classId}`}</Td>
                  <Td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Button variant="secondary" onClick={() => openEdit(sub)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => handleDeleteSubject(sub.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
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

      <Modal
        open={!!editingSubject}
        onClose={() => setEditingSubject(null)}
        icon="edit"
        title="Edit Subject"
        subtitle={editingSubject ? `Updating: ${editingSubject.name}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingSubject(null)}>Cancel</Button>
            <Button type="submit" form="edit-subject-form" loading={saving}>
              Save Changes
            </Button>
          </>
        }
      >
        <form id="edit-subject-form" onSubmit={handleUpdateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Subject Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. Mathematics"
            required
          />
          <Input
            label="Class"
            type="select"
            value={editClassId}
            onChange={(e) => setEditClassId(e.target.value)}
            required
            options={[{ value: '', label: 'Select a class' }, ...classes.map(cls => ({ value: cls.id, label: cls.name }))]}
          />
        </form>
      </Modal>
    </Card>
  );
}
