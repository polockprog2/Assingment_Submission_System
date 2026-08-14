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

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingClass, setEditingClass] = useState(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchClasses = useCallback(() => {
    adminService.getClasses()
      .then((data) => setClasses(data.items))
      .catch((err) => setError(err.message || 'Failed to fetch classes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setCreating(true);
      setError('');
      setSuccess('');
      await adminService.createClass({ name: newClassName });
      setNewClassName('');
      setSuccess('Class created successfully.');
      fetchClasses();
    } catch (err) {
      setError(err.message || 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (cls) => {
    setEditingClass(cls);
    setEditName(cls.name);
    setError('');
    setSuccess('');
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!editingClass) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await adminService.updateClass(editingClass.id, { name: editName });
      setEditingClass(null);
      setSuccess('Class updated successfully.');
      fetchClasses();
    } catch (err) {
      setError(err.message || 'Failed to update class');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await adminService.deleteClass(id);
      setSuccess('Class deleted successfully.');
      fetchClasses();
    } catch (err) {
      setError(err.message || 'Failed to delete class');
    }
  };

  if (loading && classes.length === 0) {
    return <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />;
  }

  return (
    <Card icon="school" title="Manage Classes" subtitle="Create, edit and organize class groups" padding="2rem">
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form onSubmit={handleCreateClass} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
        <Input
          label="New Class Name"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          placeholder="e.g. 10A"
          required
          style={{ flex: 1 }}
        />
        <Button type="submit" loading={creating} style={{ height: '44px' }}>
          Add Class
        </Button>
      </form>

      <Table>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Class Name</Th>
            <Th style={{ textAlign: 'right' }}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {classes.length === 0 ? (
            <Tr><Td colSpan="3">
              <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                <Icon name="school" size={44} />
                <strong>No classes found</strong>
                <span>Add your first class using the form above.</span>
              </div>
            </Td></Tr>
          ) : (
            classes.map((cls) => (
              <Tr key={cls.id}>
                <Td>{cls.id}</Td>
                <Td style={{ fontWeight: 500 }}>{cls.name}</Td>
                <Td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={() => openEdit(cls)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteClass(cls.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                      Delete
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      <Modal
        open={!!editingClass}
        onClose={() => setEditingClass(null)}
        icon="edit"
        title="Edit Class"
        subtitle={editingClass ? `Renaming class #${editingClass.id}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingClass(null)}>Cancel</Button>
            <Button type="submit" form="edit-class-form" loading={saving}>
              Save Changes
            </Button>
          </>
        }
      >
        <form id="edit-class-form" onSubmit={handleUpdateClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Class Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. 10A"
            required
          />
        </form>
      </Modal>
    </Card>
  );
}
