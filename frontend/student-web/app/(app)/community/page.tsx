import Link from "next/link";

export default function CommunityPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Coming Soon</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>ฟีเจอร์นี้กำลังอยู่ระหว่างการพัฒนา</p>
      <Link href="/community/coin-hunting" style={{
        marginTop: '2rem',
        padding: '0.75rem 2rem',
        background: '#0070f3',
        color: '#fff',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '1.1rem',
        textDecoration: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'background 0.2s',
        display: 'inline-block',
      }}>
        ไปยังหน้า Coin Hunting
      </Link>
      <Link href="/community/chat"style={{
        marginTop: '2rem',
        padding: '0.75rem 2rem',
        background: '#0070f3',
        color: '#fff',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '1.1rem',
        textDecoration: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'background 0.2s',
        display: 'inline-block',
      }}>
        ไปยังหน้า Chat
      </Link>
    </div>
  );
}