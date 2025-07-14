import { Localization } from './common';

export type MessageType =
  | 'message'
  | 'reply'
  | 'sticker'
  | 'mention'
  | 'evoucher'
  | 'unsend'
  | 'restriction'
  | 'upload'
  | 'reaction';

export type ChatNotificationPayload = {
  type: MessageType;
  room: {
    _id: string;
    name: Localization;
  };
  sender: {
    _id: string;
    username: string;
    name: {
      first: string;
      middle: string;
      last: string;
    };
    role: {
      _id: string;
      name: string;
    };
  };
  message: {
    _id: string;
    message: string;
    type: MessageType;
    timestamp: string;
  };
  receiver: string;
  timestamp: string;
};