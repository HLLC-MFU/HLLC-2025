import { Test, TestingModule } from '@nestjs/testing';
import { EvoucherController } from './evoucher.controller';
import { EvoucherService } from '../service/evoucher.service';
import { CreateEvoucherDto } from '../dto/evouchers/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/evouchers/update-evoucher.dto';
import { FastifyRequest } from 'fastify';
import { Types } from 'mongoose';

describe('EvoucherController', () => {
    let controller: EvoucherController;
    let service: EvoucherService;

    const mockEvoucher = {
        _id: new Types.ObjectId().toHexString(),
        discount: 25,
        acronym: 'EV123',
        type: new Types.ObjectId().toHexString(),
        sponsors: new Types.ObjectId().toHexString(),
        expiration: new Date(),
        detail: { th: 'รายละเอียด', en: 'Detail' },
        photo: {
            coverPhoto: '',
            bannerPhoto: '',
            thumbnail: '',
            logoPhoto: 'Wasan.png',
        },
        status: true,
        metadata: { tag: 'summer' },
    };

    const mockEvoucherService: Record<keyof EvoucherService, jest.Mock> = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EvoucherController],
            providers: [{ provide: EvoucherService, useValue: mockEvoucherService }],
        }).compile();

        controller = module.get<EvoucherController>(EvoucherController);
        service = module.get<EvoucherService>(EvoucherService);
    });

    describe('create', () => {
        it('should call evoucherService.create with dto', async () => {
            const dto: CreateEvoucherDto = {
                discount: 25,
                acronym: 'EV123',
                type: mockEvoucher.type,
                sponsors: mockEvoucher.sponsors,
                expiration: new Date(),
                detail: { th: 'รายละเอียด', en: 'Detail' },
                photo: {
                    coverPhoto: '',
                    bannerPhoto: '',
                    thumbnail: '',
                    logoPhoto: 'Wasan.png',
                },
                status: true,
                metadata: { tag: 'summer' },
            };

            mockEvoucherService.create.mockResolvedValue({ ...dto, _id: mockEvoucher._id });

            const result = await controller.create(dto);
            expect(result).toEqual({ ...dto, _id: mockEvoucher._id });
            expect(mockEvoucherService.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('findAll', () => {
        it('should return all evouchers from service', async () => {
            const query: Record<string, string> = { acronym: 'EV123' };
            mockEvoucherService.findAll.mockResolvedValue([mockEvoucher]);

            const result = await controller.findAll(query);
            expect(result).toEqual([mockEvoucher]);
            expect(mockEvoucherService.findAll).toHaveBeenCalledWith(query);
        });
    });

    describe('findOne', () => {
        it('should return one evoucher by id', async () => {
            mockEvoucherService.findOne.mockResolvedValue(mockEvoucher);

            const result = await controller.findOne(mockEvoucher._id);
            expect(result).toEqual(mockEvoucher);
            expect(mockEvoucherService.findOne).toHaveBeenCalledWith(mockEvoucher._id);
        });
    });

    describe('update', () => {
        it('should call update with id and dto', async () => {
            const updateDto: UpdateEvoucherDto = {
                discount: 50,
                metadata: { updated: 'yes' },
            };

            const req = {
                body: updateDto,
            } as unknown as FastifyRequest;

            const updated = { ...mockEvoucher, ...updateDto };
            mockEvoucherService.update.mockResolvedValue(updated);

            const result = await controller.update(mockEvoucher._id, req);
            expect(result).toEqual(updated);
            expect(mockEvoucherService.update).toHaveBeenCalledWith(mockEvoucher._id, updateDto);
        });
    });

    describe('remove', () => {
        it('should call remove with id', async () => {
            const expected = { deleted: true };
            mockEvoucherService.remove.mockResolvedValue(expected);

            const result = await controller.remove(mockEvoucher._id);
            expect(result).toEqual(expected);
            expect(mockEvoucherService.remove).toHaveBeenCalledWith(mockEvoucher._id);
        });
    });
});
