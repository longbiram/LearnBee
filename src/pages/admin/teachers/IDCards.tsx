import { useState, useMemo } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { useErpStaff, useSchoolInfo, updateStaff } from '../../../hooks/useErpAcademics';
import { 
  Search, Printer, Upload, User, 
  Loader2, Eye, Filter, UserRound, X
} from 'lucide-react';
import IDCardPreview from './IDCardPreview';
import UniversalIDCard from './UniversalIDCard';
import { supabase } from '../../../lib/supabase';

export default function TeacherIDCards() {
  const { schoolId } = useAuth();
  const { school } = useSchoolInfo(schoolId);
  const { staff, loading: loadingStaff, refetch } = useErpStaff(schoolId);
  
  const [filters, setFilters] = useState({
    department: '',
    status: 'active',
    search: ''
  });

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [cardType, setCardType] = useState<'standard' | 'universal'>('standard');
  const [printFormat, setPrintFormat] = useState<'a4' | 'cr80'>('a4');

  // Dynamically populate department dropdown based on teachers' department values
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    staff.forEach(s => {
      if (s.role === 'teacher' && s.department) {
        deptSet.add(s.department);
      }
    });
    return Array.from(deptSet).sort();
  }, [staff]);

  const filteredTeachers = useMemo(() => {
    return staff.filter(s => {
      // Must be a teacher
      if (s.role !== 'teacher') return false;
      
      // Department Filter
      if (filters.department && s.department !== filters.department) return false;
      
      // Status Filter
      if (filters.status && s.status !== filters.status) return false;
      
      // Search text
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const name = (s.profiles?.full_name || '').toLowerCase();
        const empCode = (s.raw_details?.empCode || s.id.slice(0, 8)).toLowerCase();
        const dept = (s.department || '').toLowerCase();
        const desig = (s.designation || '').toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        
        return name.includes(query) || empCode.includes(query) || dept.includes(query) || desig.includes(query) || phone.includes(query);
      }
      
      return true;
    });
  }, [staff, filters]);

  const handlePhotoUpload = async (teacherId: string, file: File) => {
    if (!schoolId) return;
    setUploadingId(teacherId);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const fileName = `${schoolId}/id_staff_${teacherId}_${Date.now()}_${cleanName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('student_photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('student_photos').getPublicUrl(fileName);
      const photoUrl = data.publicUrl;

      const teacher = staff.find(s => s.id === teacherId);
      if (!teacher) throw new Error('Teacher record not found');

      // Update staff record (which now automatically synchronizes profiles.avatar_url in the backend bypassing RLS)
      await updateStaff({
        school_id: schoolId,
        staff_id: teacherId,
        department: teacher.department,
        phone: teacher.phone,
        name: teacher.profiles?.full_name || '',
        teacher_subjects: (teacher.teacher_subjects || []).map((ts: any) => ({
          class_id: ts.class || ts.class_id,
          section: ts.section || null,
          subject_id: ts.subject_id
        })),
        raw_details: {
          ...(teacher.raw_details || {}),
          photo_url: photoUrl
        }
      });

      refetch();
    } catch (err: any) {
      alert('Error uploading photo: ' + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-area-teachers');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Teacher ID Cards - LearnBee</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            
            * { box-sizing: border-box; }
            
            body { 
              margin: 0; 
              padding: 10mm; 
              font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, sans-serif; 
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .print-grid {
              display: grid;
              grid-template-columns: ${printFormat === 'cr80' ? '54mm' : 'repeat(2, 54mm)'};
              gap: ${printFormat === 'cr80' ? '0' : '10mm 8mm'};
              justify-content: center;
              align-content: start;
            }
            
            .id-card-printable {
              page-break-inside: avoid;
              ${printFormat === 'cr80' ? 'page-break-after: always;' : ''}
              width: 54mm;
              height: 85.6mm;
              ${printFormat === 'cr80' ? 'margin: 0 auto;' : ''}
            }
            
            @media print {
              body { 
                padding: ${printFormat === 'cr80' ? '0' : '5mm'}; 
                margin: 0;
              }
              .no-print { display: none !important; }
              @page { 
                margin: 0; 
                size: ${printFormat === 'cr80' ? '54mm 85.6mm' : 'A4 portrait'};
              }
            }
          </style>
        </head>
        <body>
          <div class="print-grid">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              // Wait slightly for any loaded images to settle down
              setTimeout(() => {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const themeColor = school?.theme_color || '#7c3aed';

  return (
    <AdminLayout pageTitle="Teacher ID Cards" pageSubtitle="Manage and print high-quality identity cards for faculty staff">
      
      {/* ── Toolbar ───────────────────────────────── */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: 20, 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -5px rgba(0,0,0,0.02)',
        border: '1px solid #f1f5f9', 
        display: 'flex', 
        flexDirection: 'column',
        marginBottom: 32 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '4px', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
              <button 
                onClick={() => setCardType('standard')}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  border: 'none',
                  cursor: 'pointer',
                  background: cardType === 'standard' ? '#fff' : 'transparent',
                  color: cardType === 'standard' ? themeColor : '#64748b',
                  boxShadow: cardType === 'standard' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Standard ID
              </button>
              <button 
                onClick={() => setCardType('universal')}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  border: 'none',
                  cursor: 'pointer',
                  background: cardType === 'universal' ? '#fff' : 'transparent',
                  color: cardType === 'universal' ? themeColor : '#64748b',
                  boxShadow: cardType === 'universal' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Universal Access
              </button>
            </div>

            <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }} />

            <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '12px', gap: '4px', border: '1px solid #f1f5f9' }}>
              <button 
                onClick={() => setPrintFormat('a4')}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '6px', 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  border: 'none',
                  cursor: 'pointer',
                  background: printFormat === 'a4' ? themeColor : 'transparent',
                  color: printFormat === 'a4' ? '#fff' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                A4 SHEET
              </button>
              <button 
                onClick={() => setPrintFormat('cr80')}
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '6px', 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  border: 'none',
                  cursor: 'pointer',
                  background: printFormat === 'cr80' ? themeColor : 'transparent',
                  color: printFormat === 'cr80' ? '#fff' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                CR80 CARD
              </button>
            </div>
          </div>
          
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>
            <div>Faculty Module: <span style={{ color: themeColor }}>{cardType === 'standard' ? 'ID Management' : 'Access Automation'}</span></div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>Target Printer: {printFormat === 'a4' ? 'Bulk/Office A4 Printer' : 'Dedicated ID Printer'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 300, position: 'relative' }}>
            <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              placeholder="Search teachers by name, department, design, employee code..." 
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '12px 16px 12px 48px', 
                border: '1px solid #e2e8f0', 
                borderRadius: 14, 
                fontSize: 15, 
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                background: '#f8fafc'
              }} 
              onFocus={e => { e.target.style.borderColor = themeColor; e.target.style.boxShadow = `0 0 0 4px ${themeColor}10`; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', padding: '4px 8px', borderRadius: 12 }}>
              <Filter size={14} color="#64748b" />
              <select 
                value={filters.department}
                onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}
                style={{ padding: '8px 10px', border: 'none', borderRadius: 8, fontSize: 13, background: 'transparent', fontWeight: 600, color: '#475569', minWidth: 150, outline: 'none' }}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select 
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                style={{ padding: '8px 10px', border: 'none', borderRadius: 8, fontSize: 13, background: 'transparent', fontWeight: 600, color: '#475569', minWidth: 100, outline: 'none' }}
              >
                <option value="active">Active Staff</option>
                <option value="resigned">Resigned Staff</option>
                <option value="">All Statuses</option>
              </select>
            </div>

            <button 
              onClick={handlePrint}
              disabled={filteredTeachers.length === 0}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10, 
                padding: '12px 24px', 
                background: themeColor, 
                color: '#fff', 
                border: 'none', 
                borderRadius: 14, 
                fontWeight: 700, 
                fontSize: 14, 
                cursor: filteredTeachers.length === 0 ? 'not-allowed' : 'pointer',
                opacity: filteredTeachers.length === 0 ? 0.6 : 1,
                boxShadow: `0 4px 14px 0 ${themeColor}40`,
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => { if (filteredTeachers.length > 0) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.15)`; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 14px 0 ${themeColor}40`; }}
            >
              <Printer size={18} /> Print Bulk ({filteredTeachers.length})
            </button>
          </div>
        </div>
      </div>

      {/* ── Teacher Grid ───────────────────────────── */}
      {loadingStaff ? (
        <div style={{ padding: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Loader2 size={40} color={themeColor} style={{ animation: 'spin 1.5s linear infinite' }} />
          <div style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>Fetching staff directories...</div>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div style={{ padding: 80, textAlign: 'center', background: '#fff', borderRadius: 24, border: '2px dashed #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <UserRound size={32} color="#94a3b8" />
          </div>
          <div style={{ color: '#1e293b', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Teachers Found</div>
          <div style={{ color: '#64748b', fontSize: 14, maxWidth: 300, lineHeight: 1.5 }}>No faculty staff members match the current search filters. Try adjusting your search query or department selections.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredTeachers.map(teacher => {
            const photoUrl = teacher.raw_details?.photo_url || (teacher.profiles as any)?.avatar_url;
            const empCode = teacher.raw_details?.empCode || teacher.id.slice(0, 8).toUpperCase();
            return (
              <div key={teacher.id} style={{ 
                background: '#fff', 
                borderRadius: 20, 
                border: '1px solid #f1f5f9', 
                padding: '16px', 
                display: 'flex', 
                gap: 16, 
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden'
              }}
                onMouseEnter={e => { 
                  e.currentTarget.style.borderColor = `${themeColor}33`; 
                  e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.borderColor = '#f1f5f9'; 
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ position: 'relative', width: 90, height: 110, borderRadius: 16, overflow: 'hidden', background: '#f8fafc', border: '1px solid #f1f5f9', flexShrink: 0 }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt="Staff" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={36} color="#cbd5e1" />
                    </div>
                  )}
                  
                  <label style={{ 
                    position: 'absolute', 
                    bottom: 6, 
                    right: 6, 
                    width: 32, 
                    height: 32, 
                    borderRadius: '10px', 
                    background: '#fff', 
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer', 
                    border: '1px solid #f1f5f9',
                    transition: 'transform 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*" 
                      onChange={e => e.target.files?.[0] && handlePhotoUpload(teacher.id, e.target.files[0])} 
                    />
                    {uploadingId === teacher.id ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={16} color={themeColor} />}
                  </label>
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {teacher.profiles?.full_name || 'Teacher Name'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                       <span style={{ fontSize: 11, fontWeight: 700, color: themeColor, background: `${themeColor}12`, padding: '2px 8px', borderRadius: 6 }}>{empCode}</span>
                       <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{teacher.designation || 'Faculty'}</span>
                     </div>
                     <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>{teacher.department || 'Academic Staff'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button 
                      onClick={() => { setSelectedStaff(teacher); setShowModal(true); }}
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 8, 
                        padding: '10px', 
                        borderRadius: 12, 
                        background: '#f8fafc', 
                        border: '1px solid #f1f5f9', 
                        color: '#475569', 
                        fontSize: 13, 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                    >
                      <Eye size={16} /> Preview
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedStaff(teacher);
                        setTimeout(() => handlePrint(), 100);
                      }}
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 8, 
                        padding: '10px', 
                        borderRadius: 12, 
                        background: `${themeColor}10`, 
                        border: 'none', 
                        color: themeColor, 
                        fontSize: 13, 
                        fontWeight: 800, 
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${themeColor}15`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${themeColor}10`; }}
                    >
                      <Printer size={16} /> Print
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Preview ─────────────────── */}
      {showModal && selectedStaff && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(15, 23, 42, 0.4)', 
          backdropFilter: 'blur(8px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000, 
          padding: 24,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 32, 
            padding: '40px 32px', 
            width: '100%', 
            maxWidth: 440, 
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => setShowModal(false)} 
              style={{ position: 'absolute', top: 24, right: 24, background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Card Preview</h2>
              <p style={{ fontSize: 14, color: '#64748b' }}>Confirm teacher credentials before printing</p>
            </div>
            
            <div style={{ 
              background: '#f1f5f9', 
              padding: '24px', 
              borderRadius: '20px', 
              marginBottom: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Paper Background Simulation */}
              <div style={{ 
                background: '#fff', 
                width: printFormat === 'a4' ? '210px' : '108px', 
                height: printFormat === 'a4' ? '297px' : '171.2px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: printFormat === 'a4' ? 'scale(1)' : 'scale(1.8)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                 <div style={{ transform: printFormat === 'a4' ? 'scale(0.35)' : 'scale(1)' }}>
                   {cardType === 'standard' ? (
                     <IDCardPreview staff={selectedStaff} school={school} />
                   ) : (
                     <UniversalIDCard staff={selectedStaff} school={school} />
                   )}
                 </div>
                 
                 {printFormat === 'a4' && (
                   <div style={{ 
                     position: 'absolute', 
                     inset: 0, 
                     border: '1px dashed #cbd5e1', 
                     pointerEvents: 'none',
                     display: 'grid',
                     gridTemplateColumns: '1fr 1fr',
                     gridTemplateRows: 'repeat(5, 1fr)',
                     opacity: 0.5
                   }} />
                 )}
              </div>

              <div style={{ 
                position: 'absolute', 
                bottom: 12, 
                left: '50%', 
                transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                backdropFilter: 'blur(4px)'
              }}>
                {printFormat === 'a4' ? 'A4 SHEET PREVIEW (SCALED)' : 'CR80 CARD PREVIEW'}
              </div>
            </div>

            <button 
              onClick={handlePrint}
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 10, 
                padding: '16px', 
                background: themeColor, 
                color: '#fff', 
                border: 'none', 
                borderRadius: 16, 
                fontWeight: 800, 
                fontSize: 16, 
                cursor: 'pointer',
                boxShadow: `0 8px 20px ${themeColor}33`,
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <Printer size={20} /> Print Document
            </button>
          </div>
        </div>
      )}

      {/* Hidden printable area for bulk/single print */}
      <div id="printable-area-teachers" style={{ display: 'none' }}>
        {selectedStaff && showModal ? (
          cardType === 'standard' ? (
            <IDCardPreview staff={selectedStaff} school={school} />
          ) : (
            <UniversalIDCard staff={selectedStaff} school={school} />
          )
        ) : (
          filteredTeachers.map(t => (
            cardType === 'standard' ? (
              <IDCardPreview key={t.id} staff={t} school={school} />
            ) : (
              <UniversalIDCard key={t.id} staff={t} school={school} />
            )
          ))
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </AdminLayout>
  );
}
