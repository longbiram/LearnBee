import { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useErpClasses, useErpSubjects, useSchoolInfo, getRoutine as getRoutineDb, saveRoutine as saveRoutineDb } from '../../hooks/useErpAcademics';

import { Plus, Save, Trash2, CheckCircle, X, BookOpen, Settings, Printer } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────
interface Period {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

type CellValue = string | null;
type Timetable = Record<string, CellValue[]>;

// ─── Constants ─────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_PERIODS: Period[] = [
  { id: 'p1',    label: 'P1',    startTime: '08:00', endTime: '08:45', isBreak: false },
  { id: 'p2',    label: 'P2',    startTime: '08:45', endTime: '09:30', isBreak: false },
  { id: 'p3',    label: 'P3',    startTime: '09:30', endTime: '10:15', isBreak: false },
  { id: 'brk',   label: 'Break', startTime: '10:15', endTime: '10:30', isBreak: true  },
  { id: 'p4',    label: 'P4',    startTime: '10:30', endTime: '11:15', isBreak: false },
  { id: 'p5',    label: 'P5',    startTime: '11:15', endTime: '12:00', isBreak: false },
  { id: 'lunch', label: 'Lunch', startTime: '12:00', endTime: '12:30', isBreak: true  },
  { id: 'p6',    label: 'P6',    startTime: '12:30', endTime: '13:15', isBreak: false },
  { id: 'p7',    label: 'P7',    startTime: '13:15', endTime: '14:00', isBreak: false },
];

const CHIP_COLORS = [
  '#ede9fe', '#dbeafe', '#dcfce7', '#fef9c3', '#cffafe',
  '#fce7f3', '#fee2e2', '#f3e8ff', '#ecfdf5', '#fff7ed',
  '#e0f2fe', '#fdf4ff', '#f0fdf4', '#fefce8', '#f0f9ff',
];

const PERIODS_KEY = 'routine_periods_config';

// ─── Storage ────────────────────────────────────────────────────
function rKey(classId: string, section: string) {
  return `routine_${classId}_${section || 'all'}`;
}

function loadPeriods(): Period[] {
  try {
    const r = localStorage.getItem(PERIODS_KEY);
    if (r) return JSON.parse(r) as Period[];
  } catch { /**/ }
  return DEFAULT_PERIODS;
}

function savePeriods(p: Period[]) {
  localStorage.setItem(PERIODS_KEY, JSON.stringify(p));
}

function loadRoutine(classId: string, section: string, periods: Period[]): Timetable {
  try {
    const r = localStorage.getItem(rKey(classId, section));
    if (r) {
      const saved = JSON.parse(r) as Timetable;
      const tt: Timetable = {};
      DAYS.forEach(d => { tt[d] = periods.map((_, i) => saved[d]?.[i] ?? null); });
      return tt;
    }
  } catch { /**/ }
  const tt: Timetable = {};
  DAYS.forEach(d => { tt[d] = periods.map(() => null); });
  return tt;
}

function saveRoutine(classId: string, section: string, tt: Timetable) {
  localStorage.setItem(rKey(classId, section), JSON.stringify(tt));
}

function genId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Format 24h → 12h AM/PM ────────────────────────────────────
function fmt(t: string) {
  if (!t) return t;
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}

// ─── Period Editor Modal ────────────────────────────────────────
function PeriodEditor({
  period, onSave, onDelete, onClose, canDelete,
}: {
  period: Period;
  onSave: (p: Period) => void;
  onDelete: () => void;
  onClose: () => void;
  canDelete: boolean;
}) {
  const [form, setForm] = useState<Period>({ ...period });
  const set = <K extends keyof Period>(k: K, v: Period[K]) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4F8EF7)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: '#fff', fontWeight: 800 }}>Edit Period</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Adjust label, timing and type</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 8, padding: 6, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Period Label</label>
            <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. P1, Break, Lunch"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Time</label>
              <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)}
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Time</label>
              <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)}
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', border: `1px solid ${form.isBreak ? '#7c3aed' : '#e2e8f0'}`, borderRadius: 10, background: form.isBreak ? '#f5f3ff' : '#fff', transition: 'all 0.15s' }}>
            <input type="checkbox" checked={form.isBreak} onChange={e => set('isBreak', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#7c3aed' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Mark as Break / Recess</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Break rows are non-assignable in the grid</div>
            </div>
          </label>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {canDelete ? (
            <button onClick={onDelete} style={{ padding: '8px 14px', background: '#fee2e2', border: 'none', borderRadius: 8, color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={13} /> Remove
            </button>
          ) : <div />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 8, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => { onSave(form); onClose(); }}
              style={{ padding: '8px 20px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cell Picker Modal ──────────────────────────────────────────
function CellPicker({
  subjects, current, onSelect, onClose, colorMap,
}: {
  subjects: string[];
  current: string | null;
  onSelect: (s: string | null) => void;
  onClose: () => void;
  colorMap: Record<string, string>;
}) {
  const [search, setSearch] = useState('');
  const filtered = subjects.filter(s => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, color: '#1e293b', fontWeight: 700 }}>Assign Subject</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Pick a subject for this period</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects…"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div style={{ padding: 12, maxHeight: 280, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button onClick={() => onSelect(null)}
            style={{ padding: '6px 14px', borderRadius: 20, border: '1px dashed #cbd5e1', background: current === null ? '#f1f5f9' : '#fff', fontSize: 12, color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>
            — Clear
          </button>
          {filtered.length === 0 && <p style={{ fontSize: 13, color: '#94a3b8', padding: '8px 4px' }}>No subjects found.</p>}
          {filtered.map(sub => {
            const isActive = current === sub;
            const bg = colorMap[sub] ?? '#f1f5f9';
            return (
              <button key={sub} onClick={() => onSelect(sub)}
                style={{ padding: '6px 14px', borderRadius: 20, border: isActive ? '2px solid #7c3aed' : '1px solid #e2e8f0', background: bg, fontSize: 12, fontWeight: 600, color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: isActive ? '0 0 0 2px #7c3aed33' : 'none' }}>
                {isActive && <CheckCircle size={12} color="#7c3aed" />}{sub}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────
export default function Routine() {
  const { schoolId } = useAuth();
  const { classes, currentSession, loading: clsLoading } = useErpClasses(schoolId);

  // School info for print header — uses proper auth'd hook
  const { school } = useSchoolInfo(schoolId);
  const schoolName = school?.name ?? 'School';
  const schoolLogo = school?.logo_url ?? null;

  // Periods (school-wide)
  const [periods, setPeriods] = useState<Period[]>(() => loadPeriods());
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);

  // Class / Section
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [saved, setSaved] = useState(false);

  const selectedClass = classes.find(c => c.id === selectedClassId) ?? null;
  const sections = selectedClass?.sections ?? [];
  const hasSection = sections.length > 0;

  useEffect(() => { setSelectedSection(''); }, [selectedClassId]);

  // Subjects
  const { subjects } = useErpSubjects(schoolId, selectedClassId || null);
  const subjectNames = useMemo(() => subjects.map(s => s.name), [subjects]);
  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    subjectNames.forEach((n, i) => { m[n] = CHIP_COLORS[i % CHIP_COLORS.length]; });
    return m;
  }, [subjectNames]);

  // Timetable
  const [timetable, setTimetable] = useState<Timetable>(() => {
    const tt: Timetable = {};
    DAYS.forEach(d => { tt[d] = DEFAULT_PERIODS.map(() => null); });
    return tt;
  });

  const rkKey = selectedClassId + '|' + selectedSection;
  const [dbLoading, setDbLoading] = useState(false);

  useEffect(() => {
    if (!selectedClassId) return;
    if (currentSession) {
      setDbLoading(true);
      getRoutineDb({ school_id: schoolId, session_id: currentSession.id, class_id: selectedClassId, section: selectedSection || null })
        .then((data: any) => {
          if (data && data.timetable_data && Object.keys(data.timetable_data).length > 0) {
            setTimetable(data.timetable_data);
            if (data.periods_data && data.periods_data.length > 0) {
              setPeriods(data.periods_data);
            }
          } else {
            setTimetable(loadRoutine(selectedClassId, selectedSection, periods));
          }
        })
        .catch(console.error)
        .finally(() => { setDbLoading(false); setSaved(false); });
    } else {
      setTimetable(loadRoutine(selectedClassId, selectedSection, periods));
      setSaved(false);
    }
  }, [rkKey, currentSession, schoolId]);

  // Resize timetable when period count changes
  useEffect(() => {
    setTimetable(prev => {
      const tt: Timetable = {};
      DAYS.forEach(d => { tt[d] = periods.map((_, i) => prev[d]?.[i] ?? null); });
      return tt;
    });
  }, [periods.length]);

  // Period CRUD
  const handlePeriodSave = useCallback((updated: Period) => {
    setPeriods(prev => { const n = prev.map(p => p.id === updated.id ? updated : p); savePeriods(n); return n; });
  }, []);

  const handlePeriodDelete = useCallback((id: string) => {
    const idx = periods.findIndex(p => p.id === id);
    setPeriods(prev => { const n = prev.filter(p => p.id !== id); savePeriods(n); return n; });
    setTimetable(prev => {
      const tt: Timetable = {};
      DAYS.forEach(d => { const a = [...(prev[d] ?? [])]; a.splice(idx, 1); tt[d] = a; });
      return tt;
    });
    setEditingPeriod(null);
  }, [periods]);

  const handleAddPeriod = () => {
    const count = periods.filter(p => !p.isBreak).length + 1;
    const np: Period = { id: genId(), label: `P${count}`, startTime: '14:00', endTime: '14:45', isBreak: false };
    setPeriods(prev => { const n = [...prev, np]; savePeriods(n); return n; });
  };

  // Cell picker
  const [pickerCell, setPickerCell] = useState<{ day: string; periodIdx: number } | null>(null);

  const handleSelect = (sub: string | null) => {
    if (!pickerCell) return;
    setTimetable(prev => {
      const updated = { ...prev, [pickerCell.day]: [...(prev[pickerCell.day] ?? [])] };
      updated[pickerCell.day][pickerCell.periodIdx] = sub;
      return updated;
    });
    setPickerCell(null);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedClassId) return;
    
    if (currentSession) {
      try {
        await saveRoutineDb({
          school_id: schoolId,
          session_id: currentSession.id,
          class_id: selectedClassId,
          section: selectedSection || null,
          timetable_data: timetable,
          periods_data: periods
        });
      } catch (e: any) {
        alert("Failed to save to database: " + e.message);
      }
    }

    saveRoutine(selectedClassId, selectedSection, timetable);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearAll = () => {
    if (!confirm('Clear entire timetable for this class/section?')) return;
    const empty: Timetable = {};
    DAYS.forEach(d => { empty[d] = periods.map(() => null); });
    setTimetable(empty);
    setSaved(false);
  };

  // ── Print ────────────────────────────────────────────────────
  const handlePrint = () => {
    const className = selectedClass?.name ?? 'Class';
    const sectionLabel = selectedSection
      ? ` \u2014 Section ${selectedSection}`
      : hasSection ? ' \u2014 All Sections' : '';
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const dayHeadCells = DAYS.map(d =>
      `<th style="padding:10px 6px;text-align:center;">${d}</th>`
    ).join('');

    const bodyRows = periods.map((period, pi) => {
      const bg = period.isBreak ? '#f8f7ff' : '#ffffff';
      const periodCell = `<td style="padding:8px 10px;white-space:nowrap;background:#faf9ff;vertical-align:middle;">
          <div style="font-size:11px;font-weight:800;color:${period.isBreak ? '#a78bfa' : '#1e293b'};">${period.label}</div>
          <div style="font-size:9px;color:#94a3b8;margin-top:1px;">${fmt(period.startTime)}&ndash;${fmt(period.endTime)}</div>
        </td>`;
      const dayCells = DAYS.map(day => {
        if (period.isBreak) {
          return `<td style="text-align:center;padding:6px;background:#f8f7ff;"><span style="font-size:10px;color:#a78bfa;font-style:italic;">${period.label}</span></td>`;
        }
        const sub = timetable[day]?.[pi] ?? null;
        if (!sub) return `<td style="padding:6px;text-align:center;"><span style="color:#cbd5e1;font-size:14px;">&mdash;</span></td>`;
        const chipBg = colorMap[sub] ?? '#f1f5f9';
        return `<td style="padding:5px 6px;text-align:center;vertical-align:middle;"><span style="display:inline-block;padding:4px 9px;background:${chipBg};border-radius:6px;font-size:10px;font-weight:700;color:#1e293b;border:1px solid rgba(0,0,0,0.07);white-space:nowrap;">${sub}</span></td>`;
      }).join('');
      return `<tr style="background:${bg};">${periodCell}${dayCells}</tr>`;
    }).join('');

    // Subject legend
    const legendItems = subjectNames.map(s => {
      const bg = colorMap[s] ?? '#f1f5f9';
      return `<span style="display:inline-block;padding:3px 10px;background:${bg};border-radius:12px;font-size:9px;font-weight:700;color:#1e293b;border:1px solid rgba(0,0,0,0.07);margin:2px;">${s}</span>`;
    }).join('');

    // Logo — real image if saved, else emoji box fallback
    const logoHtml = schoolLogo
      ? `<img src="${schoolLogo}" alt="School Logo" style="width:58px;height:58px;object-fit:contain;border-radius:10px;background:rgba(255,255,255,0.15);padding:4px;border:1.5px solid rgba(255,255,255,0.3);flex-shrink:0;" />`
      : `<div style="width:58px;height:58px;background:rgba(255,255,255,0.18);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;border:1.5px solid rgba(255,255,255,0.25);">&#127979;</div>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Timetable &mdash; ${className}${sectionLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 landscape; margin: 8mm 10mm; }
    body {
      font-family: 'Segoe UI', system-ui, Arial, sans-serif;
      background: #fff;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Outer page border (all sides) ── */
    .page-border {
      border: 3px solid #7c3aed;
      border-radius: 14px;
      padding: 14px;
      position: relative;
    }
    /* Inner decorative border ring */
    .page-border::after {
      content: '';
      position: absolute;
      inset: 5px;
      border: 1px solid #ddd6fe;
      border-radius: 10px;
      pointer-events: none;
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%);
      border-radius: 12px;
      padding: 14px 20px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .school-name { font-size: 20px; font-weight: 900; letter-spacing: -0.3px; line-height: 1.1; }
    .school-sub { font-size: 10px; opacity: 0.75; margin-top: 2px; }
    .class-label {
      font-size: 12px; font-weight: 600; opacity: 0.9;
      margin-top: 5px;
      background: rgba(255,255,255,0.18);
      padding: 3px 12px; border-radius: 20px;
      display: inline-block;
    }
    .header-right { text-align: right; }
    .header-tag { font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.1em; }
    .header-date { font-size: 12px; font-weight: 700; margin-top: 4px; opacity: 0.9; }
    .header-badge {
      margin-top: 6px; font-size: 10px;
      background: rgba(255,255,255,0.2);
      padding: 2px 10px; border-radius: 20px; display: inline-block;
    }

    /* ── Table wrap ── */
    .tt-wrap {
      border: 2px solid #000;
      border-radius: 10px;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: linear-gradient(to right,#faf5ff,#eff6ff); }
    th, td { border: 2px solid #000; vertical-align: middle; }
    th.period-hdr {
      text-align: left; padding: 10px 12px;
      font-size: 10px; font-weight: 800; color: #6d28d9;
      text-transform: uppercase; letter-spacing: 0.07em;
    }
    thead th { padding: 10px 6px; text-align: center; font-size: 10px; font-weight: 800; color: #6d28d9; text-transform: uppercase; letter-spacing: 0.07em; }
    tbody tr:nth-child(even) { background: #fdfcff; }
    td { border-bottom: 2px solid #000; padding: 4px 6px; }

    /* ── Legend ── */
    .legend { margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
    .legend-title { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-right: 4px; }

    /* ── Footer ── */
    .footer { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; padding: 0 2px; }
    .footer-left { font-size: 9px; color: #94a3b8; }
    .footer-mid { font-size: 10px; color: #7c3aed; font-weight: 800; letter-spacing: 0.05em; }
    .footer-right { font-size: 9px; color: #94a3b8; }

    /* ── Purple gradient divider ── */
    .divider { height: 2px; background: linear-gradient(to right,#7c3aed,#2563eb,transparent); border-radius: 2px; margin: 10px 0; }

    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="page-border">

  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div>
        <div class="school-name">${schoolName}</div>
        <div class="school-sub">Committed to Excellence in Education</div>
        <div class="class-label">&#128203; ${className}${sectionLabel} &mdash; Weekly Timetable</div>
      </div>
    </div>
    <div class="header-right">
      <div class="header-tag">&#128197; Academic Routine</div>
      <div class="header-date">Printed: ${dateStr}</div>
      <div class="header-badge">${periods.filter(p => !p.isBreak).length} Teaching Periods / Day</div>
    </div>
  </div>

  <div class="tt-wrap">
    <table>
      <thead>
        <tr>
          <th class="period-hdr">Period / Time</th>
          ${dayHeadCells}
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>

  ${subjectNames.length > 0 ? `
  <div class="legend">
    <span class="legend-title">Subjects:</span>
    ${legendItems}
  </div>` : ''}

  <div class="divider"></div>

  <div class="footer">
    <span class="footer-left">${schoolName} &nbsp;&bull;&nbsp; Academic Routine</span>
    <span class="footer-mid">&#10022; LearnBee ERP &#10022;</span>
    <span class="footer-right">${className}${sectionLabel}</span>
  </div>

</div>
  <script>window.onload = function () { window.print(); };<\/script>
</body>
</html>`;


    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) { alert('Please allow popups to print the timetable.'); return; }
    win.document.write(html);
    win.document.close();
  };

  const showGrid = !!selectedClassId;

  return (
    <AdminLayout pageTitle="Class Routine / Timetable" pageSubtitle="Create and manage weekly subject schedules">

      {/* Selector bar */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class</label>
          {clsLoading ? (
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Loading…</div>
          ) : (
            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}
              style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', background: '#fff', minWidth: 180 }}>
              <option value="">— Select Class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {selectedClassId && hasSection && (
          <div style={{ minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section</label>
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
              style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, color: '#1e293b', outline: 'none', fontFamily: 'inherit', background: '#fff', minWidth: 140 }}>
              <option value="">— All Sections —</option>
              {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
        )}

        {showGrid && (
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
            {subjectNames.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 380 }}>
                {subjectNames.map(s => (
                  <span key={s} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: colorMap[s], fontWeight: 600, color: '#1e293b', border: '1px solid rgba(0,0,0,0.06)' }}>{s}</span>
                ))}
              </div>
            )}
            <button onClick={handleClearAll}
              style={{ padding: '8px 14px', background: '#fee2e2', border: 'none', borderRadius: 9, fontSize: 12, color: '#dc2626', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={13} /> Clear
            </button>
            <button onClick={handleSave}
              style={{ padding: '8px 18px', background: saved ? '#16a34a' : '#7c3aed', border: 'none', borderRadius: 9, fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }}>
              {saved ? <CheckCircle size={14} /> : <Save size={14} />}
              {saved ? 'Saved!' : 'Save Routine'}
            </button>
            <button onClick={handlePrint}
              style={{ padding: '8px 16px', background: '#0f172a', border: 'none', borderRadius: 9, fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Printer size={14} /> Print
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!selectedClassId ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 60, textAlign: 'center' }}>
          <BookOpen size={40} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', margin: 0 }}>Select a class to view or create a routine</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                {selectedClass?.name}{selectedSection ? ` — Section ${selectedSection}` : hasSection ? ' — All Sections' : ''}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                · Click period row to edit time · Click cell to assign subject 
                {dbLoading && <span style={{ color: '#7c3aed', marginLeft: 8 }}>· Loading routine...</span>}
              </span>
            </div>
            <button onClick={handleAddPeriod}
              style={{ padding: '7px 14px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, fontSize: 12, color: '#7c3aed', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={13} /> Add Period
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', width: 110 }}>Period</th>
                  {DAYS.map(d => (
                    <th key={d} style={{ padding: '11px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period, pi) => (
                  <tr key={period.id} style={{ background: period.isBreak ? '#fafafa' : 'white', borderBottom: '1px solid #f1f5f9' }}>
                    {/* Period label — click to edit */}
                    <td onClick={() => setEditingPeriod(period)} title="Click to edit period"
                      style={{ padding: '8px 14px', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableCellElement).style.background = '#f5f3ff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableCellElement).style.background = 'transparent'; }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Settings size={11} color="#c4b5fd" />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: period.isBreak ? '#94a3b8' : '#1e293b' }}>{period.label}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{fmt(period.startTime)}–{fmt(period.endTime)}</div>
                        </div>
                      </div>
                    </td>

                    {/* Day cells */}
                    {DAYS.map(day => {
                      const sub = timetable[day]?.[pi] ?? null;
                      const chipBg = sub ? (colorMap[sub] ?? '#f1f5f9') : undefined;

                      if (period.isBreak) {
                        return (
                          <td key={day} style={{ padding: '8px 10px', textAlign: 'center', background: '#f8fafc' }}>
                            <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>{period.label}</span>
                          </td>
                        );
                      }

                      return (
                        <td key={day} onClick={() => setPickerCell({ day, periodIdx: pi })}
                          title={`${day} · ${period.label}`}
                          style={{ padding: '6px 8px', textAlign: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableCellElement).style.background = '#f5f3ff'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableCellElement).style.background = 'transparent'; }}>
                          {sub ? (
                            <span style={{ display: 'inline-block', padding: '5px 10px', background: chipBg, borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#1e293b', border: '1px solid rgba(0,0,0,0.06)', whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sub}
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px dashed #e2e8f0', color: '#cbd5e1' }}>
                              <Plus size={13} />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Period editor modal */}
      {editingPeriod && (
        <PeriodEditor
          period={editingPeriod}
          onSave={handlePeriodSave}
          onDelete={() => handlePeriodDelete(editingPeriod.id)}
          onClose={() => setEditingPeriod(null)}
          canDelete={periods.length > 1}
        />
      )}

      {/* Subject picker */}
      {pickerCell && (
        <CellPicker
          subjects={subjectNames}
          current={timetable[pickerCell.day]?.[pickerCell.periodIdx] ?? null}
          onSelect={handleSelect}
          onClose={() => setPickerCell(null)}
          colorMap={colorMap}
        />
      )}
    </AdminLayout>
  );
}
