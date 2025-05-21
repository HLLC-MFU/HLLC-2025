export const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
  '#073B4C', '#7B2CBF', '#5A189A', '#F72585', '#3A0CA3'
];

export const TYPING_TIMEOUT = 2000;
export const MAX_MESSAGE_LENGTH = 500;
export const SCROLL_DELAY = 100;

export const MESSAGE_TYPES = {
  JOIN: 'join',
  LEAVE: 'leave',
  TEXT: 'text'
} as const;

export const PLACEHOLDER_MESSAGES = {
  CONNECTING: 'กำลังเชื่อมต่อ...',
  TYPE_MESSAGE: 'พิมพ์ข้อความ...',
  JOIN_TO_CHAT: 'เข้าร่วมเพื่อแชท'
} as const;

export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'ไม่สามารถโหลดข้อมูลห้องแชทได้',
  JOIN_FAILED: 'ไม่สามารถเข้าร่วมห้องแชทได้',
  JOIN_ERROR: 'เกิดข้อผิดพลาดในการเข้าร่วมห้อง',
  ROOM_FULL: 'ห้องนี้มีสมาชิกเต็มแล้ว'
} as const; 