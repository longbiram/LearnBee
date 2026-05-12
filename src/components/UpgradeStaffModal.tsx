import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Crown, Sparkles, Check, X, ArrowRight, Lock } from 'lucide-react';

interface UpgradeStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function UpgradeStaffModal({ isOpen, onClose, onUpgrade }: UpgradeStaffModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={styles.overlay}
        >
          {/* Backdrop click */}
          <div style={styles.backdrop} onClick={onClose} />

          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={styles.card}
          >
            {/* Close Button */}
            <button style={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>

            {/* Premium Icon Badge */}
            <div style={styles.iconContainer}>
              <div style={styles.outerGlow} />
              <div style={styles.innerCircle}>
                <Crown size={28} color="#fff" style={{ filter: 'drop-shadow(0 2px 8px rgba(124,58,237,0.5))' }} />
              </div>
            </div>

            <div style={styles.content}>
              <div style={styles.planBadge}>
                <Sparkles size={11} style={{ marginRight: 4 }} /> PREMIUM FEATURE
              </div>
              <h2 style={styles.title}>Upgrade Your Subscription</h2>
              <p style={styles.subtitle}>
                Non-teaching staff management is a premium feature. Upgrade to the <strong>Pro</strong> or <strong>Enterprise</strong> plan to register accountants, librarians, and clerks.
              </p>

              {/* Plans Comparison */}
              <div style={styles.comparisonGrid}>
                {/* Basic Plan (Current) */}
                <div style={styles.planColumnBasic}>
                  <div style={styles.columnHeader}>
                    <Shield size={16} color="#94a3b8" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>Basic Plan</span>
                    <span style={styles.currentBadge}>Current</span>
                  </div>
                  <div style={styles.featureList}>
                    <div style={styles.featureRowDisabled}><Lock size={12} /> Add School Staff</div>
                    <div style={styles.featureRowDisabled}><Lock size={12} /> Staff Dashboards</div>
                    <div style={styles.featureRow}><Check size={12} color="#10b981" /> Student Records</div>
                    <div style={styles.featureRow}><Check size={12} color="#10b981" /> Teacher Profiles</div>
                  </div>
                </div>

                {/* Pro Plan (Target) */}
                <div style={styles.planColumnPro}>
                  <div style={styles.columnHeader}>
                    <Crown size={16} color="#fbbf24" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>Pro Plan</span>
                    <span style={styles.upgradeTag}>Recommended</span>
                  </div>
                  <div style={styles.featureList}>
                    <div style={styles.featureRowHighlight}><Check size={12} color="#a78bfa" /> Unlimited Staff Members</div>
                    <div style={styles.featureRowHighlight}><Check size={12} color="#a78bfa" /> accountant, librarian, clerk roles</div>
                    <div style={styles.featureRowHighlight}><Check size={12} color="#a78bfa" /> Automated Fees & Payroll</div>
                    <div style={styles.featureRowHighlight}><Check size={12} color="#a78bfa" /> Library Book Tracker</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={styles.actionRow}>
                <button style={styles.cancelBtn} onClick={onClose}>
                  Maybe Later
                </button>
                <button style={styles.upgradeBtn} onClick={onUpgrade}>
                  Upgrade Now <ArrowRight size={15} style={{ marginLeft: 6 }} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    fontFamily: "'Outfit', system-ui, sans-serif",
  } as React.CSSProperties,

  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(4, 8, 20, 0.85)',
    backdropFilter: 'blur(12px)',
  } as React.CSSProperties,

  card: {
    position: 'relative',
    background: '#0a0f1d',
    border: '1px solid #1e293b',
    borderRadius: 24,
    width: '100%',
    maxWidth: 580,
    padding: '36px 32px 32px',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 50px 0px rgba(124, 58, 237, 0.15)',
    zIndex: 10001,
    overflow: 'hidden',
  } as React.CSSProperties,

  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '50%',
    width: 34,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,

  iconContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  outerGlow: {
    position: 'absolute',
    inset: -6,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)',
    filter: 'blur(4px)',
  } as React.CSSProperties,

  innerCircle: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
  } as React.CSSProperties,

  content: {
    textAlign: 'center',
  } as React.CSSProperties,

  planBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.2)',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 10,
    fontWeight: 800,
    color: '#fbbf24',
    letterSpacing: '0.08em',
    marginBottom: 12,
  } as React.CSSProperties,

  title: {
    fontSize: 24,
    fontWeight: 800,
    color: '#f8fafc',
    margin: '0 0 10px',
    letterSpacing: '-0.02em',
  } as React.CSSProperties,

  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    margin: '0 0 24px',
    lineHeight: 1.6,
  } as React.CSSProperties,

  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 28,
    textAlign: 'left',
  } as React.CSSProperties,

  planColumnBasic: {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: 16,
    padding: 16,
  } as React.CSSProperties,

  planColumnPro: {
    background: 'linear-gradient(145deg, #13112a 0%, #0d0f21 100%)',
    border: '1px solid rgba(124, 58, 237, 0.25)',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    boxShadow: '0 8px 20px rgba(124, 58, 237, 0.05)',
  } as React.CSSProperties,

  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  } as React.CSSProperties,

  currentBadge: {
    marginLeft: 'auto',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    padding: '2px 6px',
    fontSize: 9,
    fontWeight: 700,
    color: '#94a3b8',
  } as React.CSSProperties,

  upgradeTag: {
    marginLeft: 'auto',
    background: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 4,
    padding: '2px 6px',
    fontSize: 9,
    fontWeight: 700,
    color: '#fbbf24',
  } as React.CSSProperties,

  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  } as React.CSSProperties,

  featureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#94a3b8',
  } as React.CSSProperties,

  featureRowHighlight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#f1f5f9',
    fontWeight: 500,
  } as React.CSSProperties,

  featureRowDisabled: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#4b5563',
    textDecoration: 'line-through',
  } as React.CSSProperties,

  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: 20,
  } as React.CSSProperties,

  cancelBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,

  upgradeBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
    transition: 'all 0.2s',
  } as React.CSSProperties,
};
