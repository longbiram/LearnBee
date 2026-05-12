/**
 * Premium Academic Report Card - V3 "Modern Professional"
 * Features: High-density layout, Performance Visualization, 
 * Sophisticated Indigo Palette, and Professional Information Architecture.
 */

export default function CustomReportCard({ student, school, exam, results }) {
  const styles = {
    container: {
      width: '210mm',
      minHeight: '297mm',
      padding: '15mm',
      margin: '0 auto',
      background: '#fff',
      fontFamily: "'Outfit', sans-serif",
      color: '#0f172a',
      boxSizing: 'border-box',
      border: '1px solid #e2e8f0',
      position: 'relative',
      overflow: 'hidden',
    },
    accentBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '8px',
      background: 'linear-gradient(90deg, #6366f1, #a855f7)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '30px 0',
      borderBottom: '2px solid #f1f5f9',
      marginBottom: '30px',
    },
    schoolInfo: {
      flex: 1,
    },
    schoolName: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#1e293b',
      margin: '0 0 4px 0',
      letterSpacing: '-0.5px',
    },
    schoolMeta: {
      fontSize: '13px',
      color: '#64748b',
      maxWidth: '400px',
      lineHeight: '1.4',
    },
    studentCard: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '24px',
      background: '#f8fafc',
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid #f1f5f9',
      marginBottom: '32px',
    },
    infoBlock: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    infoLabel: {
      fontSize: '10px',
      fontWeight: '700',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    infoValue: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#334155',
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 8px',
      marginBottom: '32px',
    },
    th: {
      padding: '12px 16px',
      fontSize: '11px',
      fontWeight: '700',
      color: '#64748b',
      textTransform: 'uppercase',
      textAlign: 'left',
      letterSpacing: '1px',
    },
    tr: {
      background: '#fff',
    },
    td: {
      padding: '16px',
      fontSize: '14px',
      borderBottom: '1px solid #f1f5f9',
    },
    progressBarOuter: {
      width: '100%',
      height: '6px',
      background: '#f1f5f9',
      borderRadius: '3px',
      marginTop: '8px',
      overflow: 'hidden',
    },
    progressBarInner: (pct) => ({
      width: `${pct}%`,
      height: '100%',
      background: pct >= 80 ? '#10b981' : pct >= 60 ? '#6366f1' : '#f59e0b',
      borderRadius: '3px',
    }),
    gradeBadge: (pct) => ({
      padding: '4px 12px',
      borderRadius: '100px',
      fontWeight: '700',
      fontSize: '12px',
      display: 'inline-block',
      background: pct >= 80 ? 'rgba(16,185,129,0.1)' : pct >= 60 ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
      color: pct >= 80 ? '#059669' : pct >= 60 ? '#4f46e5' : '#d97706',
    }),
    summarySection: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '30px',
      padding: '30px',
      background: '#1e293b',
      borderRadius: '20px',
      color: '#fff',
    },
    mainStat: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    statLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#94a3b8',
      textTransform: 'uppercase',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '48px',
      fontWeight: '800',
      letterSpacing: '-1px',
    },
    footer: {
      marginTop: '60px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '40px',
    },
    signatureBox: {
      textAlign: 'center',
      borderTop: '1px solid #e2e8f0',
      paddingTop: '12px',
    },
    signatureLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#64748b',
    }
  };

  const totalMax = results.reduce((acc, r) => acc + (r.max_theory || 0) + (r.max_practical || 0) + (r.max_internal || 0), 0);
  const totalObt = results.reduce((acc, r) => acc + (r.theory_marks || 0) + (r.practical_marks || 0) + (r.internal_marks || 0), 0);
  const percentage = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(1) : '0';

  const getGrade = (p) => {
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B+';
    if (p >= 60) return 'B';
    if (p >= 50) return 'C';
    return 'D';
  };

  return (
    <div style={styles.container}>
      <div style={styles.accentBar} />
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.schoolInfo}>
          <h1 style={styles.schoolName}>{school.name}</h1>
          <p style={styles.schoolMeta}>{school.address || 'Academic Excellence Since 1998'}</p>
          <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px' }}>CODE: {school.code || 'SCH-001'}</div>
            <div style={{ fontSize: '11px', fontWeight: '600', background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px' }}>ACADEMIC YEAR: 2025-26</div>
          </div>
        </div>
        {school.logo_url && (
          <div style={{ width: '100px', height: '100px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
            <img src={school.logo_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="School Logo" />
          </div>
        )}
      </div>

      {/* Student Profile */}
      <div style={styles.studentCard}>
        <div style={styles.infoBlock}>
          <span style={styles.infoLabel}>Student Name</span>
          <span style={styles.infoValue}>{student.first_name} {student.last_name}</span>
        </div>
        <div style={styles.infoBlock}>
          <span style={styles.infoLabel}>Roll Number</span>
          <span style={styles.infoValue}>{student.roll_number || '00' + student.id}</span>
        </div>
        <div style={styles.infoBlock}>
          <span style={styles.infoLabel}>Class & Section</span>
          <span style={styles.infoValue}>{student.class_name} — {student.current_section}</span>
        </div>
        <div style={styles.infoBlock}>
          <span style={styles.infoLabel}>Admission No</span>
          <span style={styles.infoValue}>{student.admission_number}</span>
        </div>
        <div style={{ ...styles.infoBlock, gridColumn: 'span 2' }}>
          <span style={styles.infoLabel}>Examination Title</span>
          <span style={styles.infoValue}>{exam.name}</span>
        </div>
        <div style={styles.infoBlock}>
          <span style={styles.infoLabel}>Date Issued</span>
          <span style={styles.infoValue}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        <div style={styles.infoBlock}>
          <span style={styles.infoLabel}>Attendance</span>
          <span style={styles.infoValue}>94% (Target: 100%)</span>
        </div>
      </div>

      {/* Marks Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Subject</th>
            <th style={styles.th}>Theory</th>
            <th style={styles.th}>Practical</th>
            <th style={styles.th}>Internal</th>
            <th style={styles.th}>Obtained</th>
            <th style={styles.th}>Grade</th>
          </tr>
        </thead>
        <tbody>
          {results.map((res, i) => {
            const obt = (res.theory_marks || 0) + (res.practical_marks || 0) + (res.internal_marks || 0);
            const max = (res.max_theory || 0) + (res.max_practical || 0) + (res.max_internal || 0);
            const pct = (obt / max) * 100;
            
            return (
              <tr key={i}>
                <td style={styles.td}>
                  <div style={{ fontWeight: '700', marginBottom: '2px' }}>{res.subject_name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Max Marks: {max}</div>
                  <div style={styles.progressBarOuter}>
                    <div style={styles.progressBarInner(pct)} />
                  </div>
                </td>
                <td style={styles.td}>{res.theory_marks || 0}</td>
                <td style={styles.td}>{res.practical_marks || 0}</td>
                <td style={styles.td}>{res.internal_marks || 0}</td>
                <td style={{ ...styles.td, fontWeight: '700' }}>{obt}</td>
                <td style={styles.td}>
                  <span style={styles.gradeBadge(pct)}>{getGrade(pct)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Performance Summary */}
      <div style={styles.summarySection}>
        <div style={styles.mainStat}>
          <span style={styles.statLabel}>Cumulative Performance</span>
          <div style={styles.statValue}>{percentage}%</div>
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
            The student has demonstrated {parseFloat(percentage) >= 75 ? 'outstanding' : 'steady'} progress across most modules. 
            Overall academic standing is {getGrade(parseFloat(percentage))}.
          </p>
        </div>
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '30px' }}>
          <div style={{ marginBottom: '20px' }}>
            <span style={styles.statLabel}>Total Marks</span>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{totalObt} <span style={{ fontSize: '14px', color: '#64748b' }}>/ {totalMax}</span></div>
          </div>
          <div>
            <span style={styles.statLabel}>Class Rank</span>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{results[0]?.rank || '08'} <span style={{ fontSize: '14px', color: '#64748b' }}>of 42</span></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.signatureBox}>
          <div style={{ height: '40px' }} />
          <span style={styles.signatureLabel}>Class Teacher</span>
        </div>
        <div style={styles.signatureBox}>
          <div style={{ height: '40px' }} />
          <span style={styles.signatureLabel}>Exam Controller</span>
        </div>
        <div style={styles.signatureBox}>
          <div style={{ height: '40px' }} />
          <span style={styles.signatureLabel}>Principal / Head</span>
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet" />
    </div>
  );
}
