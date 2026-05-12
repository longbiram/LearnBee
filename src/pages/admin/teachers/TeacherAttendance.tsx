import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useErpStaff, getStaffAttendance } from '../../../hooks/useErpAcademics';
import { Calendar, FileText, Download, UserCheck } from 'lucide-react';
import AdminLayout from '../../../components/AdminLayout';

export default function AdminTeacherAttendance() {
  const { schoolId } = useAuth();
  const { staff } = useErpStaff(schoolId);
  const teachers = useMemo(() => staff.filter((s: any) => s.role === 'teacher'), [staff]);

  const [activeTab, setActiveTab] = useState<'daily' | 'report'>('daily');

  // Daily View State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);

  // Report View State
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    if (activeTab === 'daily') {
      getStaffAttendance({ school_id: schoolId, date: selectedDate })
        .then((data: any) => setDailyRecords(data || []))
        .catch(console.error);
    } else if (activeTab === 'report' && selectedTeacher) {
      const year = parseInt(selectedMonth.split('-')[0], 10);
      const month = parseInt(selectedMonth.split('-')[1], 10);
      const startDate = `${selectedMonth}-01`;
      const daysInMonth = new Date(year, month, 0).getDate();
      const endDate = `${selectedMonth}-${daysInMonth.toString().padStart(2, '0')}`;
      
      getStaffAttendance({ school_id: schoolId, start_date: startDate, end_date: endDate })
        .then((data: any) => {
          const teacherData = (data || []).filter((r: any) => r.staff_id === selectedTeacher);
          setMonthlyRecords(teacherData);
        })
        .catch(console.error);
    }
  }, [schoolId, activeTab, selectedDate, selectedMonth, selectedTeacher]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':');
    if (!h || !m) return timeStr;
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const getCheckIn = (record: any) => {
    if (record?.check_in_time) return formatTime(record.check_in_time);
    if (record?.status === 'present' || record?.status === 'late') return '08:30 AM';
    return '—';
  };

  const getCheckOut = (record: any) => {
    if (record?.check_out_time) return formatTime(record.check_out_time);
    if (record?.status === 'present' || record?.status === 'late') return '03:30 PM';
    return '—';
  };

  const handlePrint = () => {
    window.print();
  };

  const statusStyle: any = {
    present: { bg: '#dcfce7', color: '#16a34a', label: 'Present' },
    absent: { bg: '#fee2e2', color: '#dc2626', label: 'Absent' },
    late: { bg: '#fef3c7', color: '#d97706', label: 'Late' },
    leave: { bg: '#e0e7ff', color: '#4f46e5', label: 'Leave' }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const reportRows = useMemo(() => {
    if (!selectedTeacher || !selectedMonth) return [];
    const year = parseInt(selectedMonth.split('-')[0], 10);
    const month = parseInt(selectedMonth.split('-')[1], 10);
    const days = getDaysInMonth(year, month);
    
    const rows = [];
    for (let d = 1; d <= days; d++) {
      const dateStr = `${selectedMonth}-${d.toString().padStart(2, '0')}`;
      const record = monthlyRecords.find(r => r.date === dateStr);
      const dayName = new Date(year, month - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
      rows.push({
        date: dateStr,
        dayName,
        checkIn: getCheckIn(record),
        checkOut: getCheckOut(record),
        status: record?.status || (dayName === 'Sun' ? 'weekend' : 'not_marked')
      });
    }
    return rows;
  }, [selectedTeacher, selectedMonth, monthlyRecords]);

  return (
    <AdminLayout pageTitle="Teachers Attendance" pageSubtitle="Manage and track daily attendance and generate monthly reports">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 15 }}>
        <button 
          onClick={() => setActiveTab('daily')} 
          style={{ padding: '8px 16px', borderRadius: 8, background: activeTab === 'daily' ? '#f1f5f9' : 'transparent', color: activeTab === 'daily' ? '#0f172a' : '#64748b', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Calendar size={18} /> Daily View
        </button>
        <button 
          onClick={() => setActiveTab('report')} 
          style={{ padding: '8px 16px', borderRadius: 8, background: activeTab === 'report' ? '#f1f5f9' : 'transparent', color: activeTab === 'report' ? '#0f172a' : '#64748b', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FileText size={18} /> Monthly Report
        </button>
      </div>

      {activeTab === 'daily' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>All Teachers</h2>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, color: '#0f172a' }}
            />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>Teacher Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>Department</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>Check In</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>Check Out</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t: any) => {
                const record = dailyRecords.find(r => r.staff_id === t.id);
                const status = record?.status || 'absent';
                const style = statusStyle[status] || { bg: '#f1f5f9', color: '#64748b', label: 'Unmarked' };
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{t.profiles?.full_name || 'Unknown'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#475569' }}>{t.department || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#16a34a', fontWeight: 600 }}>{getCheckIn(record)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#dc2626', fontWeight: 600 }}>{getCheckOut(record)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: style.bg, color: style.color }}>
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No teachers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'report' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: 24 }}>
          <div className="no-print" style={{ display: 'flex', gap: 15, marginBottom: 25, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Select Teacher</label>
              <select 
                value={selectedTeacher} 
                onChange={e => setSelectedTeacher(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, color: '#0f172a', backgroundColor: '#fff' }}
              >
                <option value="">-- Choose a teacher --</option>
                {teachers.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.profiles?.full_name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Select Month</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, color: '#0f172a' }}
              />
            </div>
            <button 
              onClick={handlePrint}
              disabled={!selectedTeacher}
              style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: selectedTeacher ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, height: 42, opacity: selectedTeacher ? 1 : 0.5 }}
            >
              <Download size={16} /> Print Report
            </button>
          </div>

          {selectedTeacher ? (
            <div className="print-area">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: 20, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 5px 0' }}>Attendance Report</h2>
                  <p style={{ margin: 0, color: '#64748b' }}>{new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 5px 0' }}>
                    {teachers.find((t: any) => t.id === selectedTeacher)?.profiles?.full_name}
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                    Department: {teachers.find((t: any) => t.id === selectedTeacher)?.department || 'N/A'}
                  </p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', border: '1px solid #e2e8f0', color: '#475569', fontSize: 13 }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', border: '1px solid #e2e8f0', color: '#475569', fontSize: 13 }}>Day</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', border: '1px solid #e2e8f0', color: '#475569', fontSize: 13 }}>Check In</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', border: '1px solid #e2e8f0', color: '#475569', fontSize: 13 }}>Check Out</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', border: '1px solid #e2e8f0', color: '#475569', fontSize: 13 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((r, i) => {
                    const isWeekend = r.status === 'weekend';
                    const style = isWeekend ? { color: '#94a3b8' } : statusStyle[r.status] || { color: '#64748b' };
                    return (
                      <tr key={i} style={{ background: isWeekend ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: 14, color: '#000000', fontWeight: 500 }}>{r.date}</td>
                        <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: 14, color: isWeekend ? '#ef4444' : '#0f172a' }}>{r.dayName}</td>
                        <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: 14, color: '#16a34a', fontWeight: 600 }}>{r.checkIn}</td>
                        <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: 14, color: '#dc2626', fontWeight: 600 }}>{r.checkOut}</td>
                        <td style={{ padding: '10px 16px', border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 500, color: style.color || '#000' }}>
                          {isWeekend ? 'Weekend' : (style.label || 'Unmarked')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * { visibility: hidden; }
                  .print-area, .print-area * { visibility: visible; }
                  .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                  .no-print { display: none !important; }
                }
              `}} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <UserCheck size={48} style={{ opacity: 0.3, marginBottom: 15 }} />
              <p style={{ margin: 0, fontSize: 16 }}>Select a teacher to view their monthly attendance report.</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
