"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  MdCheckCircle,
  // MdGiftOff,
  MdLocationDisabled,
  MdAccessTime,
  MdErrorOutline,
  MdCheck,
  MdCardGiftcard,
  MdQrCodeScanner,
} from 'react-icons/md';


interface Evoucher {
  code: string;
}

type ModalType = 'success' | 'alert';
type AlertType = 'already-collected' | 'no-evoucher' | 'too-far' | 'cooldown';

const ALERT_CONFIGS = {
  'already-collected': {
    icon: 'MdCheckCircle',
    iconColor: '#f59e0b',
    title: 'Already Collected!',
    message: 'You have already collected this landmark. No new coins available.',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    titleColor: '#f59e0b',
  },
  'no-evoucher': {
    icon: 'MdGiftOff',
    iconColor: '#6b7280',
    title: 'No Evoucher Available',
    message: 'Sorry, no new evoucher is available for you at this time.',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    titleColor: '#6b7280',
  },
  'too-far': {
    icon: 'MdLocationDisabled',
    iconColor: '#ef4444',
    title: 'Too Far from Landmark',
    message: 'You are too far from the landmark. Please move closer to check in.',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    titleColor: '#ef4444',
  },
  'cooldown': {
    icon: 'MdAccessTime',
    iconColor: '#3b82f6',
    title: 'Landmark is in Cooldown',
    message: 'This landmark is in cooldown. Please try again later.',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    titleColor: '#3b82f6',
  },
  default: {
    icon: 'MdErrorOutline',
    iconColor: '#6b7280',
    title: 'Alert',
    message: 'Something went wrong.',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    titleColor: '#6b7280',
  },
};

interface CombinedModalProps {
  visible: boolean;
  type: ModalType;
  onClose: () => void;
  onGoToStamp?: () => void;
  evoucher?: Evoucher | null;
  alertType?: AlertType;
}

const styles: Record<string, React.CSSProperties> = {
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContentWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  modalContent: {
    background: 'rgba(18, 18, 18, 0.4)',
    borderRadius: 18,
    padding: 18,
    width: 320,
    boxShadow: '0 0 12px rgba(0,0,0,0.7)',
    position: 'relative',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: 'white',
    textAlign: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 12,
    background: 'transparent',
    border: 'none',
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    cursor: 'pointer',
    zIndex: 10,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 12px',
  },
  successTitle: {
    color: '#22ff55',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  evoucherContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  evoucherTitle: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: 'bold',
    margin: '8px 0 4px',
  },
  evoucherText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  evoucherCodeContainer: {
    marginTop: 0,
  },
  evoucherCodeLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  evoucherCode: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid rgba(251, 191, 36, 0.4)',
  },
  stampButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: '10px 8px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
    cursor: 'pointer',
    border: 'none',
    marginTop: 12,
    gap: 6,
  },
  okButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: '12px 24px',
    width: '100%',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    cursor: 'pointer',
    border: 'none',
    marginTop: 12,
  },
  alertIcon: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 16px',
    borderWidth: 2,
    borderStyle: 'solid',
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 16,
    lineHeight: '22px',
    color: 'white',
    margin: '0 10px',
  },
  successContent: {
    marginBottom: 18,
  },
  alertContent: {
    marginBottom: 18,
  },
};

const IconsMap = {
    'already-collected': MdCheckCircle,
    'no-evoucher': MdCardGiftcard,
    'too-far': MdLocationDisabled,
    'cooldown': MdAccessTime,
    default: MdErrorOutline,
  };
  
  export default function CombinedModal({
    visible,
    type,
    onClose,
    onGoToStamp,
    evoucher,
    alertType,
  }: CombinedModalProps) {
    const router = useRouter();
  
    if (!visible) return null;
  
    const config =
      type === 'alert' && alertType
        ? ALERT_CONFIGS[alertType] || ALERT_CONFIGS.default
        : ALERT_CONFIGS.default;
  
    const IconComponent = type === 'alert' && alertType
      ? IconsMap[alertType] || IconsMap.default
      : MdErrorOutline;
  
    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContentWrapper} onClick={e => e.stopPropagation()}>
          <div style={styles.modalContent}>
            <button style={styles.modalClose} onClick={onClose}>
              ×
            </button>
            {type === 'success' ? (
              <div style={styles.successContent}>
                <div style={styles.successIcon}>
                  <MdCheck size={80} color="#fff" />
                </div>
                <h2 style={styles.successTitle}>Check In Complete!</h2>
                {evoucher && (
                  <div style={styles.evoucherContainer}>
                    <MdCardGiftcard size={24} color="#fbbf24" />
                    <h3 style={styles.evoucherTitle}>🎉 Congratulations!</h3>
                    <p style={styles.evoucherText}>You got an evoucher!</p>
                    <div style={styles.evoucherCodeContainer}>
                      <p style={styles.evoucherCodeLabel}>Voucher Code:</p>
                      <p style={styles.evoucherCode}>{evoucher.code}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.alertContent}>
                <div
                  style={{
                    ...styles.alertIcon,
                    backgroundColor: config.backgroundColor,
                    borderColor: config.borderColor,
                  }}
                >
                  <IconComponent size={60} color={config.iconColor} />
                </div>
                <h2 style={{ ...styles.alertTitle, color: config.titleColor }}>
                  {config.title}
                </h2>
                <p style={styles.alertMessage}>{config.message}</p>
              </div>
            )}
            {type === 'success' ? (
              <button
                style={styles.stampButton}
                onClick={() => {
                  if (onGoToStamp) onGoToStamp();
                  else router.push('/stamp');
                }}
              >
                <MdQrCodeScanner size={20} style={{ marginRight: 6 }} />
                Go to Stamp Page
              </button>
            ) : (
              <button style={styles.okButton} onClick={onClose}>
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }