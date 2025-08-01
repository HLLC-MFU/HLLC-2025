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
    const roleObjectId = new Types.ObjectId(roleId);
    const evoucherObjectId = new Types.ObjectId(evoucherId);

    // Step 1: Get users with that role
    const users = await this.userModel.find({ role: roleObjectId }).lean();
    if (users.length === 0) {
      throw new NotFoundException('No users found with this role');
    }

    // Step 2: Check if they already claimed
    const userIds = users.map((u) => u._id);
    const alreadyClaimed = await this.codeModel
      .find({ evoucher: evoucherObjectId, user: { $in: userIds } })
      .lean();

    const claimedUserIds = new Set(alreadyClaimed.map((c) => c.user.toString()));
    const usersToAssign = users.filter((u) => !claimedUserIds.has(u._id.toString()));

    if (usersToAssign.length === 0) {
      throw new NotFoundException('All users have already claimed this evoucher');
    }

    // Step 3: Get available codes
    const availableCodes = await this.codeModel
      .find({
        evoucher: evoucherObjectId,
        isUsed: false,
        user: null,
      })
      .sort({ createdAt: 1 })
      .limit(usersToAssign.length);

    if (availableCodes.length === 0) {
      throw new NotFoundException('No available evoucher codes to assign');
    }

    const bulkOps: any[] = [];
    const results: { userId: string; status: string; code?: string }[] = [];

    for (let i = 0; i < usersToAssign.length && i < availableCodes.length; i++) {
      const user = usersToAssign[i];
      const code = availableCodes[i];

      bulkOps.push({
        updateOne: {
          filter: { _id: code._id },
          update: { $set: { user: user._id } },
        },
      });

      results.push({
        userId: user._id.toString(),
        status: 'success',
        code: code.code,
      });
    }

    if (bulkOps.length > 0) {
      await this.codeModel.bulkWrite(bulkOps);
    }

    // Step 4: Optional – send notifications in parallel (no await per loop)
    // const evoucher = await this.evoucherModel.findById(evoucherId).lean();
    // if (evoucher) {
    //   const notifyTasks = results.map((res) =>
    //     this.notificationsService.create({
    //       title: {
    //         en: 'Get Evoucher successfully',
    //         th: 'ได้รับคูปองสำเร็จ',
    //       },
    //       subtitle: { en: '', th: '' },
    //       body: {
    //         en: `You have received the evoucher "${evoucher.name?.en ?? 'Evoucher'}" successfully.`,
    //         th: `คุณได้รับคูปอง "${evoucher.name?.th ?? 'คูปอง'}" เรียบร้อยแล้ว`,
    //       },
    //       icon: 'Ticket',
    //       image: evoucher.photo.home ?? undefined,
    //       scope: [{ type: 'user', id: [res.userId] }],
    //     }),
    //   );
    //   await Promise.allSettled(notifyTasks);
    // }

    return {
      message: `Evoucher codes processed for role ${roleId}`,
      total: users.length,
      processed: results.length,
      results,
    };
  }


  async addEvoucherCodeKhantok(usernames: string[], evoucherId: string) {
    if (!Array.isArray(usernames)) {
      throw new BadRequestException(`usernames is not an array. Got: ${typeof usernames}`);
    }
    const users = await this.userModel.find({
      username: { $in: usernames },
    }).lean();

    const usernameToIdMap = new Map(users.map(u => [u.username, u._id]));

    const availableCodes = await this.codeModel.find({
      evoucher: new Types.ObjectId(evoucherId),
      isUsed: false,
      user: null,
    }).limit(usernames.length).lean<{ _id: Types.ObjectId, code: string, isUsed: boolean, usedAt: Date | null, user: Types.ObjectId | null, evoucher: Types.ObjectId }[]>();
    const bulkOps: any[] = [];

    const results: {
      username: string;
      userId?: string;
      status: string;
      code?: string;
    }[] = [];
    let codeIndex = 0;

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

      const code = availableCodes[codeIndex++];
      if (!code) {
        results.push({
          username,
          userId: userId.toString(),
          status: 'failed',
          code: 'No available code',
        });
        continue;
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: code._id },
          update: {
            $set: {
              user: new Types.ObjectId(userId),
              isUsed: false,
              usedAt: null,
            },
          },
        },
      });

      results.push({
        username,
        userId: userId.toString(),
        status: 'success',
        code: code.code,
      });
    }

    if (bulkOps.length) {
      await this.codeModel.bulkWrite(bulkOps);
    }

    return {
      message: `Evoucher processed for ${results.length} usernames`,
      total: results.length,
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
