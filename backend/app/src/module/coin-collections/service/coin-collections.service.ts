import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CoinCollection, CoinCollectionDocument } from '../schema/coin-collection.schema';
import { Model, Types } from 'mongoose';
import { Landmark, LandmarkDocument } from '../schema/landmark.schema';
import { queryAll, queryDeleteOne, queryFindOne } from 'src/pkg/helper/query.util';
import { CreateCoinCollectionDto } from '../dto/coin-collections/create-coin-collection.dto';
import { UserDocument } from 'src/module/users/schemas/user.schema';
import { CoinCollectionsHelper } from '../utils/coin-collections.helper';
import { EvoucherCode, EvoucherCodeDocument } from 'src/module/evouchers/schemas/evoucher-code.schema';
import { Evoucher, EvoucherDocument } from 'src/module/evouchers/schemas/evoucher.schema';
import { NotificationsService } from 'src/module/notifications/notifications.service';

@Injectable()
export class CoinCollectionsService {
  constructor(
    @InjectModel(CoinCollection.name) private coinCollectionModel: Model<CoinCollectionDocument>,
    @InjectModel(Landmark.name) private landmarkModel: Model<LandmarkDocument>,
    @InjectModel(EvoucherCode.name) private evoucherCodeModel: Model<EvoucherCodeDocument>,
    @InjectModel(Evoucher.name) private evoucherModel: Model<EvoucherDocument>,
    private notificationsService: NotificationsService,
    private coinCollectionsHelper: CoinCollectionsHelper,
  ) { }

  async collectCoin(createCoinCollectionDto: CreateCoinCollectionDto) {
    const landmarkObjectId = new Types.ObjectId(createCoinCollectionDto.landmark);
    const userObjectId = new Types.ObjectId(createCoinCollectionDto.user);

    const landmark = await this.landmarkModel.findById(landmarkObjectId);
    this.coinCollectionsHelper.checkLandmarkExists(landmark);
    this.coinCollectionsHelper.checkDistance(
      createCoinCollectionDto.userLat,
      createCoinCollectionDto.userLong,
      landmark.location.latitude,
      landmark.location.longitude,
      landmark.limitDistance,
    );

    const cooldownCheck = await this.coinCollectionModel.find({
      landmarks: {
        $elemMatch: {
          landmark: landmarkObjectId,
          collectedAt: { $gte: new Date(Date.now() - landmark.cooldown) },
        },
      },
    });

    let remainingCooldownMs = 0;

    if (cooldownCheck.length > 0) {
      const collectedTimestamps: Date[] = [];
      cooldownCheck.forEach((doc) => {
        doc.landmarks.forEach((item) => {
          if (
            item.landmark.equals(landmarkObjectId) &&
            item.collectedAt >= new Date(Date.now() - landmark.cooldown)
          ) {
            collectedTimestamps.push(item.collectedAt);
          }
        });
      });

      if (collectedTimestamps.length > 0) {
        const newest = new Date(Math.max(...collectedTimestamps.map(d => d.getTime())));
        const cooldownEnd = newest.getTime() + landmark.cooldown;
        remainingCooldownMs = Math.max(cooldownEnd - Date.now(), 0);
      }

      this.coinCollectionsHelper.checkCooldown(cooldownCheck, remainingCooldownMs);
    }
    const userCollection = await this.coinCollectionModel.findOne({
      user: userObjectId,
    });
    this.coinCollectionsHelper.checkAlreadyCollected(userCollection, landmarkObjectId);

    if (!userCollection) {
      const newCollection = this.coinCollectionsHelper.buildNewCoinCollection(
        userObjectId,
        landmarkObjectId,
      );
      await this.coinCollectionModel.create(newCollection);
    } else {
      userCollection.landmarks.push(
        this.coinCollectionsHelper.buildCollectedLandmark(landmarkObjectId),
      );
      await userCollection.save();
    }

    const droppedEvoucher = await this.dropEvoucherRate(landmarkObjectId, userObjectId);

    return {
      message: droppedEvoucher
        ? `Coin collected successfully, and you got an evoucher: ${droppedEvoucher.code}`
        : 'Coin collected successfully',
      evoucher: droppedEvoucher ?? null,
    };
  }


  async findAll(query: Record<string, string>) {
    return await queryAll<CoinCollection>({
      model: this.coinCollectionModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'landmarks.landmark' }]),
    });
  }

  async findOne(id: string) {
    return await queryFindOne<CoinCollection>(
      this.coinCollectionModel,
      { _id: id },
      [
        { path: 'landmarks.landmark' }
      ]
    );
  }

  async remove(id: string) {
    await queryDeleteOne<CoinCollection>(this.coinCollectionModel, id,);
    return {
      message: 'Coin collection deleted successfully',
      id,
    }
  }

  async getLeaderboard(query: Record<string, string>) {
    const limit = Number(query.limit) || 1000;
    const collections = await this.coinCollectionModel.find({})
      .populate({
        path: 'user',
        select: ['username', 'name'],
      })
      .populate({
        path: 'landmarks.landmark',
        model: 'Landmark',
        select: 'type',
      })
      .lean();

    const leaderboard = collections.map(c => {
      const normalLandmarks = c.landmarks.filter(l =>
        (l.landmark as any)?.type === 'normal'
      );

      const latestCollectedAt = c.landmarks.reduce((latest, curr) => {
        return !latest || new Date(curr.collectedAt) > latest
          ? new Date(curr.collectedAt)
          : latest;
      }, null as Date | null);

      const user = c.user as any;

      return {
        userId: user._id,
        username: user.username,
        name: user.name,
        coinCount: normalLandmarks.length,
        latestCollectedAt,
      };
    });

    leaderboard.sort((a, b) => {
      if (b.coinCount !== a.coinCount) return b.coinCount - a.coinCount;
      const aTime = a.latestCollectedAt?.getTime() ?? 0;
      const bTime = b.latestCollectedAt?.getTime() ?? 0;
      return aTime - bTime;
    });

    const leaderboardWithRank = leaderboard.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return {
      message: 'Leaderboard fetched successfully (NORMAL landmarks only)',
      data: leaderboardWithRank,
    };
  }

  async getUserRank(userId: string) {
    // ดึง coin collection ทั้งหมด พร้อม populate landmark และ user
    const allCollections = await this.coinCollectionModel.find({})
      .populate([
        { path: 'landmarks.landmark', model: 'Landmark', select: 'type', },
        { path: 'user', model: 'User', select: 'username name', },
      ]).lean();
    // สร้าง leaderboard ขึ้นมาจาก type === 'normal'
    const leaderboard = allCollections.map(c => {
      const normalLandmarks = c.landmarks.filter(l => (l.landmark as any)?.type === 'normal');

      const latestCollectedAt = c.landmarks.reduce((latest, curr) => {
        return !latest || new Date(curr.collectedAt) > latest ? new Date(curr.collectedAt) : latest;
      }, null as Date | null);

      const user = c.user as any as UserDocument;

      return {
        userId: user._id,
        username: user.username,
        name: user.name,
        coinCount: normalLandmarks.length,
        latestCollectedAt,
      };
    });

    // เรียงตาม coinCount และ collectedAt (เร็วที่สุดอยู่บน)
    leaderboard.sort((a, b) => {
      if (b.coinCount !== a.coinCount) return b.coinCount - a.coinCount;
      const aTime = a.latestCollectedAt?.getTime() ?? 0;
      const bTime = b.latestCollectedAt?.getTime() ?? 0;
      return aTime - bTime;
    });

    // หาอันดับของ user
    const userIndex = leaderboard.findIndex(entry => entry.userId.toString() === userId);

    if (userIndex === -1) { throw new NotFoundException('User not found in coin collection'); }
    // Return rank and user info
    return {
      username: leaderboard[userIndex].username,
      name: leaderboard[userIndex].name,
      coinCount: leaderboard[userIndex].coinCount,
      rank: userIndex + 1,
    };
  }

  async getSponsorRewardUsers(landmarkId: string) {
    const collections = await this.coinCollectionModel.find({})
      .populate({
        path: 'user',
        select: ['username', 'name'],
      })
      .populate({
        path: 'landmarks.landmark',
        model: 'Landmark',
        select: 'type name',
      }).lean();

    const listUserReward = collections.map(c => {
      const sponsorLandmarks = c.landmarks.filter(l => {
        const lm = l.landmark as any;
        return lm.type === 'sponsor' && lm._id.toString() === landmarkId;
      });

      const latestCollectedAt = sponsorLandmarks.reduce((latest, curr) => {
        return !latest || new Date(curr.collectedAt) > latest
          ? new Date(curr.collectedAt)
          : latest;
      }, null as Date | null);

      const user = c.user as any;

      return {
        username: user.username,
        name: user.name,
        userId: user._id,
        coinCount: sponsorLandmarks.length,
        latestCollectedAt,
        landmarks: sponsorLandmarks.map(l => ({
          landmark: l.landmark,
          collectedAt: l.collectedAt,
        })),
      };
    }).filter(u => u.coinCount > 0);

    const ranked = listUserReward.sort((a, b) => {
      const aTime = a.latestCollectedAt?.getTime() ?? 0;
      const bTime = b.latestCollectedAt?.getTime() ?? 0;
      return aTime - bTime;
    });

    return ranked.map((u, index) => ({
      ...u,
      rank: index + 1,
    }));
  }

  async dropEvoucherRate(landmarkId: Types.ObjectId, userId: Types.ObjectId) {
    const collectedCount = await this.coinCollectionModel.countDocuments({
      landmarks: { $elemMatch: { landmark: landmarkId } }
    });
    
    if (collectedCount === 0) return null;

    //ใช้โอกาสแจกตรง ๆ เช่น 1 ใน 27
    const dropChance = 1 / 4;
    if (Math.random() >= dropChance) {
      return null; // ไม่แจกครั้งนี้
    }

    // หา user เคยได้ landmark + รอบนี้แล้วหรือยัง
    const alreadyClaimed = await this.evoucherCodeModel.findOne({
      user: userId,
      'metadata.source': 'auto-drop',
      'metadata.landmark': landmarkId.toString(),
      'metadata.round': collectedCount,
    });
    
    if (alreadyClaimed) return;

    // หา evoucher ที่ยังไม่เคยได้
    const now = new Date();
    const exclude = await this.evoucherCodeModel.distinct('evoucher', { user: userId });
    const evoucher = await this.evoucherModel.findOne({
      _id: { $nin: exclude },
    });

    if (!evoucher) throw new BadRequestException('No new evoucher available for you');

    // claim code
    const claimed = await this.forceClaimEvoucherCode(
      evoucher._id.toString(),
      userId.toString(),
    );

    await this.evoucherCodeModel.updateOne(
      { code: claimed.code },
      {
        $set: {
          'metadata.source': 'auto-drop',
          'metadata.landmark': landmarkId.toString(),
        },
      },
    );

    return claimed;
  }

  async forceClaimEvoucherCode(evoucherId: string, userId: string) {
    const code = await this.evoucherCodeModel.findOneAndUpdate(
      { isUsed: false, user: null, evoucher: new Types.ObjectId(evoucherId) },
      { $set: { user: new Types.ObjectId(userId) } },
      { sort: { createdAt: 1 }, new: true },
    );

    if (!code) {
      throw new NotFoundException('No available evoucher codes to claim');
    } else {

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
          en: `You have received the evoucher "${evoucher.name.en}" successfully.`,
          th: `คุณได้รับคูปอง "${evoucher.name.th}" เรียบร้อยแล้ว`,
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
    }

    return {
      message: 'Evoucher code claimed successfully',
      code: code.code,
    };
  }

  async myCoin(userId: string) {
    const coin = await queryAll<CoinCollection>({
      model: this.coinCollectionModel,
      query: { user: userId },
      populateFields: () => Promise.resolve([
        { path: 'user' },
        { path: 'landmarks.landmark' }
      ])
    })
    return coin
  }

}