import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useErpClasses, useErpSubjects, useSchoolInfo } from '../../hooks/useErpAcademics';
import { useStudents } from '../../hooks/useErpStudents';
import {
  useExams, useExamMarks,
  createExam, updateExam, deleteExam, publishExam, lockExam,
  upsertMarks, getStudentReport,
  upsertStudentResult, getExamStudentResults, recalculateRanks,
  type ErpExam, type SubjectConfig, type ExamMark,
} from '../../hooks/useErpExams';
import {
  Plus, Trash2, Edit2, CheckCircle2, Lock, BookOpen,
  X, Loader2, AlertCircle, Printer, FileText,
  BarChart2, Search, Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

/* ─── helpers ──────────────────────────────────────── */
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  draft: { bg: '#fef9c3', color: '#ca8a04', label: 'Draft' },
  published: { bg: '#dcfce7', color: '#16a34a', label: 'Published' },
  locked: { bg: '#fee2e2', color: '#dc2626', label: 'Locked' },
};

function gradeOf(pct: number) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}


/* ─── Main Page ─────────────────────────────────────── */
export default function Results() {
  const { schoolId } = useAuth();
  const [tab, setTab] = useState<'exams' | 'marks' | 'report' | 'generator'>('exams');
  const [installedModules, setInstalledModules] = useState<any[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    const fetchModules = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/saas-platform/school-apps`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        const data = await res.json();
        const activeModules = data.marketplace?.filter((m: any) =>
          data.installed?.find((i: any) => i.module_id === m.id && i.is_active)
        );
        setInstalledModules(activeModules || []);
      } catch (err) {
        console.error('Error fetching modules for results:', err);
      }
    };
    fetchModules();
  }, [schoolId]);

  return (
    <AdminLayout pageTitle="Results & Exams" pageSubtitle="Create exams, enter marks, and generate report cards">
      {/* Global Print Styles */}
      <style>{`
        @media print {
          /* Hide everything in the main app */
          body * { 
            visibility: hidden !important; 
          }
          
          /* Show only the portal and its children */
          #print-portal, #print-portal * { 
            visibility: visible !important; 
          }
          
          #print-portal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          /* Ensure page breaks work */
          .rc-page {
            page-break-after: always !important;
            break-after: page !important;
          }

          /* Reset any restrictive layouts */
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }
        }
      `}</style>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {([
          { key: 'exams', label: 'Exams', icon: BookOpen },
          { key: 'marks', label: 'Marks Entry', icon: BarChart2 },
          { key: 'report', label: 'Report Card', icon: FileText },
          { key: 'generator', label: 'Report Card Generator', icon: Printer },
        ] as const).map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              background: active ? '#fff' : 'none',
              color: active ? '#7c3aed' : '#64748b',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all .2s',
            }}>
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {installedModules.length > 0 && (
        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0369a1' }}>{installedModules.length} Marketplace Modules Active</span>
        </div>
      )}

      {tab === 'exams' && <ExamsTab schoolId={schoolId} />}
      {tab === 'marks' && <MarksTab schoolId={schoolId} />}
      {tab === 'report' && <ReportTab schoolId={schoolId} />}
      {tab === 'generator' && <GeneratorTab schoolId={schoolId} />}
    </AdminLayout>
  );
}

/* ════════════════════════════════════════════════════
   TAB 1 — EXAMS
════════════════════════════════════════════════════ */
function ExamsTab({ schoolId }: { schoolId: string | null }) {
  const { classes, sessions, currentSession } = useErpClasses(schoolId);
  const { exams, loading, error, refetch } = useExams(schoolId, currentSession?.id);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ErpExam | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: string;
    onConfirm: () => void;
  } | null>(null);

  const filtered = useMemo(() =>
    exams.filter(e => e.name.toLowerCase().includes(search.toLowerCase())),
    [exams, search]
  );

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (e: ErpExam) => { setEditing(e); setShowForm(true); };

  const handlePublish = async (exam: ErpExam) => {
    if (!schoolId) return;
    setBusy(true);
    try { await publishExam({ school_id: schoolId, exam_id: exam.id }); refetch(); }
    catch (e: any) { alert(e.message); }
    finally { setBusy(false); }
  };

  const handleLock = (exam: ErpExam) => {
    if (!schoolId) return;
    setConfirmModal({
      title: 'Lock Exam',
      message: `Are you sure you want to lock "${exam.name}"? Marks will not be editable after this.`,
      confirmLabel: 'Lock Exam',
      confirmColor: '#2563eb',
      onConfirm: async () => {
        setConfirmModal(null);
        setBusy(true);
        try { await lockExam({ school_id: schoolId, exam_id: exam.id }); refetch(); }
        catch (e: any) { alert(e.message); }
        finally { setBusy(false); }
      },
    });
  };

  const handleDelete = (exam: ErpExam) => {
    if (!schoolId) return;
    setConfirmModal({
      title: 'Delete Exam',
      message: `Are you sure you want to delete "${exam.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: '#dc2626',
      onConfirm: async () => {
        setConfirmModal(null);
        setDeleting(exam.id);
        try { await deleteExam({ school_id: schoolId, exam_id: exam.id }); refetch(); }
        catch (e: any) { alert(e.message); }
        finally { setDeleting(null); }
      },
    });
  };

  return (
    <>
      {/* toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '8px 14px', gap: 8, minWidth: 220 }}>
          <Search size={14} color="#94a3b8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams…"
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: '#475569', width: '100%' }} />
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', background: '#7c3aed', border: 'none', borderRadius: 10,
          color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
        }}>
          <Plus size={14} /> Create Exam
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Loader2 size={28} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <AlertCircle size={18} />{error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
          {search ? 'No exams match your search.' : 'No exams yet. Click "Create Exam" to get started.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(exam => {
            const st = STATUS_STYLE[exam.status] ?? STATUS_STYLE.draft;
            const className = exam.erp_classes?.name ?? '—';
            const sessionName = exam.erp_academic_sessions?.name ?? '—';
            return (
              <div key={exam.id} style={{
                background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}>
                {/* left accent */}
                <div style={{ width: 4, minWidth: 4, height: 48, borderRadius: 4, background: st.color, flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{exam.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                    Class {className}{exam.section ? ` (${exam.section})` : ''} &bull; {sessionName}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {exam.subjects_config.length} subject{exam.subjects_config.length !== 1 ? 's' : ''} configured
                  </div>
                </div>

                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: st.bg, color: st.color }}>
                  {st.label}
                </span>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {exam.status === 'draft' && (
                    <>
                      <button onClick={() => openEdit(exam)} style={actionBtn('#fef9c3', '#ca8a04')}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handlePublish(exam)} disabled={busy} style={actionBtn('#dcfce7', '#16a34a')}>
                        <CheckCircle2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(exam)} disabled={deleting === exam.id} style={actionBtn('#fee2e2', '#dc2626')}>
                        {deleting === exam.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                      </button>
                    </>
                  )}
                  {exam.status === 'published' && (
                    <button onClick={() => handleLock(exam)} disabled={busy} style={actionBtn('#dbeafe', '#2563eb')} title="Lock exam">
                      <Lock size={13} />
                    </button>
                  )}
                  {exam.status === 'locked' && (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>🔒 Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ExamFormModal
          schoolId={schoolId}
          classes={classes}
          sessions={sessions}
          currentSessionId={currentSession?.id ?? null}
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refetch(); }}
        />
      )}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmColor={confirmModal.confirmColor}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function actionBtn(bg: string, color: string) {
  return {
    padding: '6px 10px', background: bg, border: 'none', borderRadius: 8,
    cursor: 'pointer', display: 'flex', alignItems: 'center', color,
  } as React.CSSProperties;
}

/* ─── Confirm Modal ───────────────────────────────── */
function ConfirmModal({
  title, message, confirmLabel, confirmColor, onConfirm, onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 10000, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420,
          boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
          animation: 'modalPop .2s ease',
        }}
      >
        {/* icon + title */}
        <div style={{ padding: '28px 28px 0', textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: confirmColor === '#dc2626' ? '#fee2e2' : '#dbeafe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Trash2 size={22} color={confirmColor} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>{title}</div>
          <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.55, margin: 0 }}>{message}</p>
        </div>
        {/* actions */}
        <div style={{ padding: '24px 28px 28px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px', background: '#f1f5f9', border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 22px', background: confirmColor, border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalPop { from { opacity:0; transform:scale(.94); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}

/* ─── Exam Form Modal ─────────────────────────────── */
function ExamFormModal({
  schoolId, classes, sessions, currentSessionId, editing, onClose, onSaved,
}: {
  schoolId: string | null;
  classes: any[];
  sessions: any[];
  currentSessionId: string | null;
  editing: ErpExam | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [classId, setClassId] = useState(editing?.class_id ?? '');
  const [section, setSection] = useState(editing?.section ?? '');
  const [sessionId, setSessionId] = useState(editing?.session_id ?? currentSessionId ?? '');
  const [subjects, setSubjects] = useState<SubjectConfig[]>(editing?.subjects_config ?? []);
  const [saving, setSaving] = useState(false);

  const { subjects: availableSubjects, loading: subLoading } = useErpSubjects(schoolId, classId || null);

  const selectedClass = classes.find(c => c.id === classId);
  const sections = selectedClass?.sections ?? [];

  const addSubject = (subj: any) => {
    if (subjects.find(s => s.subject_id === subj.id)) return;
    setSubjects(prev => [...prev, {
      subject_id: subj.id,
      subject_name: subj.name,
      max_theory: 100,
      pass_marks: 35,
    }]);
  };

  const removeSubject = (id: string) =>
    setSubjects(prev => prev.filter(s => s.subject_id !== id));

  const updateSubject = (id: string, field: keyof SubjectConfig, value: any) =>
    setSubjects(prev => prev.map(s => s.subject_id === id ? { ...s, [field]: value } : s));

  const handleSave = async () => {
    if (!schoolId || !name.trim() || !classId) return alert('Name and Class are required');
    if (subjects.length === 0) return alert('Add at least one subject');
    setSaving(true);
    try {
      const payload = { school_id: schoolId, session_id: sessionId || null, class_id: classId, section: section || null, name: name.trim(), subjects_config: subjects };
      if (editing) {
        await updateExam({ ...payload, exam_id: editing.id });
      } else {
        await createExam(payload);
      }
      onSaved();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999, overflowY: 'auto', padding: '32px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 760, boxShadow: '0 24px 48px rgba(0,0,0,0.18)' }}>
        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1e293b' }}>{editing ? 'Edit Exam' : 'Create Exam'}</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>Configure exam name, class, and subjects with marks</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Exam Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Half Yearly Examination 2025"
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Academic Session</label>
              <select value={sessionId} onChange={e => setSessionId(e.target.value)} style={inputStyle}>
                <option value="">— Select Session —</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_current ? ' (Current)' : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Class *</label>
              <select value={classId} onChange={e => { setClassId(e.target.value); setSection(''); }} style={inputStyle}>
                <option value="">— Select Class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {sections.length > 0 && (
              <div>
                <label style={labelStyle}>Section (optional)</label>
                <select value={section} onChange={e => setSection(e.target.value)} style={inputStyle}>
                  <option value="">All Sections</option>
                  {sections.map((s: string) => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Subject Picker */}
          {classId && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ ...labelStyle, margin: 0 }}>Available Subjects — click to add</label>
                {subLoading && <Loader2 size={14} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', minHeight: 46 }}>
                {availableSubjects.length === 0 && !subLoading && (
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>No subjects found for this class. Add subjects in Settings.</span>
                )}
                {availableSubjects.map(s => {
                  const added = subjects.some(x => x.subject_id === s.id);
                  return (
                    <button key={s.id} onClick={() => addSubject(s)} disabled={added} style={{
                      padding: '5px 12px', borderRadius: 999, border: 'none', cursor: added ? 'not-allowed' : 'pointer',
                      fontSize: 12, fontWeight: 600,
                      background: added ? '#ede9fe' : '#f1f5f9',
                      color: added ? '#7c3aed' : '#475569',
                      fontFamily: 'inherit',
                    }}>
                      {added ? '✓ ' : '+ '}{s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subject configs */}
          {subjects.length > 0 && (
            <div>
              <label style={labelStyle}>Subject Marks Configuration</label>
              <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 90px 90px 90px 80px 36px', gap: 0, padding: '10px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  {['Subject', 'Theory', 'Practical', 'Internal', 'Pass', ''].map(h => (
                    <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
                  ))}
                </div>
                {subjects.map((s, i) => (
                  <div key={s.subject_id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 90px 90px 90px 80px 36px', gap: 0, padding: '10px 16px', borderBottom: i < subjects.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{s.subject_name}</div>
                    <input type="number" value={s.max_theory} min={0} max={500}
                      onChange={e => updateSubject(s.subject_id, 'max_theory', Number(e.target.value))}
                      style={cellInput} />
                    <input type="number" value={s.max_practical ?? ''} min={0} max={500} placeholder="–"
                      onChange={e => updateSubject(s.subject_id, 'max_practical', e.target.value === '' ? undefined : Number(e.target.value))}
                      style={cellInput} />
                    <input type="number" value={s.max_internal ?? ''} min={0} max={500} placeholder="–"
                      onChange={e => updateSubject(s.subject_id, 'max_internal', e.target.value === '' ? undefined : Number(e.target.value))}
                      style={cellInput} />
                    <input type="number" value={s.pass_marks} min={0} max={500}
                      onChange={e => updateSubject(s.subject_id, 'pass_marks', Number(e.target.value))}
                      style={cellInput} />
                    <button onClick={() => removeSubject(s.subject_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: 4 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                Leave Practical / Internal blank if not applicable for that subject.
              </p>
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: 9, fontSize: 13, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '9px 22px', background: saving ? '#c4b5fd' : '#7c3aed', border: 'none', borderRadius: 9,
            fontSize: 13, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {editing ? 'Save Changes' : 'Create Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   TAB 2 — MARKS ENTRY
════════════════════════════════════════════════════ */
function MarksTab({ schoolId }: { schoolId: string | null }) {
  const { currentSession } = useErpClasses(schoolId);
  const { exams, loading: examsLoading } = useExams(schoolId, currentSession?.id);
  const publishedExams = exams.filter(e => e.status === 'published' || e.status === 'locked');

  const [selectedExamId, setSelectedExamId] = useState('');
  const selectedExam = exams.find(e => e.id === selectedExamId) ?? null;

  const { students } = useStudents(schoolId);
  const classStudents = useMemo(() => {
    if (!selectedExam) return [];
    return students.filter(s =>
      s.current_class_id === selectedExam.class_id &&
      (!selectedExam.section || s.current_section === selectedExam.section)
    );
  }, [students, selectedExam]);

  const { marks, loading: marksLoading, refetch: refetchMarks } = useExamMarks(schoolId, selectedExamId || null);

  // local edits: { [studentId_subjectId]: { theory, practical, internal, absent } }
  const [edits, setEdits] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Per-student result overrides (remarks, result)
  const [resultOverrides, setResultOverrides] = useState<Record<string, { remarks: string; result: string }>>({});
  const [rankSaved, setRankSaved] = useState(false);

  // Load existing overrides when exam changes
  useEffect(() => {
    if (!schoolId || !selectedExamId) { setResultOverrides({}); return; }
    getExamStudentResults(schoolId, selectedExamId).then(rows => {
      const map: Record<string, any> = {};
      rows.forEach(r => { map[r.student_id] = { remarks: r.custom_remarks ?? '', result: r.custom_result ?? '' }; });
      setResultOverrides(map);
    }).catch(() => { });
  }, [schoolId, selectedExamId]);

  // Initialize edits from DB marks
  useEffect(() => {
    const map: Record<string, any> = {};
    marks.forEach(m => {
      map[`${m.student_id}_${m.subject_id}`] = {
        theory: m.theory_marks ?? '',
        practical: m.practical_marks ?? '',
        internal: m.internal_marks ?? '',
        absent: m.is_absent,
      };
    });
    setEdits(map);
  }, [marks]);

  const getEdit = (studentId: string, subjectId: string) =>
    edits[`${studentId}_${subjectId}`] ?? { theory: '', practical: '', internal: '', absent: false };

  const setEdit = (studentId: string, subjectId: string, field: string, value: any) =>
    setEdits(prev => ({
      ...prev,
      [`${studentId}_${subjectId}`]: { ...getEdit(studentId, subjectId), [field]: value },
    }));

  const handleSave = async () => {
    if (!schoolId || !selectedExamId || !selectedExam) return;
    setSaving(true);
    try {
      const marksData: any[] = [];
      classStudents.forEach(st => {
        selectedExam.subjects_config.forEach(sub => {
          const ed = getEdit(st.id, sub.subject_id);
          marksData.push({
            student_id: st.id,
            subject_id: sub.subject_id,
            theory_marks: ed.absent ? null : (ed.theory === '' ? null : Number(ed.theory)),
            practical_marks: sub.max_practical != null && !ed.absent ? (ed.practical === '' ? null : Number(ed.practical)) : null,
            internal_marks: sub.max_internal != null && !ed.absent ? (ed.internal === '' ? null : Number(ed.internal)) : null,
            is_absent: !!ed.absent,
          });
        });
      });
      await upsertMarks({ school_id: schoolId, exam_id: selectedExamId, marks_data: marksData });

      // Save per-student remarks/result overrides
      for (const st of classStudents) {
        const override = resultOverrides[st.id];
        if (override?.remarks || override?.result) {
          await upsertStudentResult({
            school_id: schoolId,
            exam_id: selectedExamId,
            student_id: st.id,
            custom_remarks: override.remarks || undefined,
            custom_result: override.result || undefined,
          });
        }
      }

      // Auto-recalculate ranks
      const studentTotals = classStudents.map(st => {
        let total = 0;
        let passed = true;
        selectedExam.subjects_config.forEach(sub => {
          const ed = getEdit(st.id, sub.subject_id);
          const obt = ed.absent ? 0 : ((Number(ed.theory) || 0) + (Number(ed.practical) || 0) + (Number(ed.internal) || 0));
          total += obt;
          if (ed.absent || obt < sub.pass_marks) passed = false;
        });
        return { student_id: st.id, total, passed, section: st.current_section ?? undefined };
      });
      await recalculateRanks(schoolId, selectedExamId, studentTotals);

      await refetchMarks();
      setSaved(true);
      setRankSaved(true);
      setTimeout(() => { setSaved(false); setRankSaved(false); }, 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* exam selector */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <label style={labelStyle}>Select Exam (Published only)</label>
          {examsLoading ? <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading…</div> : (
            <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} style={inputStyle}>
              <option value="">— Choose an exam —</option>
              {publishedExams.map(e => (
                <option key={e.id} value={e.id}>{e.name} — Class {e.erp_classes?.name}{e.section ? ` (${e.section})` : ''} [{e.status}]</option>
              ))}
            </select>
          )}
        </div>
        {selectedExam && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <button onClick={handleSave} disabled={saving || selectedExam.status === 'locked'} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
              background: selectedExam.status === 'locked' ? '#f1f5f9' : '#7c3aed',
              color: selectedExam.status === 'locked' ? '#94a3b8' : '#fff',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: selectedExam.status === 'locked' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
              {selectedExam.status === 'locked' ? 'Exam Locked' : 'Save Marks & Recalculate Ranks'}
            </button>
            {saved && <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Marks Saved! {rankSaved ? '| 🏆 Ranks Updated' : ''}</span>}
          </div>
        )}
      </div>

      {selectedExam && (
        <>
          {marksLoading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : classStudents.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No students found for this class/section.</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ ...thStyle, position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2 }}>Student</th>
                      <th style={thStyle}>Roll No</th>
                      {selectedExam.subjects_config.map(s => (
                        <th key={s.subject_id} style={{ ...thStyle, minWidth: 160 }}>
                          <div>{s.subject_name}</div>
                          <div style={{ fontWeight: 400, fontSize: 10, color: '#94a3b8' }}>
                            T:{s.max_theory}{s.max_practical != null ? ` P:${s.max_practical}` : ''}{s.max_internal != null ? ` IA:${s.max_internal}` : ''}
                          </div>
                        </th>
                      ))}
                      <th style={thStyle}>Absent</th>
                      <th style={{ ...thStyle, minWidth: 140 }}>Remarks</th>
                      <th style={{ ...thStyle, minWidth: 140 }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((st, i) => (
                      <tr key={st.id} style={{ borderTop: '1px solid #f1f5f9' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ ...tdStyle, position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `hsl(${i * 50},55%,80%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: `hsl(${i * 50},55%,35%)`, flexShrink: 0 }}>
                              {st.first_name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{st.first_name} {st.last_name}</div>
                              <div style={{ fontSize: 10, color: '#94a3b8' }}>{st.admission_number}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: '#64748b', fontSize: 12 }}>{st.roll_number ?? '—'}</td>
                        {selectedExam.subjects_config.map(sub => {
                          const ed = getEdit(st.id, sub.subject_id);
                          const isAbsent = ed.absent;
                          const isLocked = selectedExam.status === 'locked';
                          return (
                            <td key={sub.subject_id} style={{ ...tdStyle, padding: '8px 12px' }}>
                              {isAbsent ? (
                                <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Absent</span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 10, color: '#94a3b8', width: 14 }}>T</span>
                                    <input type="number" value={ed.theory} min={0} max={sub.max_theory} disabled={isLocked}
                                      onChange={e => setEdit(st.id, sub.subject_id, 'theory', e.target.value)}
                                      style={{ ...markInput, width: 60 }} placeholder="—" />
                                    <span style={{ fontSize: 10, color: '#94a3b8' }}>/{sub.max_theory}</span>
                                  </div>
                                  {sub.max_practical != null && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ fontSize: 10, color: '#94a3b8', width: 14 }}>P</span>
                                      <input type="number" value={ed.practical} min={0} max={sub.max_practical} disabled={isLocked}
                                        onChange={e => setEdit(st.id, sub.subject_id, 'practical', e.target.value)}
                                        style={{ ...markInput, width: 60 }} placeholder="—" />
                                      <span style={{ fontSize: 10, color: '#94a3b8' }}>/{sub.max_practical}</span>
                                    </div>
                                  )}
                                  {sub.max_internal != null && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ fontSize: 10, color: '#94a3b8', width: 14 }}>IA</span>
                                      <input type="number" value={ed.internal} min={0} max={sub.max_internal} disabled={isLocked}
                                        onChange={e => setEdit(st.id, sub.subject_id, 'internal', e.target.value)}
                                        style={{ ...markInput, width: 60 }} placeholder="—" />
                                      <span style={{ fontSize: 10, color: '#94a3b8' }}>/{sub.max_internal}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <input type="checkbox"
                            checked={getEdit(st.id, selectedExam.subjects_config[0]?.subject_id ?? '').absent || false}
                            disabled={selectedExam.status === 'locked'}
                            onChange={e => {
                              selectedExam.subjects_config.forEach(sub =>
                                setEdit(st.id, sub.subject_id, 'absent', e.target.checked)
                              );
                            }}
                            style={{ accentColor: '#dc2626', width: 16, height: 16, cursor: 'pointer' }}
                          />
                        </td>
                        {/* Remarks — separate column */}
                        <td style={{ ...tdStyle, padding: '8px 12px' }}>
                          <input
                            value={resultOverrides[st.id]?.remarks ?? ''}
                            onChange={e => setResultOverrides(prev => ({ ...prev, [st.id]: { ...prev[st.id], remarks: e.target.value } }))}
                            placeholder="Add remarks…"
                            disabled={selectedExam.status === 'locked'}
                            style={{ ...markInput, width: 130, fontSize: 11, padding: '5px 8px' }}
                          />
                        </td>
                        {/* Result — separate column */}
                        <td style={{ ...tdStyle, padding: '8px 12px' }}>
                          <select
                            value={resultOverrides[st.id]?.result ?? ''}
                            onChange={e => setResultOverrides(prev => ({ ...prev, [st.id]: { ...prev[st.id], result: e.target.value } }))}
                            disabled={selectedExam.status === 'locked'}
                            style={{ ...markInput, width: 130, fontSize: 11, padding: '5px 8px', cursor: 'pointer' }}
                          >
                            <option value="">Auto-detect</option>
                            <option value="PASS">PASS</option>
                            <option value="FAIL">FAIL</option>
                            <option value="PROMOTED">PROMOTED</option>
                            <option value="NOT PROMOTED">NOT PROMOTED</option>
                            <option value="DETAINED">DETAINED</option>
                            <option value="RESULT WITHHELD">RESULT WITHHELD</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   TAB 3 — REPORT CARD
════════════════════════════════════════════════════ */
function ReportTab({ schoolId }: { schoolId: string | null }) {
  const { school } = useSchoolInfo(schoolId);
  const { currentSession } = useErpClasses(schoolId);
  const { exams } = useExams(schoolId, currentSession?.id);
  const lockedExams = exams.filter(e => e.status === 'locked' || e.status === 'published');

  const [selectedExamGroup, setSelectedExamGroup] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');

  const uniqueExamNames = Array.from(new Set(lockedExams.map(e => e.name)));
  const availableClassesForGroup = lockedExams.filter(e => e.name === selectedExamGroup);

  const selectedExam = exams.find(e => e.id === selectedExamId) ?? null;

  const { students } = useStudents(schoolId);
  const classStudents = useMemo(() => {
    if (!selectedExam) return [];
    return students.filter(s =>
      s.current_class_id === selectedExam.class_id &&
      (!selectedExam.section || s.current_section === selectedExam.section)
    ).sort((a, b) => (a.roll_number ?? '').localeCompare(b.roll_number ?? ''));
  }, [students, selectedExam]);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [studentResultData, setStudentResultData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('default');

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  const loadReport = async () => {
    if (!schoolId || !selectedExamId || !selectedStudentId) return alert('Select exam and student');
    setLoading(true);
    setReportData(null);
    setStudentResultData(null);
    try {
      const [data, results] = await Promise.all([
        getStudentReport({ school_id: schoolId, exam_id: selectedExamId, student_id: selectedStudentId }),
        getExamStudentResults(schoolId, selectedExamId),
      ]);
      setReportData(data);
      const myResult = results.find(r => r.student_id === selectedStudentId) ?? null;
      setStudentResultData(myResult);
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    setIsPrinting(true);
  };

  const student = students.find(s => s.id === selectedStudentId);

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={labelStyle}>Select Exam</label>
          <select value={selectedExamGroup} onChange={e => { setSelectedExamGroup(e.target.value); setSelectedExamId(''); setReportData(null); }} style={inputStyle}>
            <option value="">— Choose exam —</option>
            {uniqueExamNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={labelStyle}>Class & Section</label>
          <select value={selectedExamId} onChange={e => { setSelectedExamId(e.target.value); setReportData(null); }} disabled={!selectedExamGroup} style={inputStyle}>
            <option value="">— Choose class —</option>
            {availableClassesForGroup.map(e => <option key={e.id} value={e.id}>Class {e.erp_classes?.name}{e.section ? ` (${e.section})` : ''}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label style={labelStyle}>Select Student</label>
          <select value={selectedStudentId} onChange={e => { setSelectedStudentId(e.target.value); setReportData(null); }} style={inputStyle} disabled={!selectedExam}>
            <option value="">— Choose student —</option>
            {classStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} (Roll: {s.roll_number ?? '—'})</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={labelStyle}>Design Template</label>
          <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} style={inputStyle}>
            <option value="default">Default ERP Design</option>
            {/* Map through installed modules that are relevant */}
            {/* For now, we show the Premium one we just created if any app is installed */}
            <option value="premium">Premium A4 Module</option>
          </select>
        </div>
        <button onClick={loadReport} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
          background: '#7c3aed', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={14} />}
          Generate
        </button>
        {reportData && (
          <button onClick={handlePrint} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
            background: '#0f172a', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Printer size={14} /> Print / PDF
          </button>
        )}
      </div>

      {reportData && selectedExam && student && (
        <ReportCard
          school={school}
          exam={selectedExam}
          student={student}
          marks={reportData.marks}
          allStudentMarks={[]}
          studentResult={studentResultData}
          totalStudentsInClass={classStudents.length}
        />
      )}

      {/* Printing Portal */}
      {isPrinting && reportData && selectedExam && student && createPortal(
        <div id="print-portal">
          <div style={{ padding: '5mm', background: '#fff' }}>
            <div style={{ width: '200mm', margin: '0 auto', background: '#fff', overflow: 'hidden' }}>
              <ReportCard
                school={school}
                exam={selectedExam}
                student={student}
                marks={reportData.marks}
                allStudentMarks={[]}
                studentResult={studentResultData}
                totalStudentsInClass={classStudents.length}
              />
            </div>
          </div>
          <style>{`
            @page { size: A4 portrait; margin: 0; }
            .print-report { border-radius: 4px !important; }
            img { display: block; }
          `}</style>
        </div>,
        document.body
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   TAB 4 — REPORT CARD GENERATOR
════════════════════════════════════════════════════ */
function GeneratorTab({ schoolId }: { schoolId: string | null }) {
  const { school } = useSchoolInfo(schoolId);
  const { currentSession } = useErpClasses(schoolId);
  const { exams } = useExams(schoolId, currentSession?.id);
  const lockedExams = exams.filter(e => e.status === 'locked' || e.status === 'published');

  const [selectedExamGroup, setSelectedExamGroup] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('default');

  const uniqueExamNames = Array.from(new Set(lockedExams.map(e => e.name)));
  const availableClassesForGroup = lockedExams.filter(e => e.name === selectedExamGroup);

  const selectedExam = exams.find(e => e.id === selectedExamId) ?? null;

  const { students } = useStudents(schoolId);
  const classStudents = useMemo(() => {
    if (!selectedExam) return [];
    return students.filter(s =>
      s.current_class_id === selectedExam.class_id &&
      (!selectedExam.section || s.current_section === selectedExam.section)
    ).sort((a, b) => (a.roll_number ?? '').localeCompare(b.roll_number ?? ''));
  }, [students, selectedExam]);

  const [reportsData, setReportsData] = useState<any[]>([]);
  const [studentResultsMap, setStudentResultsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  const generateAll = async () => {
    if (!schoolId || !selectedExamId || classStudents.length === 0) return alert('Select exam with students');
    setLoading(true);
    setReportsData([]);
    setProgress(0);
    const results = [];
    try {
      // Also load student result overrides (remarks, result, rank)
      const resultOverrides = await getExamStudentResults(schoolId, selectedExamId);
      const overridesMap: Record<string, any> = {};
      resultOverrides.forEach(r => { overridesMap[r.student_id] = r; });
      setStudentResultsMap(overridesMap);

      for (let i = 0; i < classStudents.length; i++) {
        try {
          const data = await getStudentReport({ school_id: schoolId, exam_id: selectedExamId, student_id: classStudents[i].id });
          if (data) results.push({ student: classStudents[i], marks: data.marks });
        } catch (e) { console.error(e); }
        setProgress(Math.round(((i + 1) / classStudents.length) * 100));
      }
      setReportsData(results);
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const handlePrintAll = () => {
    setIsPrinting(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Select Exam</label>
          <select value={selectedExamGroup} onChange={e => { setSelectedExamGroup(e.target.value); setSelectedExamId(''); setReportsData([]); }} style={inputStyle}>
            <option value="">— Choose exam —</option>
            {uniqueExamNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Class & Section</label>
          <select value={selectedExamId} onChange={e => { setSelectedExamId(e.target.value); setReportsData([]); }} disabled={!selectedExamGroup} style={inputStyle}>
            <option value="">— Choose class —</option>
            {availableClassesForGroup.map(e => <option key={e.id} value={e.id}>Class {e.erp_classes?.name}{e.section ? ` (${e.section})` : ''}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={labelStyle}>Design Template</label>
          <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} style={inputStyle}>
            <option value="default">Default ERP Design</option>
            <option value="premium">Premium A4 Module</option>
          </select>
        </div>
        <button onClick={generateAll} disabled={loading || !selectedExamId || classStudents.length === 0} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
          background: '#7c3aed', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={14} />}
          {loading ? `Generating ${progress}%` : `Generate All (${classStudents.length})`}
        </button>
        {reportsData.length > 0 && (
          <button onClick={handlePrintAll} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
            background: '#0f172a', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Printer size={14} /> Print Batch ({reportsData.length})
          </button>
        )}
      </div>

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          Processing {classStudents.length} report cards... {progress}%
        </div>
      )}

      {!loading && reportsData.length > 0 && selectedExam && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingBottom: 40 }}>
          {reportsData.map((data, idx) => (
            <div key={data.student.id} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: -30, left: 0, fontWeight: 800, color: '#94a3b8' }}>
                #{idx + 1} / {reportsData.length} — {data.student.first_name} {data.student.last_name}
              </div>
              <ReportCard
                school={school}
                exam={selectedExam}
                student={data.student}
                marks={data.marks}
                allStudentMarks={[]}
                studentResult={studentResultsMap[data.student.id] ?? null}
                totalStudentsInClass={classStudents.length}
              />
            </div>
          ))}
        </div>
      )}

      {/* Printing Portal */}
      {isPrinting && reportsData.length > 0 && createPortal(
        <div id="print-portal">
          {reportsData.map((data, idx) => (
            <div key={idx} className="rc-page" style={{ width: '210mm', height: '297mm', background: '#fff', padding: '5mm', margin: '0 auto', pageBreakAfter: 'always', overflow: 'hidden' }}>
              <div style={{ width: '200mm', margin: '0 auto', background: '#fff', overflow: 'hidden' }}>
                <ReportCard
                  school={school}
                  exam={selectedExam!}
                  student={data.student}
                  marks={data.marks}
                  allStudentMarks={[]}
                  studentResult={studentResultsMap[data.student.id] ?? null}
                  totalStudentsInClass={classStudents.length}
                />
              </div>
            </div>
          ))}
          <style>{`
            @page { size: A4 portrait; margin: 0; }
            .print-report { border-radius: 4px !important; }
            img { display: block; }
          `}</style>
        </div>,
        document.body
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Report Card Component ────────────────── */
const ReportCard = React.forwardRef<HTMLDivElement, {
  school: any; exam: ErpExam; student: any; marks: ExamMark[]; allStudentMarks: any[];
  studentResult?: { custom_remarks?: string | null; custom_result?: string | null; rank?: number | null; rank_in_section?: number | null; } | null;
  totalStudentsInClass?: number;
}>(({ school, exam, student, marks, studentResult, totalStudentsInClass }, ref) => {
  const subjects = exam.subjects_config;

  const rows = subjects.map(sub => {
    const m = marks.find(x => x.subject_id === sub.subject_id);
    const theory = m?.theory_marks ?? null;
    const practical = m?.practical_marks ?? null;
    const internal = m?.internal_marks ?? null;
    const absent = m?.is_absent ?? false;
    const maxTotal = sub.max_theory + (sub.max_practical ?? 0) + (sub.max_internal ?? 0);
    const obtained = absent ? 0 : ((theory ?? 0) + (practical ?? 0) + (internal ?? 0));
    const pct = maxTotal > 0 ? Math.round((obtained / maxTotal) * 100) : 0;
    const passed = !absent && obtained >= sub.pass_marks;
    return { sub, theory, practical, internal, absent, maxTotal, obtained, pct, passed };
  });

  const grandMax = rows.reduce((a, r) => a + r.maxTotal, 0);
  const grandObt = rows.reduce((a, r) => a + r.obtained, 0);
  const grandPct = grandMax > 0 ? Math.round((grandObt / grandMax) * 100) : 0;
  const grade = gradeOf(grandPct);
  const result = rows.every(r => r.passed) ? 'PASS' : 'FAIL';
  const className = exam.erp_classes?.name ?? '—';
  const sessionName = exam.erp_academic_sessions?.name ?? '—';

  const hasPractical = rows.some(r => r.sub.max_practical != null);
  const hasInternal = rows.some(r => r.sub.max_internal != null);
  const extraCols = (hasPractical ? 1 : 0) + (hasInternal ? 1 : 0);

  // — inline style helpers
  const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: '1px solid #1a237e', padding: '4px 6px', fontSize: 11,
    fontFamily: "'Arial',sans-serif", verticalAlign: 'middle', color: '#000', ...extra,
  });
  const hdr = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    ...cell(), background: '#dde3f0', fontWeight: 800,
    textAlign: 'center', fontSize: 10, color: '#000', ...extra,
  });
  const sectionTitle = (text: string) => (
    <div style={{
      background: '#dde3f0', padding: '4px 12px', textAlign: 'center',
      borderTop: '2px solid #1a237e', borderBottom: '1px solid #1a237e',
      fontWeight: 900, fontSize: 12, color: '#000', letterSpacing: '0.06em',
    }}>{text}</div>
  );

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="batch-rc-wrapper" style={{
      maxWidth: 860,
      aspectRatio: '200 / 287',
      margin: '0 auto',
      border: '3px solid #e91e63',
      borderRadius: 10,
      padding: 2,
      background: '#fff',
      boxShadow: '0 6px 30px rgba(0,0,0,0.14)',
    }}>
      <div ref={ref} className="print-report" style={{
        padding: '0px',
        background: '#fff',
        border: '3px solid #1a237e',
        borderRadius: 4,
        fontFamily: "'Arial', sans-serif",
        color: '#000',
        display: 'flex',
        flexDirection: 'column',
        height: 'auto',
        minHeight: '280mm', // Ensures the card fills the A4 page
        maxHeight: '290mm', // Safety limit
        overflow: 'hidden',
      }}>

        {/* ── School Header ──────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 18px', borderBottom: '3px solid #1a237e',
        }}>
          {/* Logo */}
          <div style={{
            width: 80, height: 80, flexShrink: 0,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'transparent',
          }}>
            {school?.logo_url
              ? <img src={school.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 34, fontWeight: 900, color: '#000' }}>{(school?.name ?? 'S').charAt(0)}</span>}
          </div>

          {/* School name & address */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#c62828', letterSpacing: '0.03em', lineHeight: 1.15 }}>
              {(school?.name ?? 'SCHOOL NAME').toUpperCase()}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#000', marginTop: 4 }}>
              {[school?.address, school?.board_affiliation].filter(Boolean).join(', ') || 'Address, City'}
            </div>
            {school?.affiliation_number && (
              <div style={{ fontSize: 11, color: '#000', marginTop: 2 }}>
                Affiliation No: {school.affiliation_number}
              </div>
            )}
          </div>

          {/* Student photo + barcode */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 76, height: 92, flexShrink: 0, border: '2px solid #1a237e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#f5f5f5', overflow: 'hidden',
            }}>
              {student?.photo_url
                ? <img src={student.photo_url} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 11, color: '#000', textAlign: 'center', padding: 4 }}>Photo</span>}
            </div>
            {/* Barcode encoding admission number */}
            <img
              src={`https://barcodeapi.org/api/128/${encodeURIComponent(student.admission_number ?? 'NA')}`}
              alt="Barcode"
              style={{ width: 90, height: 28, display: 'block' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>

        {/* ── Exam Title Banner ────── */}
        <div style={{ background: '#fff', padding: '8px 20px', textAlign: 'center', borderBottom: '2px solid #1a237e', borderTop: '2px solid #1a237e' }}>
          <span style={{ color: '#1565c0', fontWeight: 900, fontSize: 16, letterSpacing: '0.06em' }}>
            {exam.name.toUpperCase()}
          </span>
          <span style={{ color: '#000', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em' }}>
            {' '}— REPORT CARD — {sessionName.toUpperCase()}
          </span>
        </div>

        {/* ── Student Info Row ───── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #1a237e' }}>
          <div style={{ padding: '7px 16px', borderRight: '1px solid #1a237e', fontSize: 13 }}>
            <b>NAME</b><span style={{ marginLeft: 10 }}>: {student.first_name} {student.last_name}</span>
          </div>
          <div style={{ padding: '7px 16px', fontSize: 13, display: 'flex', gap: 24 }}>
            <span><b>CLASS</b> : {className}</span>
            {exam.section && <span><b>SEC.</b> : {exam.section}</span>}
          </div>
          <div style={{ padding: '7px 16px', borderRight: '1px solid #1a237e', borderTop: '1px solid #1a237e', fontSize: 13 }}>
            <b>ROLL NO.</b><span style={{ marginLeft: 10 }}>: {student.roll_number ?? '—'}</span>
          </div>
          <div style={{ padding: '6px 16px', borderTop: '1px solid #1a237e', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><b>ADM. NO.</b><span style={{ marginLeft: 10 }}>: {student.admission_number ?? '—'}</span></span>
            {/* Show rank if student passed */}
            {result === 'PASS' && studentResult?.rank ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 800, color: '#92400e' }}>
                🏆 RANK: {studentResult.rank}{totalStudentsInClass ? ` / ${totalStudentsInClass}` : ''}
                {studentResult.rank_in_section && studentResult.rank_in_section !== studentResult.rank ? ` (Sec: ${studentResult.rank_in_section})` : ''}
              </span>
            ) : null}
          </div>
        </div>

        {/* ── Scholastic Areas ───── */}
        {sectionTitle('SCHOLASTIC AREAS')}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={hdr({ textAlign: 'left', paddingLeft: 10, width: '26%' })}>SUBJECT</th>
              <th style={hdr()}>THEORY<br /><span style={{ fontWeight: 400, fontSize: 10 }}>({rows[0]?.sub.max_theory ?? 100})</span></th>
              {hasPractical && <th style={hdr()}>PRACTICAL<br /><span style={{ fontWeight: 400, fontSize: 10 }}>(Max)</span></th>}
              {hasInternal && <th style={hdr()}>INTERNAL<br /><span style={{ fontWeight: 400, fontSize: 10 }}>(Max)</span></th>}
              <th style={hdr()}>TOTAL<br /><span style={{ fontWeight: 400, fontSize: 10 }}>({grandMax / Math.max(rows.length, 1)})</span></th>
              <th style={hdr()}>%</th>
              <th style={hdr()}>GRADE</th>
              <th style={hdr()}>RESULT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.sub.subject_id} style={{ background: i % 2 === 0 ? '#fff' : '#f3f4ff' }}>
                <td style={cell({ textAlign: 'left', paddingLeft: 10, fontWeight: 600 })}>{r.sub.subject_name}</td>
                <td style={cell({ textAlign: 'center' })}>{r.absent ? 'AB' : (r.theory ?? '—')}</td>
                {hasPractical && (
                  <td style={cell({ textAlign: 'center' })}>
                    {r.sub.max_practical != null ? (r.absent ? 'AB' : (r.practical ?? '—')) : '—'}
                  </td>
                )}
                {hasInternal && (
                  <td style={cell({ textAlign: 'center' })}>
                    {r.sub.max_internal != null ? (r.absent ? 'AB' : (r.internal ?? '—')) : '—'}
                  </td>
                )}
                <td style={cell({ textAlign: 'center', fontWeight: 700 })}>{r.absent ? 'AB' : `${r.obtained} / ${r.maxTotal}`}</td>
                <td style={cell({ textAlign: 'center' })}>{r.absent ? '—' : `${r.pct}%`}</td>
                <td style={cell({ textAlign: 'center', fontWeight: 700, color: '#000' })}>{r.absent ? 'AB' : gradeOf(r.pct)}</td>
                <td style={cell({ textAlign: 'center', fontWeight: 700, color: '#000' })}>{r.absent ? 'AB' : r.passed ? 'PASS' : 'FAIL'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#dde3f0' }}>
              <td style={hdr({ textAlign: 'left', paddingLeft: 10 })}>GRAND TOTAL</td>
              <td colSpan={1 + extraCols} style={cell({ textAlign: 'center', fontWeight: 800, fontSize: 14 })}>{grandObt} / {grandMax}</td>
              <td style={cell({ textAlign: 'center', fontWeight: 700 })}>{grandPct.toFixed(2)}%</td>
              <td style={cell({ textAlign: 'center', fontWeight: 800, fontSize: 15, color: '#000' })}>{grade}</td>
              <td style={cell({ textAlign: 'center', fontWeight: 800, color: '#000' })}>{result}</td>
            </tr>
          </tfoot>
        </table>

        {/* ── Conduct + Remarks ──── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '2px solid #1a237e' }}>
          {/* Conduct */}
          <div style={{ borderRight: '2px solid #1a237e' }}>
            {sectionTitle('CONDUCT')}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={hdr()}>EXAM</th>
                <th style={hdr()}>CONDUCT</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td style={cell({ textAlign: 'center' })}>{exam.name}</td>
                  <td style={cell({ textAlign: 'center', fontWeight: 700 })}>GOOD</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Remarks */}
          <div>
            {sectionTitle('REMARKS')}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={hdr()}>EXAM</th>
                <th style={hdr()}>REMARKS</th>
              </tr></thead>
              <tbody>
                <tr>
                  <td style={cell({ textAlign: 'center' })}>{exam.name}</td>
                  <td style={cell({ textAlign: 'center' })}>
                    <div contentEditable suppressContentEditableWarning style={{ outline: 'none', cursor: 'text', minHeight: '1em' }}>
                      {studentResult?.custom_remarks || (grandPct >= 75 ? 'Excellent — Keep it up!' : grandPct >= 60 ? 'Good performance.' : grandPct >= 45 ? 'Needs improvement.' : 'Work hard to improve!')}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={cell({ textAlign: 'center', fontWeight: 700 })}>RESULT</td>
                  <td style={cell({ textAlign: 'center', fontWeight: 800, color: result === 'PASS' ? '#15803d' : '#dc2626' })}>
                    <div contentEditable suppressContentEditableWarning style={{ outline: 'none', cursor: 'text', minHeight: '1em' }}>
                      {studentResult?.custom_result || (result === 'PASS' ? 'PROMOTED' : 'NOT PROMOTED')}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Attendance + Subject Performance ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '2px solid #1a237e' }}>

          {/* Attendance */}
          <div style={{ borderRight: '2px solid #1a237e' }}>
            <div style={{
              background: '#dde3f0', padding: '5px 12px', textAlign: 'center',
              borderBottom: '1px solid #1a237e',
              fontWeight: 900, fontSize: 13, color: '#000', letterSpacing: '0.06em',
            }}>ATTENDANCE</div>
            {(() => {
              const total = rows.length;
              const absent = rows.filter(r => r.absent).length;
              const present = total - absent;
              const pct = total > 0 ? Math.round((present / total) * 100) : 0;
              return (
                <div style={{ padding: '10px 16px', fontSize: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {[
                        ['Total Subjects', total],
                        ['Present', present],
                        ['Absent', absent],
                        ['Attendance %', `${pct}%`],
                      ].map(([label, val]) => (
                        <tr key={String(label)} style={{ borderBottom: '1px solid #e0e0e0' }}>
                          <td style={{ padding: '4px 6px', fontWeight: 600 }}>{label}</td>
                          <td style={{
                            padding: '4px 6px', textAlign: 'right', fontWeight: 700,
                            color: label === 'Absent' && Number(val) > 0 ? '#b71c1c' : '#000'
                          }}>
                            {val}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* Subject-wise Performance Line Chart */}
          <div>
            <div style={{
              background: '#dde3f0', padding: '3px 12px', textAlign: 'center',
              borderBottom: '1px solid #1a237e',
              fontWeight: 900, fontSize: 13, color: '#000', letterSpacing: '0.06em',
            }}>SUBJECT WISE PERFORMANCE</div>
            {(() => {
              const colors = ['#e53935', '#8e24aa', '#1e88e5', '#00897b', '#43a047', '#fb8c00', '#f4511e', '#6d4c41', '#0288d1', '#c0ca33'];
              const W = 320, H = 110; /* Tightened chart height */
              const pad = { top: 12, right: 15, bottom: 45, left: 65 }; // reduced bottom padding
              const pW = W - pad.left - pad.right;
              const pH = H - pad.top - pad.bottom;
              const n = rows.length;
              const pts = rows.map((r, i) => ({
                x: pad.left + (n > 1 ? (i / (n - 1)) * pW : pW / 2),
                y: pad.top + (1 - (r.absent ? 0 : r.pct) / 100) * pH,
                pct: r.absent ? 0 : r.pct,
                label: r.sub.subject_name,
                color: colors[i % colors.length],
              }));
              const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
              // Y-axis gridlines
              const yTicks = [0, 50, 100]; // simplified ticks
              return (
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                  {/* Grid */}
                  {yTicks.map(v => {
                    const y = pad.top + (1 - v / 100) * pH;
                    return (
                      <g key={v}>
                        <line x1={pad.left} y1={y} x2={pad.left + pW} y2={y} stroke="#e0e0e0" strokeWidth="0.8" />
                        <text x={pad.left - 4} y={y + 3} fontSize="6" textAnchor="end" fill="#555">{v}</text>
                      </g>
                    );
                  })}
                  {/* Line */}
                  <path d={linePath} fill="none" stroke="#1e88e5" strokeWidth="1.5" strokeLinejoin="round" />
                  {/* Dots + labels */}
                  {pts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="4" fill={p.color} stroke="#fff" strokeWidth="1" />
                      <text x={p.x} y={H - pad.bottom + 12} fontSize="6" textAnchor="end" fill={p.color} fontWeight="700"
                        transform={`rotate(-45, ${p.x + 2}, ${H - pad.bottom + 12})`}>{p.label}</text>
                      <text x={p.x} y={p.y - 6} fontSize="6" textAnchor="middle" fill={p.color}>{p.pct}%</text>
                    </g>
                  ))}
                  {/* Axes */}
                  <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + pH} stroke="#333" strokeWidth="1" />
                  <line x1={pad.left} y1={pad.top + pH} x2={pad.left + pW} y2={pad.top + pH} stroke="#333" strokeWidth="1" />
                </svg>
              );
            })()}
          </div>
        </div>

        {/* ── QR Code (verification) ── */}
        <div style={{
          borderTop: '2px solid #1a237e', padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ fontSize: 11, color: '#000', maxWidth: 420 }}>
            <b>VERIFICATION</b><br />
            Scan the QR code to verify the authenticity of this report card.
            QR encodes: student name, admission no., exam, class, percentage, result, and school.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ padding: 4, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(
                  JSON.stringify({
                    school: school?.name ?? '',
                    student: `${student.first_name} ${student.last_name}`,
                    adm: student.admission_number,
                    exam: exam.name,
                    class: className,
                    section: exam.section ?? '',
                    session: sessionName,
                    total: `${grandObt}/${grandMax}`,
                    pct: `${grandPct}%`,
                    grade: grade,
                    result: result,
                  })
                )}`}
                alt="QR Code"
                style={{ width: 60, height: 60, display: 'block' }}
              />
            </div>
            <span style={{ fontSize: 9, color: '#000' }}>Verify Report Card</span>
          </div>
        </div>

        {/* ── Date line ────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '9px 20px', borderTop: '2px solid #1a237e',
          fontSize: 12, fontWeight: 600, color: '#000',
        }}>
          <span>Issue Date : {today}</span>
          <span>Generated by LearnBee ERP</span>
        </div>

        {/* ── Signatures ──────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '2px solid #1a237e' }}>
          {["CLASS TEACHER'S", "HEADMISTRESS'S", "PARENT'S / GUARDIAN'S"].map((role, i) => (
            <div key={role} style={{
              padding: '35px 16px 14px', textAlign: 'center', // Increased top padding for signatures
              borderRight: i < 2 ? '1px solid #1a237e' : 'none',
            }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: 11, fontWeight: 700, color: '#000' }}>{role}</div>
            </div>
          ))}
        </div>

        {/* spacer to push grade scale to bottom on print */}
        <div className="rc-spacer" style={{ flex: 1, minHeight: '10px' }} />

        {/* ── Grade Scale ─────── */}
        <div style={{ background: '#dde3f0', borderTop: '2px solid #1a237e', borderBottom: '2px solid #1a237e', padding: '3px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 2 }}>
            Distinction : 75%&nbsp;&nbsp;&nbsp;&nbsp;1st Class : 60%&nbsp;&nbsp;&nbsp;&nbsp;2nd Class : 50%
          </div>
          <div style={{ fontSize: 10, color: '#000' }}>
            Grade :&nbsp; A+ above 75%,&nbsp; B+ above 70%,&nbsp; B- above 55%,&nbsp; C+ above 45%,&nbsp; C- above 35%,&nbsp; D below 35%
          </div>
        </div>

      </div>
    </div>
  );
});
ReportCard.displayName = 'ReportCard';

/* ─── Shared styles ──────────────────────────────── */
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
  borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none',
  color: '#1e293b', background: '#fff', boxSizing: 'border-box',
};
const cellInput: React.CSSProperties = {
  width: '100%', padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6,
  fontSize: 12, fontFamily: 'inherit', outline: 'none', color: '#1e293b',
  background: '#fff', textAlign: 'center',
};
const markInput: React.CSSProperties = {
  padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 6,
  fontSize: 12, fontFamily: 'inherit', outline: 'none', color: '#1e293b',
  background: '#fff', textAlign: 'center',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 700,
  color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '11px 16px', fontSize: 13, color: '#475569',
};



