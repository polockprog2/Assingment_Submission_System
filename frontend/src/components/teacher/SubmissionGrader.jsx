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

export default function SubmissionGrader({ assignment, onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Grading state for a selected submission
  const [selectedSub, setSelectedSub] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  const fetchSubmissions = useCallback(() => {
    teacherService.getSubmissionsForAssignment(assignment.id)
      .then((data) => setSubmissions(data))
      .catch((err) => setError(err.message || 'Failed to fetch submissions'))
      .finally(() => setLoading(false));
  }, [assignment]);

  useEffect(() => {
    if (!assignment) return;
    fetchSubmissions();
  }, [assignment, fetchSubmissions]);

  const handleGrade = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    
    try {
      setGrading(true);
      setError('');
      await teacherService.gradeSubmission(selectedSub.id, {
        marks: parseInt(marks),
        feedback
      });
      setSelectedSub(null);
      setMarks('');
      setFeedback('');
      fetchSubmissions();
    } catch (err) {
      setError(err.message || 'Failed to submit grade');
    } finally {
      setGrading(false);
    }
  };

  const handleDownload = async (sub) => {
    try {
      const result = await teacherService.downloadSubmissionFile(sub.id, sub.fileName);
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || sub.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download file');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!assignment) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={onBack} icon={<Icon name="chevronLeft" size={16} />}>
          Back to Assignments
        </Button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Submissions for: {assignment.title}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedSub ? '1fr 1fr' : '1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Submissions List */}
        <Card icon="users" title="All Submissions" subtitle={`${submissions.length} student submission${submissions.length === 1 ? '' : 's'} received`} padding="2rem">
          <Alert type="error" message={error} />
          
          {loading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-md)' }} />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Student ID</Th>
                  <Th>Status</Th>
                  <Th>Grading</Th>
                  <Th>File</Th>
                  <Th style={{ textAlign: 'right' }}>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {submissions.length === 0 ? (
                  <Tr><Td colSpan="5">
                    <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                      <Icon name="users" size={44} />
                      <strong>No submissions yet</strong>
                      <span>Once students submit work, it will appear here.</span>
                    </div>
                  </Td></Tr>
                ) : (
                  submissions.map((sub) => (
                    <Tr key={sub.id} style={{ backgroundColor: selectedSub?.id === sub.id ? 'var(--primary-alpha)' : 'transparent' }}>
                      <Td style={{ fontWeight: 500 }}>{sub.studentId}</Td>
                      <Td>
                        <Badge type={sub.submissionStatus === 'Late' ? 'danger' : 'success'}>
                          {sub.submissionStatus}
                        </Badge>
                      </Td>
                      <Td>
                        {sub.gradingStatus === 'Graded' ? (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{sub.marks} / {assignment.maxMarks}</span>
                        ) : (
                          <Badge type="warning">Pending</Badge>
                        )}
                      </Td>
                      <Td>
                        {sub.fileName ? (
                          <Button variant="secondary" onClick={() => handleDownload(sub)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                            {sub.fileName}
                          </Button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                        )}
                      </Td>
                      <Td style={{ textAlign: 'right' }}>
                        <Button onClick={() => {
                          setSelectedSub(sub);
                          setMarks(sub.marks || '');
                          setFeedback(sub.feedback || '');
                        }} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                          View & Grade
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          )}
        </Card>

        {/* Grading Panel */}
        {selectedSub && (
          <Card className="animate-fade-in" padding="2rem">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className="header-icon" style={{ width: 38, height: 38, borderRadius: 11 }}><Icon name="grade" size={18} /></span>
                Grade Submission
              </h3>
              <button onClick={() => setSelectedSub(null)} aria-label="Close" className="icon-btn">
                <Icon name="x" size={18} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Submitted Content:</div>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{selectedSub.content || 'No written content.'}</p>
              {selectedSub.fileName && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600 }}>Attached file:</span>
                  <span>{selectedSub.fileName}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatBytes(selectedSub.fileSize)}</span>
                  <Button variant="secondary" onClick={() => handleDownload(selectedSub)} style={{ marginLeft: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                    Download
                  </Button>
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                Submitted At: {new Date(selectedSub.submittedAt).toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                type="number"
                label={`Marks (Out of ${assignment.maxMarks})`}
                value={marks}
                onChange={e => setMarks(e.target.value)}
                required
                min="0"
                max={assignment.maxMarks}
              />
              <Input
                type="textarea"
                label="Feedback"
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={4}
                placeholder="Provide feedback to the student..."
              />
              <Button type="submit" loading={grading} style={{ marginTop: '0.5rem' }}>
                Save Grade
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
