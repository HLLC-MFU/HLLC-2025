import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AppearancesService } from './appearances.service';
import { Appearance, AppearanceDocument } from './schemas/apprearance.schema';
import { Model, Types } from 'mongoose';
import { CreateAppearanceDto } from './dto/create-appearance.dto';
import { NotFoundException } from '@nestjs/common';
import { throwIfExists } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';

jest.mock('src/pkg/validator/model.validator');
jest.mock('src/pkg/helper/helpers');
jest.mock('src/pkg/helper/query.util');


const saveMock = jest.fn();

class MockModel {
  constructor(private data: Partial<CreateAppearanceDto>) {
  Object.assign(this, data);
}


  save = saveMock;

  static findById = jest.fn();
  static findOne = jest.fn();
}

describe('AppearancesService', () => {
  let service: AppearancesService;
  let model: Model<AppearanceDocument>;
  const mockAppearanceId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    saveMock.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppearancesService,
        {
          provide: getModelToken(Appearance.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    service = module.get<AppearancesService>(AppearancesService);
    model = module.get<Model<AppearanceDocument>>(getModelToken(Appearance.name));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should call throwIfExists and save model', async () => {
      (throwIfExists as jest.Mock).mockResolvedValue(undefined);
      saveMock.mockResolvedValue({ _id: mockAppearanceId }); 

      const dto: CreateAppearanceDto = { school: mockAppearanceId };
      await service.create(dto);

      expect(throwIfExists).toHaveBeenCalledWith(model, { school: dto.school }, 'School already exists');
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should call queryAll with correct populate logic', async () => {
      const query = { school: mockAppearanceId };
      await service.findAll(query);
      expect(queryAll).toHaveBeenCalled();
    });

    it('should not populate school if "school" is excluded', async () => {
      const mockFn = jest.fn().mockImplementation(({ populateFields }) =>
        populateFields(['school'])
      );
      (queryAll as jest.Mock) = mockFn;

      await service.findAll({});
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call queryFindOne', async () => {
      await service.findOne(mockAppearanceId);
      expect(queryFindOne).toHaveBeenCalledWith(model, { _id: mockAppearanceId }, [{ path: 'school' }]);
    });
  });

  describe('update', () => {
    it('should throw if not found', async () => {
      MockModel.findById = jest.fn().mockResolvedValue(null);
      await expect(service.update(mockAppearanceId, {})).rejects.toThrow(NotFoundException);
    });

    it('should merge assets/colors and call update + return populated', async () => {
      const existing = {
        assets: { logo: 'old' },
        colors: { primary: '#000' },
      };

      const updated = {
        assets: { favicon: 'new' },
        colors: { secondary: '#111' },
      };

      const expectedMerged = {
        assets: { logo: 'old', favicon: 'new' },
        colors: { primary: '#000', secondary: '#111' },
      };

      const populateMock = jest.fn().mockReturnThis();
      const execMock = jest.fn().mockResolvedValue('populatedResult');


      MockModel.findById = jest.fn()
        .mockResolvedValueOnce(existing)
        .mockReturnValueOnce({ populate: populateMock, exec: execMock });

      const result = await service.update(mockAppearanceId, updated);

      expect(queryUpdateOne).toHaveBeenCalledWith(model, mockAppearanceId, expectedMerged);
      expect(result).toEqual('populatedResult');
    });



    it('should update without merging if no assets/colors provided', async () => {
      const existing = {};
      MockModel.findById = jest.fn().mockResolvedValue(existing);

      const populateMock = jest.fn().mockReturnThis();
      const execMock = jest.fn().mockResolvedValue('populatedNoMerge');
      MockModel.findById = jest.fn().mockReturnValue({ populate: populateMock, exec: execMock });

      const result = await service.update(mockAppearanceId, {});
      expect(queryUpdateOne).toHaveBeenCalledWith(model, mockAppearanceId, {});
      expect(result).toEqual('populatedNoMerge');
    });
  });

  describe('remove', () => {
    it('should call queryDeleteOne', async () => {
      await service.remove(mockAppearanceId);
      expect(queryDeleteOne).toHaveBeenCalledWith(model, mockAppearanceId);
    });
  });
});
