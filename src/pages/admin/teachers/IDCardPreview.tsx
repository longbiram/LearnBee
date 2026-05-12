import React from 'react';
import type { ErpStaff } from '../../../hooks/useErpAcademics';
import { User, BookOpen, QrCode } from 'lucide-react';

interface IDCardPreviewProps {
  staff: ErpStaff;
  school: any;
}

export default function IDCardPreview({ staff, school }: IDCardPreviewProps) {
  const themeColor = school?.theme_color || '#7c3aed';
  
  const cardStyle: React.CSSProperties = {
    width: '54mm',
    height: '85.6mm',
    background: '#fff',
    borderRadius: '14px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', system-ui, sans-serif",
    border: '1px solid #e2e8f0',
    margin: '0 auto',
    color: '#1e293b',
    backgroundClip: 'padding-box',
  };

  const headerStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
    padding: '8px 4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    color: '#fff',
    position: 'relative',
    zIndex: 2,
    flexShrink: 0,
    textAlign: 'center',
  };

  const logoContainerStyle: React.CSSProperties = {
    width: '30px',
    height: '30px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  const photoContainerStyle: React.CSSProperties = {
    width: '10mm',
    height: '12mm',
    margin: '4px auto 0',
    borderRadius: '8px',
    padding: '1px',
    background: themeColor,
    boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
    position: 'relative',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  };

  const photoInnerWrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#fff',
    borderRadius: '7px',
    padding: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const staffPhotoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '6px',
    objectFit: 'cover',
    background: '#f8fafc',
    border: '0.5px solid #f1f5f9',
  };

  const infoSectionStyle: React.CSSProperties = {
    padding: '4px 12px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  };

  const labelValueStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(42px, 1fr) 1.8fr',
    width: '100%',
    gap: '2px',
    fontSize: '7px',
    marginBottom: '1.5px',
    alignItems: 'baseline',
  };

  const labelStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: '6.5px',
    letterSpacing: '0.01em',
  };

  const valueStyle: React.CSSProperties = {
    color: '#1e293b',
    fontWeight: 700,
    lineHeight: 1.0,
  };

  const watermarkStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    opacity: 0.03,
    pointerEvents: 'none',
    zIndex: 1,
    background: `radial-gradient(circle at 20% 30%, ${themeColor} 0%, transparent 70%)`,
    overflow: 'hidden',
  };

  const photoUrl = staff.raw_details?.photo_url || (staff.profiles as any)?.avatar_url;
  const empId = staff.raw_details?.empCode || staff.id.slice(0, 8).toUpperCase();

  return (
    <div className="id-card-printable" style={cardStyle}>
      {/* Background Watermark Pattern */}
      <div style={watermarkStyle}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="pattern-hex-teacher" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M10 0L20 5V15L10 20L0 15V5L10 0Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#pattern-hex-teacher)" />
        </svg>
      </div>

      {/* Header */}
      <div style={headerStyle}>
        <div style={{ ...logoContainerStyle, margin: '0 auto' }}>
          {school?.logo_url ? (
            <img src={school.logo_url} alt="Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
          ) : (
            <BookOpen size={18} color={themeColor} />
          )}
        </div>
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '10px', fontWeight: 900, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {school?.name || 'LearnBee Academy'}
          </div>
          <div style={{ fontSize: '6px', opacity: 0.95, fontWeight: 600, marginTop: '1px' }}>
            {school?.board_affiliation && `${school.board_affiliation} `}
            {school?.affiliation_number && `(${school.affiliation_number})`}
            {(school?.board_affiliation || school?.affiliation_number) && school?.school_code && ' | '}
            {school?.school_code && `Code: ${school.school_code}`}
          </div>
          <div style={{ fontSize: '6px', opacity: 0.85, fontWeight: 500 }}>
            {school?.city || 'Education Excellence'}
          </div>
        </div>
      </div>

      {/* Identity Tag */}
      <div style={{ 
        background: `${themeColor}12`, 
        color: themeColor,
        padding: '2px 0', 
        textAlign: 'center', 
        fontSize: '7px',
        fontWeight: 800, 
        letterSpacing: '0.12em', 
        textTransform: 'uppercase',
        borderBottom: `1px solid ${themeColor}22`,
        flexShrink: 0
      }}>
        Faculty Identity Card
      </div>

      {/* Photo with Border */}
      <div style={photoContainerStyle}>
        <div style={photoInnerWrapperStyle}>
          {photoUrl ? (
            <img src={photoUrl} alt="Teacher" style={staffPhotoStyle} />
          ) : (
            <div style={{ ...staffPhotoStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={12} color="#cbd5e1" />
            </div>
          )}
        </div>
      </div>

      {/* Name Section */}
      <div style={{ padding: '6px 2px 0', textAlign: 'center', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <div style={{ fontSize: '10px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.01em' }}>
          {staff.profiles?.full_name || 'Teacher Fullname'}
        </div>
        <div style={{ display: 'inline-block', marginTop: '1px', padding: '1px 5px', borderRadius: '4px', background: `${themeColor}08`, fontSize: '7px', fontWeight: 700, color: themeColor }}>
          EMP CODE: {empId}
        </div>
      </div>

      {/* Details Section */}
      <div style={infoSectionStyle}>
        <div style={{ width: '60%', height: '0.2px', background: `linear-gradient(90deg, transparent, ${themeColor}33, transparent)`, margin: '2px 0 4px' }} />
        
        <div style={labelValueStyle}>
          <span style={labelStyle}>Designation</span>
          <span style={valueStyle}>{staff.designation || 'Teacher'}</span>
        </div>
        <div style={labelValueStyle}>
          <span style={labelStyle}>Department</span>
          <span style={valueStyle}>{staff.department || 'Academic Staff'}</span>
        </div>
        <div style={labelValueStyle}>
          <span style={labelStyle}>Phone</span>
          <span style={valueStyle}>{staff.phone || staff.raw_details?.phone || '-'}</span>
        </div>
        <div style={labelValueStyle}>
          <span style={labelStyle}>Email</span>
          <span style={{ ...valueStyle, fontSize: '7px', wordBreak: 'break-all' }}>{staff.profiles?.email || staff.raw_details?.email || '-'}</span>
        </div>
        <div style={labelValueStyle}>
          <span style={labelStyle}>Joined On</span>
          <span style={valueStyle}>
            {staff.raw_details?.joinDate 
              ? new Date(staff.raw_details.joinDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) 
              : '-'}
          </span>
        </div>
        <div style={labelValueStyle}>
          <span style={labelStyle}>Blood Group</span>
          <span style={valueStyle}>{staff.raw_details?.bloodGroup || '-'}</span>
        </div>
        <div style={{ ...labelValueStyle, marginTop: '2px' }}>
          <span style={labelStyle}>Address</span>
          <span style={{ ...valueStyle, fontSize: '7.5px', lineHeight: 1.1, fontWeight: 600, color: '#475569' }}>
            {staff.raw_details?.address || '-'}
          </span>
        </div>
      </div>

      {/* Footer Area */}
      <div style={{ padding: '6px 6px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '50px', height: '0.5px', background: '#94a3b8', marginBottom: '4px' }} />
          <div style={{ fontSize: '6px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Authorized
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
          <div style={{ opacity: 0.8, color: '#000' }}>
            <QrCode size={22} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: '4.5px', color: '#94a3b8', fontWeight: 600 }}>Scan to Verify</div>
        </div>
      </div>

      {/* Accent Line */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: themeColor }} />
    </div>
  );
}
