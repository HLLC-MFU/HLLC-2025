import { Test, TestingModule } from '@nestjs/testing';
import { CoinCollectionsController } from './coin-collections.controller';
import { CoinCollectionsService } from '../service/coin-collections.service';
import { CollectCoinDto } from '../dto/coin-collections/coin-collectoin.dto';

describe('CoinCollectionsController', () => {
  let controller: CoinCollectionsController;
  let service: CoinCollectionsService;

  const mockService = {
    collectCoin: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    getLeaderboard: jest.fn(),
    getUserRank: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoinCollectionsController],
      providers: [{ provide: CoinCollectionsService, useValue: mockService }],
    }).compile();

    controller = module.get<CoinCollectionsController>(CoinCollectionsController);
    service = module.get<CoinCollectionsService>(CoinCollectionsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('collectCoin', () => {
    it('should collect coin with valid dto', async () => {
      const dto: CollectCoinDto = {
        user: '60f5a3b0c2a1c8a1f9d9f9f9',
        landmark: '60f5a3b0c2a1c8a1f9d9f9f8',
        userLat: 13.7563,
        userLong: 100.5018,
      };

      const mockResult = { success: true };
      mockService.collectCoin.mockResolvedValue(mockResult);

      const result = await controller.collectCoin(dto);
      expect(service.collectCoin).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('should return all coin collections with query', async () => {
      const query = { user: '123' };
      const mockResult = [{ _id: '1' }, { _id: '2' }];
      mockService.findAll.mockResolvedValue(mockResult);

      const result = controller.findAll(query);
      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).resolves.toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return one coin collection by id', async () => {
      const id = 'abc123';
      const mockResult = { _id: id };
      mockService.findOne.mockResolvedValue(mockResult);

      const result = controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).resolves.toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should delete one coin collection by id', async () => {
      const id = 'abc123';
      const mockResult = { deleted: true };
      mockService.remove.mockResolvedValue(mockResult);

      const result = controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).resolves.toEqual(mockResult);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard with limit', async () => {
      const mockResult = [{ user: 'U1', coins: 100 }];
      mockService.getLeaderboard.mockResolvedValue(mockResult);

      const result = await controller.getLeaderboard(10);
      expect(service.getLeaderboard).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserRank', () => {
    it('should return rank of a user', async () => {
      const userId = 'abc123';
      const mockResult = { rank: 5 };
      mockService.getUserRank.mockResolvedValue(mockResult);

      const result = await controller.getUserRank(userId);
      expect(service.getUserRank).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockResult);
    });
  });
});
