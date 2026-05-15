import React from 'react';
import type { ErpStaff } from '../../../hooks/useErpAcademics';
import _QRCode from "react-qr-code";
const QRCode = (_QRCode as any).default || _QRCode;
import { 
  BookOpen, 
  CheckCircle2, 
  Package, 
  ClipboardCheck
} from 'lucide-react';

interface UniversalIDCardProps {
  staff: ErpStaff;
  school: any;
}

export default function UniversalIDCard({ staff, school }: UniversalIDCardProps) {
  const themeColor = school?.theme_color || '#7c3aed';
  
  // Payload for automation systems
  const qrValue = `LEARNBEE|${school?.id || 'SCHOOL'}|${staff.id}|STAFF`;

  const cardStyle: React.CSSProperties = {
    width: '54mm',
    height: '85.6mm',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', system-ui, sans-serif",
    border: `2px solid ${themeColor}`,
    margin: '0 auto',
    color: '#1e293b',
  };

  const headerStyle: React.CSSProperties = {
    background: themeColor,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#fff',
    textAlign: 'center',
  };

  const qrSectionStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: `${themeColor}05`,
    position: 'relative',
  };

  const qrContainerStyle: React.CSSProperties = {
    padding: '12px',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
    border: `1px solid ${themeColor}20`,
    position: 'relative',
  };

  const moduleIconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '7px',
    fontWeight: 700,
    color: themeColor,
    padding: '4px 8px',
    background: `${themeColor}10`,
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const empId = staff.raw_details?.empCode || staff.id.slice(0, 8).toUpperCase();

  return (
    <div className="id-card-printable" style={cardStyle}>
      {/* Top Banner */}
      <div style={headerStyle}>
        <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Universal Staff Access
        </div>
        <div style={{ fontSize: '7px', opacity: 0.9, fontWeight: 500, marginTop: '2px' }}>
          {school?.name || 'LearnBee Academy'}
        </div>
      </div>

      {/* Staff Brief */}
      <div style={{ padding: '16px 14px 12px', borderBottom: `1px dashed ${themeColor}30`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: '12px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {staff.profiles?.full_name || 'Teacher Fullname'}
          </div>
          <div style={{ fontSize: '8px', color: themeColor, fontWeight: 700, marginTop: '4px', opacity: 0.8 }}>
            FACULTY CODE: {empId}
          </div>
        </div>
      </div>

      {/* QR Code Centerpiece */}
      <div style={qrSectionStyle}>
        {/* Decorative corner accents */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: `2px solid ${themeColor}`, borderLeft: `2px solid ${themeColor}`, opacity: 0.3 }} />
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: `2px solid ${themeColor}`, borderRight: `2px solid ${themeColor}`, opacity: 0.3 }} />
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: `2px solid ${themeColor}`, borderLeft: `2px solid ${themeColor}`, opacity: 0.3 }} />
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: `2px solid ${themeColor}`, borderRight: `2px solid ${themeColor}`, opacity: 0.3 }} />

        <div style={qrContainerStyle}>
          <div style={{ marginBottom: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '5px', fontWeight: 900, color: themeColor, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8 }}>
              Scan for Access
            </div>
          </div>
          <QRCode 
            value={qrValue}
            size={100}
            level="H"
            fgColor={themeColor}
          />
          {/* Subtle Logo Overlay in QR */}
          <div style={{ 
            position: 'absolute', 
            top: 'calc(50% + 6px)',
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            padding: '3px',
            borderRadius: '4px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <BookOpen size={14} color={themeColor} />
          </div>
        </div>
        
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '7px', fontWeight: 800, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            System ID: {staff.id.split('-')[0].toUpperCase()}
          </div>
          <div style={{ height: '1px', width: '20px', background: themeColor, margin: '4px auto', opacity: 0.3 }} />
        </div>
      </div>

      {/* Automation Modules */}
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ fontSize: '6px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px', letterSpacing: '0.05em' }}>
          Enabled Modules
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <div style={moduleIconStyle}>
            <CheckCircle2 size={8} /> Attendance
          </div>
          <div style={moduleIconStyle}>
            <BookOpen size={8} /> Library
          </div>
          <div style={moduleIconStyle}>
            <Package size={8} /> Inventory
          </div>
          <div style={moduleIconStyle}>
            <ClipboardCheck size={8} /> Payroll/ERP
          </div>
        </div>
      </div>

      {/* Security Footer */}
      <div style={{ background: '#f8fafc', padding: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontSize: '5px', color: '#94a3b8', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          This card is property of {school?.name || 'LearnBee Academy'}. 
          <br />If found, please return to any authorized staff member.
        </div>
      </div>
    </div>
  );
}
