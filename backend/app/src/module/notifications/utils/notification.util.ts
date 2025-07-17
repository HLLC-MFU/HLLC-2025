import { Model, Types } from "mongoose";
import { MajorDocument } from "src/module/majors/schemas/major.schema";
import { UserDocument } from "src/module/users/schemas/user.schema";
import { Localization } from "src/pkg/types/common";
import { ChatMessage, EvoucherMessage, MentionMessage, StickerMessage, UploadMessage } from "src/pkg/types/kafka";
import { TargetDto } from "../dto/create-notification.dto";
import { ReceiversDto } from "../dto/push-notification.dto";

export function mapScopeToReceivers(
  scope: 'global' | TargetDto[],
): ReceiversDto | 'global' {
  if (scope === 'global') {
    return 'global';
  }

  const receivers: ReceiversDto = {};
  for (const target of scope) {
    if (target.type === 'school') {
      receivers.schools = [...(receivers.schools || []), ...target.id];
    } else if (target.type === 'major') {
      receivers.majors = [...(receivers.majors || []), ...target.id];
    } else if (target.type === 'user') {
      receivers.users = [...(receivers.users || []), ...target.id];
    }
  }

  return receivers;
}

export async function getUsersByRoles(
  userModel: Model<UserDocument>,
  roleIds: string[],
): Promise<Set<string>> {
  if (!roleIds.length) return new Set();
  const users = await userModel.find({
    role: { $in: roleIds.map(id => new Types.ObjectId(id)) },
  }).select('_id');
  return new Set(users.map(u => u._id.toString()));
}

export async function getUsersByMajors(
  userModel: Model<UserDocument>,
  majorIds: string[],
): Promise<Set<string>> {
  if (!majorIds.length) return new Set();
  const users = await userModel.find({
    'metadata.major': { $in: majorIds },
  }).select('_id');
  return new Set(users.map(u => u._id.toString()));
}

export async function getUsersBySchools(
  majorModel: Model<MajorDocument>,
  userModel: Model<UserDocument>,
  schoolIds: string[],
): Promise<Set<string>> {
  if (!schoolIds.length) return new Set();
  const matchedMajors = await majorModel.find({
    school: { $in: schoolIds.map(id => new Types.ObjectId(id)) },
  }).select('_id');

  if (!matchedMajors.length) return new Set();
  const majorIds = matchedMajors.map(m => m._id.toString());

  return getUsersByMajors(userModel, majorIds);
}

export async function getNotificationBody(message: ChatMessage): Promise<Localization> {
  switch (message.type) {
    case 'message':
    case 'reply':
    case 'restriction':
      return {
        th: message.message,
        en: message.message,
      };

    case 'sticker':
      return {
        th: 'ส่งสติ๊กเกอร์',
        en: 'Sent a sticker',
      };

    case 'upload':
      return {
        th: 'ส่งรูป',
        en: 'Sent an image',
      };

    case 'mention':
      return {
        th: message.message,
        en: message.message,
      };

    case 'evoucher':
      return {
        th: 'ส่ง e-voucher',
        en: 'Sent an e-voucher',
      };

    case 'unsend':
      return {
        th: 'ยกเลิกข้อความ',
        en: 'Unsent a message',
      };

    default:
      return {
        th: 'การแจ้งเตือน 1 รายการ',
        en: '1 new notification',
      };
  }
}

export async function getNotificationImage(message: ChatMessage): Promise<string | undefined> {
  switch (message.type) {
    case 'sticker': {
      const msg = message as StickerMessage;
      return msg.stickerInfo?.image;
    }

    case 'evoucher': {
      const msg = message as EvoucherMessage;
      return msg.evoucherInfo?.sponsorImage;
    }

    case 'upload': {
      const msg = message as UploadMessage;
      const imageName = msg.uploadInfo?.fileName ?? undefined;
      return imageName;
    }

    default:
      return;
  }
}

export async function getNotificationSubtitle(
  message: ChatMessage,
  room: { name: { th: string; en: string } },
  receiverId: string
): Promise<{ th: string; en: string; }> {
  if (message.type === 'mention') {
    const mentionMessage = message as MentionMessage;
    const isMentioned = mentionMessage.mentionInfo.some(m => m.userId === receiverId);
    if (isMentioned) {
      return {
        th: `ได้กล่าวถึงคุณ - ${room.name.th}`,
        en: `mentioned you - ${room.name.en}`,
      };
    }
  }

  // if (message.type === 'reply') {
  //   return {
  //     th: `ได้ตอบกลับคุณ - ${room.name.th}`,
  //     en: `replied to you - ${room.name.en}`,
  //   };
  // }

  return {
    th: room.name.th,
    en: room.name.en,
  };
}

type Name = {
  first: string;
  middle?: string;
  last?: string;
};

export async function formatDisplayName(name: Name): Promise<string> {
  const first = name.first?.trim();
  const middle = name.middle?.trim();
  const last = name.last?.trim();

  if (last) {
    return `${first} ${last[0]}.`;
  }

  if (middle) {
    return `${first} ${middle[0]}.`;
  }

  return first;
}