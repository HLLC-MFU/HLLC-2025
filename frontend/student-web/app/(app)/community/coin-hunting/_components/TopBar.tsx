'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  onScan?: () => void;
  onStamp: () => void;
  centerText?: string;
  onLeaderboard?: () => void;
}

export default function TopBar({ onStamp }: TopBarProps) {
  const router = useRouter();

  return (
    <div style={styles.container}>
      <div style={styles.innerRow}>
        <button onClick={onStamp} style={styles.iconBtn}>
          <img
            src="/images/logo-sdad.png"
            alt="Stamp Icon"
            style={styles.stampIcon}
          />
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
  },
  innerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    minWidth: 260,
    paddingRight: 20,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.15)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 4px',
    border: 'none',
    cursor: 'pointer',
  },
  stampIcon: {
    width: 24,
    height: 24,
    objectFit: 'contain',
  },
};
