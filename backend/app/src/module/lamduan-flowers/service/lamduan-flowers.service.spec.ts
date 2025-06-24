import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LamduanFlowersService } from './lamduan-flowers.service';
import { LamduanFlowers, LamduanFlowersDocument } from '../schema/lamduan-flowers.schema';
import { User, UserDocument } from 'src/module/users/schemas/user.schema';
import { LamduanSetting, LamduanSettingDocument } from '../schema/lamduan.setting';
import { Model, Types } from 'mongoose';
import { CreateLamduanFlowerDto } from '../dto/lamduan-flower/create-lamduan-flower.dto';
import { UpdateLamduanFlowerDto } from '../dto/lamduan-flower/update-lamduan-flower.dto';
import * as helper from 'src/pkg/helper/query.util';
import * as validator from 'src/pkg/validator/model.validator';
import * as utils from '../utils/lamduan.utils';

jest.mock('../utils/lamduan.utils');

describe('LamduanFlowersService', () => {
  let service: LamduanFlowersService;
  let lamduanModelMock: Partial<Record<keyof Model<LamduanFlowersDocument>, jest.Mock>> & jest.Mock;
  let userModelMock: Partial<Record<keyof Model<UserDocument>, jest.Mock>>;
  let settingModelMock: Partial<Record<keyof Model<LamduanSettingDocument>, jest.Mock>>;

  const saveMock = jest.fn();

  beforeEach(async () => {
    const lamduanModel = jest.fn(() => ({ save: saveMock })) as any;
    lamduanModel.find = jest.fn();
    lamduanModel.findOne = jest.fn();
    lamduanModel.countDocuments = jest.fn();
    lamduanModelMock = lamduanModel;

    userModelMock = {};
    settingModelMock = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LamduanFlowersService,
        {
          provide: getModelToken(LamduanFlowers.name),
          useValue: lamduanModelMock,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModelMock,
        },
        {
          provide: getModelToken(LamduanSetting.name),
          useValue: settingModelMock,
        },
      ],
    }).compile();

    service = module.get<LamduanFlowersService>(LamduanFlowersService);

    jest.spyOn(validator, 'findOrThrow').mockResolvedValue({} as any);

    jest.spyOn(utils, 'validateLamduanTime').mockResolvedValue({
      _id: new Types.ObjectId(),
      startAt: new Date(Date.now() - 1000),
      endAt: new Date(Date.now() + 1000),
      save: jest.fn(),
      toJSON: () => ({}),
    } as any);

    jest.spyOn(utils, 'validateUserAlreadySentLamduan').mockResolvedValue();

    jest.spyOn(helper, 'queryAll').mockResolvedValue({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        lastUpdatedAt: new Date().toISOString(),
      },
      message: 'success',
    });

    jest.spyOn(helper, 'queryFindOne').mockResolvedValue({} as any);
    jest.spyOn(helper, 'queryUpdateOne').mockResolvedValue({ updated: true });
    jest.spyOn(helper, 'queryDeleteOne').mockResolvedValue({ deleted: true });
  });

  describe('create', () => {
    it('should validate and save a flower entry', async () => {
      const dto: CreateLamduanFlowerDto = {
        user: new Types.ObjectId().toHexString(),
        comment: 'test comment',
        photo: {
          coverPhoto: 'lamduan.png',
        },
        setting: new Types.ObjectId().toHexString(),
      };

      saveMock.mockResolvedValue({ _id: '1', ...dto });

      const result = await service.create(dto);

      expect(validator.findOrThrow).toHaveBeenCalledTimes(2);
      expect(utils.validateLamduanTime).toHaveBeenCalledWith(dto.setting, settingModelMock);
      expect(utils.validateUserAlreadySentLamduan).toHaveBeenCalledWith(dto.user, dto.setting, lamduanModelMock);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toHaveProperty('_id');
    });
  });

  describe('findAll', () => {
    it('should call queryAll with correct arguments', async () => {
      const query = { keyword: 'test' };
      await service.findAll(query);
      expect(helper.queryAll).toHaveBeenCalledWith({
        model: lamduanModelMock,
        query,
        filterSchema: {},
        populateFields: expect.any(Function),
      });
    });
  });

  describe('findOne', () => {
    it('should call queryFindOne with correct id and populate user', async () => {
      const id = 'abc123';
      await service.findOne(id);
      expect(helper.queryFindOne).toHaveBeenCalledWith(lamduanModelMock, { _id: id }, [
        { path: 'user' },
      ]);
    });
  });

  describe('update', () => {
    it('should update a flower entry', async () => {
      const id = 'abc123';
      const dto: UpdateLamduanFlowerDto = {
        comment: 'new comment',
      };
      const result = await service.update(id, dto);
      expect(helper.queryUpdateOne).toHaveBeenCalledWith(lamduanModelMock, id, dto);
      expect(result).toEqual({ updated: true });
    });
  });

  describe('remove', () => {
    it('should delete a flower entry', async () => {
      const id = 'abc123';
      const result = await service.remove(id);
      expect(helper.queryDeleteOne).toHaveBeenCalledWith(lamduanModelMock, id);
      expect(result).toEqual({ deleted: true });
    });
  });
});