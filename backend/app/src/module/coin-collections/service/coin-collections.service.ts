import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CoinCollection, CoinCollectionDocument } from '../schema/coin-collection.schema';
import { Model, Types } from 'mongoose';
import { Landmark, LandmarkDocument } from '../schema/landmark.schema';
import { queryAll, queryDeleteOne, queryFindOne } from 'src/pkg/helper/query.util';
import { CollectCoinDto } from '../dto/coin-collections/coin-collectoin.dto';
import { UserDocument } from 'src/module/users/schemas/user.schema';
import { CoinCollectionsHelper } from '../utils/coin-collections.helper';
import { EvoucherCode, EvoucherCodeDocument } from 'src/module/evouchers/schemas/evoucher-code.schema';
import { Evoucher, EvoucherDocument } from 'src/module/evouchers/schemas/evoucher.schema';
import { EvoucherCodesService } from 'src/module/evouchers/services/evoucher-codes.service';

@Injectable()
export class CoinCollectionsService {
  constructor(
    @InjectModel(CoinCollection.name) private coinCollectionModel: Model<CoinCollectionDocument>,
    @InjectModel(Landmark.name) private landmarkModel: Model<LandmarkDocument>,
    @InjectModel(EvoucherCode.name) private evoucherCodeModel: Model<EvoucherCodeDocument>,
    @InjectModel(Evoucher.name) private evoucherModel: Model<EvoucherDocument>,
    private evoucherCodeService: EvoucherCodesService,
    private coinCollectionsHelper: CoinCollectionsHelper,
  ) { }

  async collectCoin(collectCoinDto: CollectCoinDto) {
    const landmarkObjectId = new Types.ObjectId(collectCoinDto.landmark);
    const userObjectId = new Types.ObjectId(collectCoinDto.user);

    const landmark = await this.landmarkModel.findById(landmarkObjectId);
    this.coinCollectionsHelper.checkLandmarkExists(landmark);
    this.coinCollectionsHelper.checkDistance(
      collectCoinDto.userLat,
      collectCoinDto.userLong,
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
    this.coinCollectionsHelper.checkCooldown(cooldownCheck);

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

    const droppedEvoucher = await this.dropEvoucherIfNeeded(landmarkObjectId, userObjectId);

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

  // async getLeaderboard(limit = 5) {
  //   const collections = await this.coinCollectionModel.find({}).populate('user')
  //     .populate({
  //       path: 'user',
  //       select: ['username', 'name',],
  //     })
  //     .populate({
  //       path: 'landmarks.landmark',
  //       model: 'Landmark',
  //       select: 'type',
  //     })
  //     .lean();

  //   // 2. คำนวณ coinCount เฉพาะที่เป็น type === 'normal'
  //   const leaderboard = collections.map(c => {
  //     const normalLandmarks = c.landmarks.filter(l =>
  //       (l.landmark as any as LandmarkDocument)?.type === 'normal'
  //     );

  //     const latestCollectedAt = c.landmarks.reduce((latest, curr) => {
  //       return !latest || new Date(curr.collectedAt) > latest
  //         ? new Date(curr.collectedAt)
  //         : latest;
  //     }, null as Date | null);

  //     const user = c.user as any as UserDocument;

  //     return {
  //       userId: user._id,
  //       username: user.username,
  //       name: user.name,
  //       coinCount: normalLandmarks.length,
  //       latestCollectedAt,
  //     };
  //   });

  //   // 3. เรียงลำดับตาม coinCount และ latestCollectedAt
  //   leaderboard.sort((a, b) => {
  //     if (b.coinCount !== a.coinCount) return b.coinCount - a.coinCount;
  //     const aTime = a.latestCollectedAt?.getTime() ?? 0;
  //     const bTime = b.latestCollectedAt?.getTime() ?? 0;
  //     return aTime - bTime;
  //   });

  //   // 4. ตัดให้เหลือตาม limit และใส่อันดับ
  //   const leaderboardWithRank = leaderboard.slice(0, limit).map((entry, index) => ({
  //     ...entry,
  //     rank: index + 1,
  //   }));

  //   return {
  //     message: 'Leaderboard fetched successfully (NORMAL landmarks only)',
  //     data: leaderboardWithRank,
  //   };
  // }

  async getLeaderboard(query: Record<string, string>) {
    const limit = Number(query.limit) || 5;
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

  async getSponsorRewardUsers() {
    const collections = await this.coinCollectionModel.find({})
      .populate({
        path: 'user',
        select: ['username', 'name'],
      })
      .populate({
        path: 'landmarks.landmark',
        model: 'Landmark',
        select: 'type name hint location coinAmount',
      }).lean();

    const listUserReward = collections.map(c => {
      const sponsorLandmarks = c.landmarks.filter(l => (l.landmark as any)?.type === 'sponsor');

      const latestCollectedAt = c.landmarks.reduce((latest, curr) => {
        return !latest || new Date(curr.collectedAt) > latest
          ? new Date(curr.collectedAt)
          : latest;
      }, null as Date | null);

      const user = c.user as any;

      return {
        username: user.username,
        name: user.name,
        coinCount: sponsorLandmarks.length,
        latestCollectedAt,
        landmarks: sponsorLandmarks.map(l => ({
          landmark: l.landmark,
          collectedAt: l.collectedAt,
        })),
      };
    });

    return listUserReward;
  }

  async dropEvoucherIfNeeded(landmarkId: Types.ObjectId, userId: Types.ObjectId) {
    // นับจำนวนครั้ง landmark นี้ถูกเก็บ โดยใช้ countDocuments กับเงื่อนไขที่ $elemMatch
    const collectedCount = await this.coinCollectionModel.countDocuments({
      landmarks: { $elemMatch: { landmark: landmarkId } }
    });
    if (collectedCount === 0) return null; // ถ้า 0 ไม่แจก
    //  สุ่มเลข magic number 0-2 เพื่อ randomize รอบแจก 0-26
    const randomOffset = Math.floor(Math.random() * 26);
    // เอา collectedCount + randomOffset มาตรวจสอบว่า % 27 === 0
    if ((collectedCount + randomOffset) % 27 === 0) {
      // เช็ค user เคยได้รอบนี้หรือยัง
      const alreadyClaimed = await this.evoucherCodeModel.findOne({
        user: userId,
        'metadata.source': 'auto-drop',
        'metadata.landmark': landmarkId.toString(),
        'metadata.round': collectedCount,
      });
      if (alreadyClaimed) return;
      // หา Evoucher ที่อยู่ในช่วงเวลาปัจจุบัน (active)
      const now = new Date();
      const evoucher = await this.evoucherModel.findOne({
        startAt: { $lte: now },
        endAt: { $gte: now },
      });
      if (!evoucher) throw new BadRequestException('No active evoucher available');
      // เรียก claimEvoucherCode ที่ service
      const claimed = await this.evoucherCodeService.claimEvoucherCode(
        evoucher._id.toString(),
        userId.toString(),
      );
      // อัพเดต metadata เพิ่มเติมหลังจาก claim สำเร็จ
      await this.evoucherCodeModel.updateOne(
        { code: claimed.code },
        { $set: { 'metadata.source': 'auto-drop', 'metadata.landmark': landmarkId.toString(), 'metadata.round': collectedCount, }, },
      );
      return claimed;
    }
    return null;
  }
}