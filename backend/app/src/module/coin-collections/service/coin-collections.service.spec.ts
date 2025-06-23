import { Test, TestingModule } from '@nestjs/testing';
import { CoinCollectionsService } from '../service/coin-collections.service';
import { getModelToken } from '@nestjs/mongoose';
import { CoinCollection } from '../schema/coin-collection.schema';
import { Landmark } from '../schema/landmark.schema';
import { Types, HydratedDocument } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CollectCoinDto } from '../dto/coin-collections/coin-collectoin.dto';


describe('CoinCollectionsService', () => {
  let service: CoinCollectionsService;

  const fakeObjectId = new Types.ObjectId();
  const fakeId = fakeObjectId.toHexString();

  const mockCoinDoc: Partial<HydratedDocument<CoinCollection>> = {
    _id: fakeObjectId,
    user: fakeObjectId,
    landmarks: [],
    save: jest.fn(),
  };

  const mockCoinModel = {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnValue(Promise.resolve([mockCoinDoc])),
    }),
    findOne: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ updatedAt: new Date() }),
    }),
    findByIdAndDelete: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockCoinDoc),
    }),
    countDocuments: jest.fn().mockResolvedValue(1),
    findById: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  };

  const mockLandmarkModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinCollectionsService,
        {
          provide: getModelToken(CoinCollection.name),
          useValue: mockCoinModel,
        },
        {
          provide: getModelToken(Landmark.name),
          useValue: mockLandmarkModel,
        },
      ],
    }).compile();

    service = module.get<CoinCollectionsService>(CoinCollectionsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('collectCoin', () => {

    it('should create coin collection if user has none', async () => {
      const mockLandmark = {
        _id: fakeObjectId,
        location: { latitude: 0, longitude: 0 },
        cooldown: 1000,
        coinAmount: 1,
      };

      mockLandmarkModel.findById.mockResolvedValue(mockLandmark);
      mockLandmarkModel.findByIdAndUpdate.mockResolvedValue({});
      mockCoinModel.find.mockResolvedValueOnce([]);
      mockCoinModel.findOne.mockResolvedValue(null); // <- ยังไม่มี collection
      mockCoinModel.create.mockResolvedValue({});

      const dto: CollectCoinDto = {
        user: fakeId,
        landmark: fakeId,
        userLat: 0,
        userLong: 0,
      };

      await service.collectCoin(dto);

      expect(mockCoinModel.create).toHaveBeenCalledWith({
        user: new Types.ObjectId(fakeId),
        landmarks: [
          {
            landmark: new Types.ObjectId(fakeId),
            collectedAt: expect.any(Date),
          },
        ],
      });
    });

    it('should push new landmark and save if user has collection', async () => {
      const mockLandmark = {
        _id: fakeObjectId,
        location: { latitude: 0, longitude: 0 },
        cooldown: 1000,
        coinAmount: 1,
      };

      const mockSave = jest.fn();

      interface LandmarkEntry {
        landmark: Types.ObjectId;
        collectedAt: Date;
      }

      const mockUserCollection: {
        landmarks: LandmarkEntry[];
        save: jest.Mock;
      } = {
        landmarks: [],
        save: mockSave,
      };

      mockLandmarkModel.findById.mockResolvedValue(mockLandmark);
      mockLandmarkModel.findByIdAndUpdate.mockResolvedValue({});
      mockCoinModel.find.mockResolvedValueOnce([]);
      mockCoinModel.findOne.mockResolvedValue(mockUserCollection); // มี collection
      mockCoinModel.create.mockResolvedValue({}); // ไม่ควรเรียก

      const dto: CollectCoinDto = {
        user: fakeId,
        landmark: fakeId,
        userLat: 0,
        userLong: 0,
      };

      await service.collectCoin(dto);

      expect(mockUserCollection.landmarks.length).toBe(1);
      expect(mockUserCollection.landmarks[0].landmark.toString()).toBe(fakeId);
      expect(mockSave).toHaveBeenCalled();
      expect(mockCoinModel.create).not.toHaveBeenCalled();
    });


    it('should throw NotFoundException if landmark not found', async () => {
      mockLandmarkModel.findById.mockResolvedValue(null);
      const dto: CollectCoinDto = {
        user: fakeId,
        landmark: fakeId,
        userLat: 0,
        userLong: 0,
      };
      await expect(service.collectCoin(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user too far from landmark', async () => {
      mockLandmarkModel.findById.mockResolvedValue({
        _id: fakeObjectId,
        location: { latitude: 99, longitude: 99 },
        cooldown: 1000,
        coinAmount: 10
      });
      const dto: CollectCoinDto = {
        user: fakeId,
        landmark: fakeId,
        userLat: 0,
        userLong: 0,
      };
      await expect(service.collectCoin(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if landmark is in cooldown', async () => {
      mockLandmarkModel.findById.mockResolvedValue({
        _id: fakeObjectId,
        location: { latitude: 0, longitude: 0 },
        cooldown: 1000,
        coinAmount: 10
      });
      mockCoinModel.find.mockResolvedValueOnce([{}]);

      const dto: CollectCoinDto = {
        user: fakeId,
        landmark: fakeId,
        userLat: 0,
        userLong: 0,
      };
      await expect(service.collectCoin(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already collected this landmark', async () => {
      mockLandmarkModel.findById.mockResolvedValue({
        _id: fakeObjectId,
        location: { latitude: 0, longitude: 0 },
        cooldown: 1000,
        coinAmount: 10
      });
      mockCoinModel.find.mockResolvedValueOnce([]);
      mockCoinModel.findOne.mockResolvedValue({
        user: fakeObjectId,
        landmarks: [{ landmark: fakeObjectId, equals: () => true }]
      });

      const dto: CollectCoinDto = {
        user: fakeId,
        landmark: fakeId,
        userLat: 0,
        userLong: 0,
      };
      await expect(service.collectCoin(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if max coins collected', async () => {
      mockLandmarkModel.findById.mockResolvedValue({
        _id: fakeObjectId,
        location: { latitude: 0, longitude: 0 },
        cooldown: 1000,
        coinAmount: 10
      });
      mockCoinModel.find.mockResolvedValueOnce([]);
      mockCoinModel.findOne.mockResolvedValue({
        user: fakeObjectId,
        landmarks: Array(14).fill({ landmark: new Types.ObjectId() })
      });

      const dto: CollectCoinDto = {
        user: fakeId,
        landmark: fakeId,
        userLat: 0,
        userLong: 0,
      };
      await expect(service.collectCoin(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no coins left at landmark', async () => {
      mockLandmarkModel.findById.mockResolvedValue({
        _id: fakeObjectId,
        location: { latitude: 0, longitude: 0 },
        cooldown: 1000,
        coinAmount: 0
      });
      mockCoinModel.find.mockResolvedValueOnce([]);
      mockCoinModel.findOne.mockResolvedValue({ landmarks: [] });

      const dto: CollectCoinDto = {
        user: fakeId,
        landmark: fakeId,
        userLat: 0,
        userLong: 0,
      };
      await expect(service.collectCoin(dto)).rejects.toThrow(BadRequestException);
    });

    it('should collect coin successfully', async () => {
      const mockLandmark = {
        _id: fakeObjectId,
        location: { latitude: 0, longitude: 0 },
        cooldown: 1000,
        coinAmount: 5
      };

      mockLandmarkModel.findById.mockResolvedValue(mockLandmark);
      mockLandmarkModel.findByIdAndUpdate.mockResolvedValue({});
      mockCoinModel.find.mockResolvedValueOnce([]);
      mockCoinModel.findOne.mockResolvedValue(null);
      mockCoinModel.create.mockResolvedValue({});

      const dto: CollectCoinDto = {
        user: fakeId,
        landmark: fakeId,
        userLat: 0,
        userLong: 0,
      };

      const result = await service.collectCoin(dto);

      expect(mockLandmarkModel.findByIdAndUpdate).toHaveBeenCalledWith(
        fakeObjectId,
        { $inc: { coinAmount: -1 } }
      );

      expect(result).toEqual({ message: 'Coin collected successfully' });
    });

  });

  describe('findAll', () => {
    it('should return populated result', async () => {
      mockCoinModel.findOne = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ updatedAt: new Date() }),
      });

      const result = await service.findAll({});
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });


  describe('findOne', () => {
    it('should return coin collection by id', async () => {
      mockCoinModel.findOne.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockCoinDoc),
      });
      const result = await service.findOne(fakeId);
      type CoinWithId = CoinCollection & { _id: Types.ObjectId };
      const doc = result.data?.[0] as CoinWithId;
      expect(doc).toBeDefined();
      expect(doc._id.toString()).toBe(fakeId);
    });
  });

  describe('remove', () => {
    it('should delete and return success message', async () => {
      const result = await service.remove(fakeId);
      expect(result).toEqual({
        message: 'Coin collection deleted successfully',
        id: fakeId,
      });
    });
  });

  describe('getLeaderboard', () => {
    it('should return ranked leaderboard', async () => {
      mockCoinModel.aggregate.mockResolvedValue([
        { user: 'u1', username: 'User 1', coinCount: 5 },
      ]);
      const result = await service.getLeaderboard();
      expect(result.data[0].rank).toBe(1);
    });
  });

  describe('getUserRank', () => {
    it('should return rank of user', async () => {
      mockCoinModel.aggregate
        .mockResolvedValueOnce([{ coinCount: 3, latestCollectedAt: new Date() }])
        .mockResolvedValueOnce([{ rankBeforeMe: 2 }]);
      const result = await service.getUserRank(fakeId);
      expect(result.rank).toBe(3);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockCoinModel.aggregate.mockResolvedValueOnce([]);
      await expect(service.getUserRank(fakeId)).rejects.toThrow(NotFoundException);
    });
  });
});
