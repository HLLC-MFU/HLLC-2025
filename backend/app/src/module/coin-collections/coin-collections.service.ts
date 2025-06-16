import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CoinCollection, CoinCollectionDocument } from './schema/coin-collection.schema';
import { Model, Types } from 'mongoose';
import { Landmark, LandmarkDocument } from '../landmarks/schema/landmark.schema';
import { queryAll, queryDeleteOne, queryFindOne } from 'src/pkg/helper/query.util';
import { CollectCoinDto } from './dto/coin-collectoin.dto';

@Injectable()
export class CoinCollectionsService {
  constructor(
    @InjectModel(CoinCollection.name) private coinCollectionModel: Model<CoinCollectionDocument>,
    @InjectModel(Landmark.name) private landmarkModel: Model<LandmarkDocument>
  ) { }

  async collectCoin(collectCoinDto: CollectCoinDto) {
    const landmarkObjectId = new Types.ObjectId(collectCoinDto.landmark);

    // ดึงข้อมูล landmark พร้อม location
    const landmark = await this.landmarkModel.findById(landmarkObjectId).populate('location');
    if (!landmark) throw new NotFoundException('Landmark not found');

    // เช็คระยะห่างด้วย Haversine formula
    const distance = calculateDistance(
      collectCoinDto.userLat,
      collectCoinDto.userLong,
      landmark.location.latitude,
      landmark.location.longitude
    );
    if (distance > 50)
      throw new BadRequestException('You are too far from the landmark');

    // เช็ค cooldown: มี user คนใดเก็บ landmark นี้ในช่วง cooldown หรือเปล่า
    const cooldownCheck = await this.coinCollectionModel.find({
      landmarks: {
        $elemMatch: {
          landmark: landmarkObjectId,
          collectedAt: { $gte: new Date(Date.now() - landmark.cooldown) }
        }
      }
    });

    if (cooldownCheck.length > 0)
      throw new BadRequestException('Landmark is in cooldown');

    // เช็คว่าผู้ใช้งานคนนี้เคยเก็บ landmark นี้ไปแล้วหรือยัง
    const userObjectId = new Types.ObjectId(collectCoinDto.user);
    const userCollection = await this.coinCollectionModel.findOne({ user: userObjectId });

    if (userCollection?.landmarks.some(item => item.landmark.equals(landmarkObjectId)))
      throw new BadRequestException('Already collected this landmark');

    // เช็ค limit 14 landmark
    if ((userCollection?.landmarks?.length ?? 0) >= 14)
      throw new BadRequestException('Maximum coins collected');

    if (landmark.coinAmount <= 0) {
      throw new BadRequestException('No coins available for this landmark');
    }

    // เก็บ landmark ใหม่
    if (!userCollection) {
      await this.coinCollectionModel.create({
        user: userObjectId,
        landmarks: [{ landmark: landmarkObjectId, collectedAt: new Date() }]
      });
    } else {
      userCollection.landmarks.push({
        landmark: landmarkObjectId,
        collectedAt: new Date()
      });
      await userCollection.save();
    }

    // หลังจากเก็บ coin collection เสร็จ → update coinAmount
    await this.landmarkModel.findByIdAndUpdate(
      landmarkObjectId,
      { $inc: { coinAmount: -1 } }
    );

    return { message: 'Coin collected successfully' };
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

  async getLeaderboard(limit = 5) {
    const leaderboard = await this.coinCollectionModel.aggregate([
      {
        $project: {
          user: 1,
          coinCount: { $size: '$landmarks' },
          latestCollectedAt: { $max: '$landmarks.collectedAt' }
        }
      },
      { $sort: { coinCount: -1, latestCollectedAt: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$user',
          username: '$userInfo.username',
          coinCount: 1
        }
      }
    ]);

    return {
      message: 'Leaderboard fetched successfully',
      data: leaderboard,
    }
  }

  async getUserRank(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    // 1. หาเหรียญของ user คนนี้ก่อน
    const userData = await this.coinCollectionModel.aggregate([
      { $match: { user: userObjectId } },
      {
        $project: {
          coinCount: { $size: "$landmarks" },
          latestCollectedAt: { $max: "$landmarks.collectedAt" }
        }
      }
    ]);

    if (userData.length === 0) {
      throw new NotFoundException("User not found in coin collection");
    }

    const myCoinCount = userData[0].coinCount;
    const myLatestCollectedAt = userData[0].latestCollectedAt;


    // 2. หาว่ามีคนที่เหรียญเยอะกว่าเรากี่คน
    const higherRankCount = await this.coinCollectionModel.aggregate([
      {
        $project: {
          coinCount: { $size: "$landmarks" },
          latestCollectedAt: { $max: "$landmarks.collectedAt" }
        }
      },
      {
        $match: {
          $or: [
            { coinCount: { $gt: myCoinCount } },
            {
              coinCount: myCoinCount,
              latestCollectedAt: { $lt: myLatestCollectedAt }
            }
          ]
        }
      },
      { $count: "rankBeforeMe" }
    ]);

    const myRank = (higherRankCount[0]?.rankBeforeMe ?? 0) + 1;

    return {
      userId,
      coinCount: myCoinCount,
      rank: myRank
    };
  }

}

function calculateDistance(
  userLat: number,
  userLong: number,
  latitude: number,
  longitude: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000; // Earth's radius in meters

  const dLat = toRad(latitude - userLat);
  const dLon = toRad(longitude - userLong);

  const lat1 = toRad(userLat);
  const lat2 = toRad(latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
