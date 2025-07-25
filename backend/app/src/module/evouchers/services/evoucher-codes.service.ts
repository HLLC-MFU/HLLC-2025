import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Evoucher, EvoucherDocument } from '../schemas/evoucher.schema';
import {
  EvoucherCode,
  EvoucherCodeDocument,
} from '../schemas/evoucher-code.schema';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { UpdateEvoucherCodeDto } from '../dto/update-evouchercodes.dto';
import { queryAll } from 'src/pkg/helper/query.util';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { NotificationsService } from 'src/module/notifications/notifications.service';
import { KhantokDto } from '../dto/khantok.dto';

@Injectable()
export class EvoucherCodesService {
  constructor(
    @InjectModel(Evoucher.name)
    private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(EvoucherCode.name)
    private codeModel: Model<EvoucherCodeDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService
  ) { }

  async findAll() {
    return this.codeModel
      .find()
      .populate([{ path: 'user' }, { path: 'evoucher' }])
      .lean();
  }

  async findOne(id: string) {
    return this.evoucherModel
      .findById(id)
      .populate([{ path: 'user' }, { path: 'evoucher' }])
      .lean();
  }

  async update(id: string, updateDto: UpdateEvoucherCodeDto) {
    return this.codeModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );
  }

  async remove(id: string) {
    return this.codeModel.findByIdAndDelete(id).lean();
  }

  // ฟังก์ชันหลักสำหรับ generate codes
  private generateCode(acronym: string): string {
    const randomHex = crypto.randomBytes(8).toString('hex').toUpperCase(); // 16 chars
    return `${acronym}-${randomHex}`;
  }

  async generateCodesForEvoucher(evoucherId: string, amountOverride?: number) {
    const evoucher = await this.evoucherModel.findById(evoucherId).lean();
    if (!evoucher) throw new Error('Evoucher not found');

    const amount = amountOverride ?? evoucher.amount;
    const acronym = evoucher.acronym;

    const codesToInsert = new Set<string>();

    while (codesToInsert.size < amount) {
      const newCode = this.generateCode(acronym);
      if (!codesToInsert.has(newCode)) {
        const exists = await this.codeModel.exists({ code: newCode });
        if (!exists) codesToInsert.add(newCode);
      }
    }

    const bulkData = Array.from(codesToInsert).map((code) => ({
      code,
      isUsed: false,
      usedAt: null,
      user: null,
      evoucher: new Types.ObjectId(evoucherId),
    }));

    const inserted = await this.codeModel.insertMany(bulkData);
    return {
      success: true,
      insertedCount: inserted.length,
      evoucher: evoucherId,
    };
  }

  async claimEvoucherCode(evoucherId: string, userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(`Invalid userId: ${userId}`);
    }

    if (!Types.ObjectId.isValid(evoucherId)) {
      throw new BadRequestException(`Invalid evoucherId: ${evoucherId}`);
    }
    const existing = await this.codeModel.findOne({
      evoucher: new Types.ObjectId(evoucherId),
      user: new Types.ObjectId(userId),
    });

    if (existing) {
      throw new BadRequestException('You have already claimed this evoucher');
    }
    const code = await this.codeModel.findOneAndUpdate(
      { isUsed: false, user: null, evoucher: new Types.ObjectId(evoucherId) },
      { $set: { user: new Types.ObjectId(userId) } },
      { sort: { createdAt: 1 }, new: true },
    );

    if (!code) {
      throw new NotFoundException('No available evoucher codes to claim');
    }

    const evoucher = await this.evoucherModel.findById(evoucherId).lean();
    if (!evoucher) {
      throw new NotFoundException('Evoucher not found');
    }

    await this.notificationsService.create({
      title: {
        en: 'Get Evoucher successfully',
        th: 'ได้รับคูปองสำเร็จ',
      },
      subtitle: {
        en: '',
        th: '',
      },
      body: {
        en: `You have received the evoucher "${evoucher.name?.en ?? 'Evoucher'}" successfully.`,
        th: `คุณได้รับคูปอง "${evoucher.name?.th ?? 'คูปอง'}" เรียบร้อยแล้ว`,
      },
      icon: 'Ticket',
      image: evoucher.photo.home ?? undefined,
      scope: [
        {
          type: 'user',
          id: [userId],
        },
      ],
    });

    return {
      message: 'Evoucher code claimed successfully',
      code: code.code,
    };
  }

  async useEvoucher(id: string) {
    const now = new Date();
    const code = (await this.codeModel
      .findOne({
        _id: new Types.ObjectId(id),
        isUsed: false,
      })
      .populate('evoucher')) as unknown as {
        evoucher: EvoucherDocument;
        isUsed: boolean;
        usedAt?: Date;
        code: string;
        save: () => Promise<any>;
      };

    if (!code) {
      throw new BadRequestException('Evoucher not found or already used');
    }

    const startAt = new Date(code.evoucher.startAt);
    const endAt = new Date(code.evoucher.endAt);

    if (now < startAt || now > endAt) {
      throw new BadRequestException(
        `This Evoucher is can't use for this time or expired`,
      );
    }

    code.isUsed = true;
    code.usedAt = now;
    await code.save();

    return {
      message: 'Evoucher used successfully',
      code: code.code,
    };
  }

  async getUserEvoucherCodes(userId: string) {
    const codes = await queryAll<EvoucherCode>({
      model: this.codeModel,
      query: { user: userId },
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'evoucher' }]),
    });

    return codes;
  }

  async addEvoucherCode(userId: string, evoucherId: string) {
    const code = await this.claimEvoucherCode(evoucherId, userId);
    return {
      message: 'Evoucher added successfully',
      code,
    };
  }

  async addEvoucherCodeByRole(roleId: string, evoucherId: string) {
    const users = await this.userModel
      .find({
        role: new Types.ObjectId(roleId),
      })
      .lean();

    if (users.length === 0) {
      throw new NotFoundException('No users found with this role');
    }

    const results: { userId: string; status: string; code?: string }[] = [];

    for (const user of users) {
      try {
        const claimed = await this.claimEvoucherCode(
          evoucherId,
          user._id.toString(),
        );
        results.push({
          userId: user._id.toString(),
          status: 'success',
          code: claimed.code,
        });
      } catch (err) {
        results.push({
          userId: user._id.toString(),
          status: 'failed',
          code: err.message,
        });
      }
    }

    return {
      message: `Evoucher codes processed for role ${roleId}`,
      total: users.length,
      results,
    };
  }

  async addEvoucherCodeKhantok(usernames: string[], evoucherId: string) {
    if (!Array.isArray(usernames)) {
      throw new Error(`usernames is not an array. Got: ${typeof usernames}`);
    }
    const users = await this.userModel.find({
      username: { $in: usernames },
    }).lean();

    const usernameToIdMap = new Map(users.map(u => [u.username, u._id.toString()]));

    const results: {
      username: string;
      userId?: string;
      status: string;
      code?: string;
    }[] = [];

    for (const username of usernames) {
      const userId = usernameToIdMap.get(username);

      if (!userId) {
        results.push({
          username,
          status: 'failed',
          code: 'User not found',
        });
        continue;
      }

      try {
        const claimed = await this.claimEvoucherCode(evoucherId, userId);
        results.push({
          username,
          userId,
          status: 'success',
          code: claimed.code,
        });
      } catch (err) {
        results.push({
          username,
          userId,
          status: 'failed',
          code: err.message,
        });
      }
    }

    return {
      message: `Evoucher processed for ${usernames.length} usernames`,
      total: usernames.length,
      results,
    };
  }

 async findUsersWithoutEvoucher(evoucherId: string) {
  const codes = await this.codeModel
    .find({ evoucher: new Types.ObjectId(evoucherId) })
    .select('user')
    .lean();

  const userIdsWithEvoucher = codes.map(code => code.user?.toString());
  const users = await this.userModel
    .find({ _id: { $nin: userIdsWithEvoucher } })
    .populate({
      path: 'role',
      select: 'name',
    }).lean<{ username: string; role: { name: string } }[]>();
  const fresherUsers = users.filter(user => user.role?.name.toLowerCase() === 'fresher');
  const usernames = fresherUsers.map(user => user.username);

  return {
    usernames,
  };
}
}
