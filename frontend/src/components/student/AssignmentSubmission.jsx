'use client';

import { useState, useEffect, useCallback } from 'react';
import { studentService } from '@/services/student.service';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icons';
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const triggerDownload = (result, fallbackName) => {
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename || fallbackName || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function AssignmentSubmission() {
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeSub, setActiveSub] = useState(null);

  const fetchData = useCallback(() => {
    Promise.all([
      studentService.getAssignments().catch(() => ({ items: [] })),
      studentService.getMySubmissions().catch(() => [])
    ])
      .then(([assignRes, subRes]) => {
        setAssignments(assignRes?.items ?? []);
        setMySubmissions(subRes);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load assignments');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    const existingSub = mySubmissions.find(s => s.assignmentId === assignment.id);
    setActiveSub(existingSub || null);
    setContent(existingSub?.content || '');
    setFile(null);
    setError('');
  };

  const handleDownload = async (sub) => {
    try {
      const result = await studentService.downloadFile(sub.id, sub.fileName);
      triggerDownload(result, sub.fileName);
    } catch (err) {
      setError(err.message || 'Failed to download file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;

    try {
      setSubmitting(true);
      setError('');

      let sub = activeSub;
      if (sub) {
        await studentService.updateSubmission(sub.id, { content });
      } else {
        sub = await studentService.createSubmission({
          assignmentId: selectedAssignment.id,
          content
        });
      }

      if (file) {
        await studentService.uploadFile(sub.id, file);
      }

      setFile(null);
      await fetchData();

      const updatedSubmissions = await studentService.getMySubmissions();
      const newActiveSub = updatedSubmissions.find(s => s.assignmentId === selectedAssignment.id);
      setActiveSub(newActiveSub);

    } catch (err) {
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && assignments.length === 0) {
    return <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {selectedAssignment ? (
        <Card className="animate-fade-in" padding="2rem">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => setSelectedAssignment(null)} icon={<Icon name="chevronLeft" size={16} />}>
              Back
            </Button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedAssignment.title}</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Assignment Details</h4>
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                {selectedAssignment.description}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Deadline:</span>
                  <span>{new Date(selectedAssignment.deadline).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Max Marks:</span>
                  <span>{selectedAssignment.maxMarks}</span>
                </div>
              </div>
            </div>

            <div>
              {activeSub && activeSub.gradingStatus === 'Graded' ? (
                <div style={{ background: 'var(--primary-alpha)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--primary-light)' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary-color)' }}>Grading Complete</h4>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                      {activeSub.marks} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>/ {selectedAssignment.maxMarks}</span>
                    </div>
                  </div>

                  <h5 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Teacher Feedback:</h5>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', background: 'white', padding: '1rem', borderRadius: '8px' }}>
                    {activeSub.feedback || 'No feedback provided.'}
                  </p>

                  <div style={{ marginTop: '1.5rem' }}>
                    <h5 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Your Submission:</h5>
                    {activeSub.content && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', background: 'white', padding: '1rem', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', marginBottom: '0.75rem' }}>
                        {activeSub.content}
                      </div>
                    )}
                    {activeSub.fileName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: 600 }}>{activeSub.fileName}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{formatBytes(activeSub.fileSize)}</span>
                        <Button variant="secondary" onClick={() => handleDownload(activeSub)} style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                          Download
                        </Button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No file attached.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Your Submission</h4>

                  {activeSub && (
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <Badge type={activeSub.submissionStatus === 'Late' ? 'danger' : 'success'}>
                        {activeSub.submissionStatus}
                      </Badge>
                      <Badge type="warning">{activeSub.gradingStatus}</Badge>
                    </div>
                  )}

                  {activeSub && activeSub.fileName && (
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 600 }}>Uploaded file:</span>
                      <span>{activeSub.fileName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{formatBytes(activeSub.fileSize)}</span>
                      <Button variant="secondary" onClick={() => handleDownload(activeSub)} style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                        Download
                      </Button>
                    </div>
                  )}

                  <Alert type="error" message={error} />

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                      type="textarea"
                      label="Written Answer (optional if uploading a file)"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      rows={8}
                      placeholder="Write your answer here..."
                      style={{ resize: 'none' }}
                    />
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                        Attach File (.pdf, .docx, max 50MB)
                      </label>
                      <Input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={e => setFile(e.target.files[0] || null)}
                      />
                      {file && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                          {file.name} ({formatBytes(file.size)})
                        </span>
                      )}
                    </div>
                    <Button type="submit" loading={submitting} disabled={!content.trim() && !file}>
                      {activeSub ? 'Update Submission' : 'Submit Assignment'}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card icon="clipboard" title="Available Assignments" subtitle="Open an assignment to view details and submit your work" padding="2rem">
          <Alert type="error" message={error} />

          <Table>
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Deadline</Th>
                <Th>Status</Th>
                <Th>Grade</Th>
                <Th style={{ textAlign: 'right' }}>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {assignments.length === 0 ? (
                <Tr><Td colSpan="5">
                  <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                    <Icon name="clipboard" size={44} />
                    <strong>No available assignments</strong>
                    <span>Check back soon — your teacher will publish new work here.</span>
                  </div>
                </Td></Tr>
              ) : (
                assignments.map((assignment) => {
                  const sub = mySubmissions.find(s => s.assignmentId === assignment.id);
                  return (
                    <Tr key={assignment.id}>
                      <Td style={{ fontWeight: 500 }}>{assignment.title}</Td>
                      <Td>{new Date(assignment.deadline).toLocaleString()}</Td>
                      <Td>
                        {sub ? (
                          <Badge type={sub.submissionStatus === 'Late' ? 'danger' : 'success'}>
                            {sub.submissionStatus}
                          </Badge>
                        ) : (
                          <Badge type="info">Not Submitted</Badge>
                        )}
                      </Td>
                      <Td>
                        {sub?.gradingStatus === 'Graded' ? (
                          <span style={{ fontWeight: 600, color: 'var(--success)' }}>{sub.marks}/{assignment.maxMarks}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </Td>
                      <Td style={{ textAlign: 'right' }}>
                        <Button
                          variant={sub ? 'secondary' : 'primary'}
                          onClick={() => handleSelectAssignment(assignment)}
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          {sub ? 'View' : 'Start'}
                        </Button>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
