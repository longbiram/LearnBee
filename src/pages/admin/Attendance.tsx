import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Clock, Search, Calendar, ChevronRight, Loader2, Save, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useErpClasses } from '../../hooks/useErpAcademics';
import { useStudents } from '../../hooks/useErpStudents';
import { useErpAttendance, type AttendanceRecord } from '../../hooks/useErpAttendance';

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  present: { bg: '#dcfce7', color: '#16a34a', label: 'Present'  },
  absent:  { bg: '#fee2e2', color: '#dc2626', label: 'Absent'   },
  late:    { bg: '#fef9c3', color: '#ca8a04', label: 'Late'     },
  leave:   { bg: '#dbeafe', color: '#2563eb', label: 'On Leave' },
};

export default function Attendance() {
  const { schoolId } = useAuth();
  const { classes, currentSession, loading: classesLoading } = useErpClasses(schoolId);
  
  // State for selections
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten classes into class-section pairs for the sidebar
  const classSectionList = useMemo(() => {
    return classes.flatMap(c => 
      (c.sections && c.sections.length > 0) 
        ? c.sections.map(s => ({ id: `${c.id}-${s}`, classId: c.id, className: c.name, section: s }))
        : [{ id: `${c.id}-none`, classId: c.id, className: c.name, section: null }]
    ).sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }));
  }, [classes]);

  // Set default selection
  useEffect(() => {
    if (!selectedClassId && classSectionList.length > 0) {
      setSelectedClassId(classSectionList[0].classId);
      setSelectedSection(classSectionList[0].section);
    }
  }, [classSectionList, selectedClassId]);

  // Fetch students for the selected class/section
  const { students, loading: studentsLoading } = useStudents(schoolId, {
    class_id: selectedClassId || undefined,
    current_section: selectedSection || undefined,
    session_id: currentSession?.id
  });

  // Fetch attendance records
  const { records, loading: attendanceLoading, saveAttendance, error: attendanceError } = useErpAttendance(
    schoolId,
    currentSession?.id || null,
    selectedClassId,
    selectedSection,
    selectedDate
  );

  // Local state for marking attendance before saving
  const [localAttendance, setLocalAttendance] = useState<Record<string, { status: string; time?: string }>>({});

  // Sync local attendance with fetched records
  useEffect(() => {
    const fresh: Record<string, { status: string; time?: string }> = {};
    // Default all students to 'present' initially
    students.forEach(s => {
      fresh[s.id] = { status: 'present', time: '-' };
    });
    // Override with saved records if they exist
    records.forEach(r => {
      fresh[r.student_id] = { status: r.status, time: r.time };
    });
    setLocalAttendance(fresh);
  }, [records, students]);

  // Handlers
  const handleMark = (studentId: string, status: string) => {
    setLocalAttendance(prev => {
      const currentStatus = prev[studentId]?.status || 'present';
      const newStatus = currentStatus === 'absent' ? 'present' : 'absent';
      
      return {
        ...prev,
        [studentId]: { 
          ...prev[studentId], 
          status: newStatus, 
          time: newStatus === 'present' ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'
        }
      };
    });
  };

  const handleSave = async () => {
    const payload = students.map(s => ({
      student_id: s.id,
      status: localAttendance[s.id]?.status || 'present',
      time: localAttendance[s.id]?.time || null,
    }));
    await saveAttendance(payload);
    alert('Attendance saved successfully!');
  };

  //过滤后的学生列表
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || 
      s.admission_number.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Summary counts
  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, leave: 0 };
    records.forEach(r => {
      if (r.status in counts) counts[r.status as keyof typeof counts]++;
    });
    // For students not in records, they are effectively "not marked" yet, 
    // but in UI we might want to show them as absent if we're listing the whole class.
    // However, usually the "records" only exist if they were saved.
    return counts;
  }, [records]);

  const activeClassName = classSectionList.find(cs => cs.classId === selectedClassId && cs.section === selectedSection)?.className || 'Select Class';

  const dashboardSummary = [
    { label: 'Present', value: summary.present, color: '#16a34a', bg: '#dcfce7' },
    { label: 'Absent',  value: summary.absent,  color: '#dc2626', bg: '#fee2e2' },
  ];

  return (
    <AdminLayout pageTitle="Attendance" pageSubtitle={`Student & Staff attendance — ${new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {dashboardSummary.map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }}></span>
              {c.label}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', margin: '8px 0 0' }}>{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* Class Selection Sidebar */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontWeight: 800, fontSize: 14, color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Classes
            {classesLoading && <Loader2 size={14} className="animate-spin" color="#94a3b8" />}
          </div>
          <div style={{ padding: 12, maxHeight: '600px', overflowY: 'auto' }}>
            {classSectionList.map((cs) => {
              const isActive = selectedClassId === cs.classId && selectedSection === cs.section;
              return (
                <div 
                  key={cs.id} 
                  onClick={() => { setSelectedClassId(cs.classId); setSelectedSection(cs.section); }}
                  style={{ 
                    padding: '10px 14px', borderRadius: 12, cursor: 'pointer', fontSize: 14, 
                    color: isActive ? '#7c3aed' : '#475569', 
                    background: isActive ? '#f5f3ff' : 'transparent', 
                    fontWeight: isActive ? 700 : 500, marginBottom: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>Class {cs.className}{cs.section ? `-${cs.section}` : ''}</span>
                  {isActive && <ChevronRight size={14} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Attendance Main Table Area */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          
          {/* Table Header / Controls */}
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                  Class {activeClassName} {selectedSection ? `Section ${selectedSection}` : ''}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
                  {students.length} Students enrolled • {records.length} Records found
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Calendar size={16} color="#64748b" style={{ position: 'absolute', left: 12 }} />
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, color: '#1e293b', outline: 'none', background: '#f8fafc' }}
                  />
                </div>
                <button 
                  onClick={handleSave}
                  disabled={attendanceLoading || students.length === 0}
                  style={{ 
                    padding: '8px 20px', background: '#7c3aed', color: '#fff', border: 'none', 
                    borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)',
                    opacity: attendanceLoading ? 0.7 : 1
                  }}
                >
                  {attendanceLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Attendance
                </button>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search students by name or admission number..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: 13, background: '#f8fafc', outline: 'none' }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            {studentsLoading ? (
              <div style={{ padding: 100, textAlign: 'center', color: '#94a3b8' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ padding: 100, textAlign: 'center', color: '#94a3b8' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
                <p>No students found for this class.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Student Name', 'Adm No', 'Time', 'Current Status', 'Action'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '14px 20px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => {
                    const local = localAttendance[s.id];
                    const st = local ? statusStyle[local.status] : null;
                    
                    return (
                      <tr key={s.id} style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ 
                              width: 36, height: 36, borderRadius: 12, 
                              background: `linear-gradient(135deg, hsl(${i * 45}, 70%, 90%), hsl(${i * 45}, 70%, 80%))`, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              fontWeight: 700, fontSize: 13, color: `hsl(${i * 45}, 70%, 30%)` 
                            }}>
                              {s.first_name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{s.first_name} {s.last_name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.gender || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#64748b' }}>{s.admission_number}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                            <Clock size={14} color="#94a3b8" />
                            {local?.time || '--:--'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {st ? (
                            <span style={{ 
                              fontSize: 10, padding: '4px 10px', borderRadius: 8, fontWeight: 800, 
                              background: st.bg, color: st.color, textTransform: 'uppercase'
                            }}>
                              {st.label}
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600 }}>NOT MARKED</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button 
                              onClick={() => handleMark(s.id, 'absent')}
                              style={{ 
                                padding: '6px 16px', borderRadius: 8, 
                                border: '1px solid #e2e8f0', 
                                background: local?.status === 'absent' ? '#dc2626' : '#fff', 
                                fontSize: 11, fontWeight: 800, cursor: 'pointer', 
                                color: local?.status === 'absent' ? '#fff' : '#64748b',
                                display: 'flex', alignItems: 'center', gap: 6,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {local?.status === 'absent' ? <XCircle size={14} /> : <AlertCircle size={14} />}
                              {local?.status === 'absent' ? 'ABSENT' : 'MARK ABSENT'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {/* Attendance Legend / Quick Stats */}
      {attendanceError && (
        <div style={{ marginTop: 24, padding: '12px 20px', background: '#fff1f2', border: '1px solid #fda4af', borderRadius: 12, color: '#e11d48', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          {attendanceError}
        </div>
      )}
    </AdminLayout>
  );
}
