import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LamduanSettingService } from './lamduan-setting.service';
import { LamduanSetting, LamduanSettingDocument } from '../schema/lamduan.setting';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { Model } from 'mongoose';

jest.mock('src/pkg/helper/query.util');

describe('LamduanSettingService', () => {
  let service: LamduanSettingService;
  let lamduanSettingModel: Model<LamduanSettingDocument>;

  const saveMock = jest.fn();
  const lamduanSettingModelMock = jest.fn(() => ({ save: saveMock }));

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LamduanSettingService,
        {
          provide: getModelToken(LamduanSetting.name),
          useValue: Object.assign(lamduanSettingModelMock, { prototype: {} }),
        },
      ],
    }).compile();

    service = module.get<LamduanSettingService>(LamduanSettingService);
    lamduanSettingModel = module.get(getModelToken(LamduanSetting.name));
  });

  describe('create', () => {
    it('should create a new LamduanSetting', async () => {
      const dto = {
        tutorialPhoto: { 
          coverPhoto: 'lamduan.png' },
        tutorialVideo: 'https://youtube.com/example',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 86400000).toISOString(),
      };

      const expectedResult = { _id: 'mock-id', ...dto };
      saveMock.mockResolvedValue(expectedResult);

      const result = await service.create(dto);
      expect(lamduanSettingModelMock).toHaveBeenCalledWith(dto);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call queryAll with correct args', async () => {
      const query = { keyword: 'test' };
      await service.findAll(query);

      expect(queryAll).toHaveBeenCalled();
      const args = (queryAll as jest.Mock).mock.calls[0][0];

      expect(args).toMatchObject({
        model: lamduanSettingModel,
        query,
        filterSchema: {},
      });

      const fields = await args.populateFields();
      expect(fields).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should call queryFindOne with correct id', async () => {
      await service.findOne('123');
      expect(queryFindOne).toHaveBeenCalledWith(lamduanSettingModel, { _id: '123' }, []);
    });
  });

  describe('update', () => {
    it('should call queryUpdateOne with id and dto', async () => {
      const updateDto = {
        tutorialPhoto: {
          coverPhoto: 'lamduan.png',
        },
        tutorialVideo: 'https://youtube.com/new',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 86400000).toISOString(),
      };
      await service.update('456', updateDto);
      expect(queryUpdateOne).toHaveBeenCalledWith(lamduanSettingModel, '456', updateDto);
    });
  });

  describe('remove', () => {
    it('should call queryDeleteOne with correct id', async () => {
      await service.remove('789');
      expect(queryDeleteOne).toHaveBeenCalledWith(lamduanSettingModel, '789');
    });
  });
});
