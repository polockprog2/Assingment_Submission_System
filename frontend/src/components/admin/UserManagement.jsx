'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/admin.service';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icons';
import Modal from '@/components/ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';

const ROLE_OPTIONS = [
  { value: 'Student', label: 'Student' },
  { value: 'Teacher', label: 'Teacher' },
  { value: 'Admin', label: 'Admin' },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [classId, setClassId] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('Student');
  const [editClassId, setEditClassId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(() => {
    Promise.all([
      adminService.getUsers(),
      adminService.getClasses()
    ])
      .then(([usrRes, clsRes]) => {
        setUsers(usrRes.items);
        setClasses(clsRes.items);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!email || !password || !role) return;
    if (role === 'Student' && !classId) {
      setError('Student must be assigned to a class');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setSuccess('');

      const payload = {
        email,
        password,
        role,
        classId: role === 'Student' ? parseInt(classId) : null
      };

      await adminService.createUser(payload);

      setEmail('');
      setPassword('');
      setRole('Student');
      setClassId('');
      setSuccess('User created successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditPassword('');
    setEditRole(user.role);
    setEditClassId(user.classId ? String(user.classId) : '');
    setError('');
    setSuccess('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editRole === 'Student' && !editClassId) {
      setError('Student must be assigned to a class');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        email: editEmail,
        role: editRole,
        classId: editRole === 'Student' ? parseInt(editClassId) : null
      };
      if (editPassword) payload.password = editPassword;

      await adminService.updateUser(editingUser.id, payload);

      setEditingUser(null);
      setSuccess('User updated successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminService.deleteUser(id);
      setSuccess('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  if (loading && users.length === 0) {
    return <div className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />;
  }

  return (
    <Card icon="users" title="Manage Users" subtitle="Create, edit and control access across the institution" padding="2rem">
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'flex-end' }}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="New user email"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <Input
          label="Role"
          type="select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          options={ROLE_OPTIONS}
        />
        {role === 'Student' && (
          <Input
            label="Class"
            type="select"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
            options={[{ value: '', label: 'Select a class' }, ...classes.map(cls => ({ value: cls.id, label: cls.name }))]}
          />
        )}
        <Button type="submit" loading={creating} style={{ height: '44px' }}>
          Add User
        </Button>
      </form>

      <Table>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Class</Th>
            <Th style={{ textAlign: 'right' }}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.length === 0 ? (
            <Tr><Td colSpan="5">
              <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                <Icon name="users" size={44} />
                <strong>No users found</strong>
                <span>Add your first user using the form above.</span>
              </div>
            </Td></Tr>
          ) : (
            users.map((user) => {
              const cls = classes.find(c => c.id === user.classId);
              return (
                <Tr key={user.id}>
                  <Td>{user.id}</Td>
                  <Td style={{ fontWeight: 500 }}>{user.email}</Td>
                  <Td>
                    <Badge type={user.role === 'Admin' ? 'primary' : user.role === 'Teacher' ? 'warning' : 'success'}>
                      {user.role}
                    </Badge>
                  </Td>
                  <Td>{user.role === 'Student' ? (cls ? cls.name : `ID: ${user.classId}`) : '-'}</Td>
                  <Td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Button variant="secondary" onClick={() => openEdit(user)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => handleDeleteUser(user.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
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
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        icon="edit"
        title="Edit User"
        subtitle={editingUser ? `Updating: ${editingUser.email}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button type="submit" form="edit-user-form" loading={saving}>
              Save Changes
            </Button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder="User email"
            required
          />
          <Input
            label="Password (leave blank to keep current)"
            type="password"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="New password"
          />
          <Input
            label="Role"
            type="select"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            required
            options={ROLE_OPTIONS}
          />
          {editRole === 'Student' && (
            <Input
              label="Class"
              type="select"
              value={editClassId}
              onChange={(e) => setEditClassId(e.target.value)}
              required
              options={[{ value: '', label: 'Select a class' }, ...classes.map(cls => ({ value: cls.id, label: cls.name }))]}
            />
          )}
        </form>
      </Modal>
    </Card>
  );
}
