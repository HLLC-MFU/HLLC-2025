import { Test, TestingModule } from '@nestjs/testing';
import { LamduanFlowersController } from './lamduan-flowers.controller';
import { LamduanFlowersService } from '../service/lamduan-flowers.service';
import { CreateLamduanFlowerDto } from '../dto/lamduan-flower/create-lamduan-flower.dto';
import { UpdateLamduanFlowerDto } from '../dto/lamduan-flower/update-lamduan-flower.dto';
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

describe('LamduanFlowersController', () => {
  let controller: LamduanFlowersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LamduanFlowersController],
      providers: [
        { provide: LamduanFlowersService, useValue: mockService },
        { provide: Reflector, useValue: {} },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<LamduanFlowersController>(LamduanFlowersController);
  });

  describe('create', () => {
    it('should create a lamduan flower', async () => {
      const dto: CreateLamduanFlowerDto = {
        user: 'user-id',
        comment: 'A nice flower',
        photo: { coverPhoto: 'flower.png' },
        setting: 'setting-id',
      };
      const expected = { _id: '1', ...dto };
      mockService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);
      expect(result).toEqual(expected);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all lamduan flowers', async () => {
      const query = { keyword: 'test' };
      const expected = [{ _id: '1' }];
      mockService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);
      expect(result).toEqual(expected);
      expect(mockService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return one lamduan flower by id', async () => {
      const id = '1';
      const expected = { _id: id };
      mockService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(id);
      expect(result).toEqual(expected);
      expect(mockService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a lamduan flower', async () => {
      const id = '1';
      const dto: UpdateLamduanFlowerDto = {
        comment: 'updated comment',
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
    it('should remove a lamduan flower', async () => {
      const id = '1';
      const expected = { deleted: true };
      mockService.remove.mockResolvedValue(expected);

      const result = await controller.remove(id);
      expect(result).toEqual(expected);
      expect(mockService.remove).toHaveBeenCalledWith(id);
    });
  });
});
