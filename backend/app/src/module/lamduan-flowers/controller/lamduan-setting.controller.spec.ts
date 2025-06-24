import { Test, TestingModule } from '@nestjs/testing';
import { LamduanSettingController } from './lamduan-setting.controller';
import { LamduanSettingService } from '../service/lamduan-setting.service';
import { CreateLamduanSettingDto } from '../dto/lamduan-settings/create-lamduan-setting.dto';
import { UpdateLamduanSettingDto } from '../dto/lamduan-settings/update-lamduan-setting.dto';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('LamduanSettingController', () => {
  let controller: LamduanSettingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LamduanSettingController],
      providers: [
        { provide: LamduanSettingService, useValue: mockService },
        { provide: Reflector, useValue: {} },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<LamduanSettingController>(LamduanSettingController);
  });

  describe('create', () => {
    it('should create a lamduan setting', async () => {
      const dto: CreateLamduanSettingDto = {
        tutorialPhoto: { coverPhoto: 'photo.png' },
        tutorialVideo: 'video.mp4',
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
      };
      const expected = { _id: '1', ...dto };
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);
      expect(result).toEqual(expected);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all lamduan settings', async () => {
      const query = { keyword: 'test' };
      const expected = [{ _id: '1' }];
      mockService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);
      expect(result).toEqual(expected);
      expect(mockService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return one lamduan setting by id', async () => {
      const id = '1';
      const expected = { _id: id };
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(id);
      expect(result).toEqual(expected);
      expect(mockService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a lamduan setting', async () => {
      const id = '1';
      const dto: UpdateLamduanSettingDto = {
        tutorialVideo: 'new.mp4',
        tutorialPhoto: { coverPhoto: 'new.png' },
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
      };
      const req = { body: dto } as FastifyRequest;
      const expected = { _id: id, ...dto };
      mockService.update.mockResolvedValue(expected);

      const result = await controller.update(id, req);
      expect(result).toEqual(expected);
      expect(mockService.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('remove', () => {
    it('should remove a lamduan setting', async () => {
      const id = '1';
      const expected = { deleted: true };
      mockService.remove.mockResolvedValue(expected);

      const result = await controller.remove(id);
      expect(result).toEqual(expected);
      expect(mockService.remove).toHaveBeenCalledWith(id);
    });
  });
});
