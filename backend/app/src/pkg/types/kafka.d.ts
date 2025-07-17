import { Localization } from './common';

export type MessageType =
  | 'message'
  | 'reply'
  | 'sticker'
  | 'mention'
  | 'evoucher'
  | 'unsend'
  | 'restriction'
  | 'upload';

type BaseMessage = {
  _id: string;
  message: string;
  type: MessageType;
  timestamp: string;
};

type ReplyMessage = BaseMessage & {
  type: 'reply';
  replyTo: {
    messageId: string;
  };
};

type MentionMessage = BaseMessage & {
  type: 'mention';
  mentionInfo: {
    userId: string;
    username: string;
  }[];
};

type StickerMessage = BaseMessage & {
  type: 'sticker';
  stickerInfo: {
    _id: string;
    image: string;
  };
};

type UploadMessage = BaseMessage & {
  type: 'upload';
  uploadInfo: {
    fileName: string;
  };
};

type EvoucherMessage = BaseMessage & {
  type: 'evoucher';
  evoucherInfo: {
    message: Localization;
    claimUrl: string;
    sponsorImage: string;
  };
};

type RestrictionMessage = BaseMessage & {
  type: 'restriction';
};

export type ChatMessage =
  | BaseMessage
  | ReplyMessage
  | MentionMessage
  | StickerMessage
  | UploadMessage
  | EvoucherMessage
  | RestrictionMessage;

export type ChatNotificationPayload = {
  type: MessageType;
  room: {
    _id: string;
    name: Localization;
    image: string;
  };
  sender: {
    _id: string;
    username: string;
    name: {
      first: string;
      middle: string;
      last: string;
    };
    role?: {
      _id: string;
      name: string;
    };
  };
  message: ChatMessage;
  receiver: string;
  timestamp: string;
};
