import { Test, TestingModule } from '@nestjs/testing';
import { SponsorsController } from './sponsors.controller';
import { SponsorsService } from '../service/sponsors.service';
import { CreateSponsorDto } from '../dto/sponsers/create-sponsor.dto';
import { UpdateSponsorDto } from '../dto/sponsers/update-sponsor.dto';
import { FastifyRequest } from 'fastify';

jest.mock('src/pkg/interceptors/multipart.interceptor', () => ({
    MultipartInterceptor: jest.fn().mockImplementation(() => ({
        intercept: jest.fn((_, next) => next.handle()),
    })),
}));

describe('SponsorsController', () => {
    let controller: SponsorsController;
    let service: SponsorsService;

    const mockService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockCreateDto: CreateSponsorDto = {
        name: { th: 'ชื่อ', en: 'Name' },
        photo: {
            coverPhoto: 'a.jpg',
            bannerPhoto: 'b.jpg',
            thumbnail: 'c.jpg',
            logoPhoto: 'd.jpg',
        },
        type: 'typeId12345678901234567890',
        metadata: { key: 'value' },
    };

    const mockUpdateDto: UpdateSponsorDto = {
        name: { th: 'ชื่อ', en: 'Name' },
        photo: {
            coverPhoto: 'a.jpg',
            bannerPhoto: 'b.jpg',
            thumbnail: 'c.jpg',
            logoPhoto: 'd.jpg',
        },
        type: 'typeId12345678901234567890',
        metadata: { key: 'value' },
        updatedAt: new Date(),
    };




    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SponsorsController],
            providers: [{ provide: SponsorsService, useValue: mockService }],
        }).compile();

        controller = module.get<SponsorsController>(SponsorsController);
        service = module.get<SponsorsService>(SponsorsService);
    });

    describe('create()', () => {
        it('should call service.create with dto from req.body', async () => {
            const req = { body: mockCreateDto } as FastifyRequest;
            mockService.create.mockResolvedValue({ _id: '1', ...mockCreateDto });

            const result = await controller.create(req);
            expect(service.create).toHaveBeenCalledWith(mockCreateDto);
            expect(result).toEqual(expect.objectContaining({ _id: '1' }));
        });
    });

    describe('findAll()', () => {
        it('should call service.findAll with query', async () => {
            const query = { keyword: 'sponsor' };
            mockService.findAll.mockResolvedValue(['data']);

            const result = await controller.findAll(query);
            expect(service.findAll).toHaveBeenCalledWith(query);
            expect(result).toEqual(['data']);
        });
    });

    describe('findOne()', () => {
        it('should call service.findOne with id', async () => {
            mockService.findOne.mockResolvedValue({ _id: 'abc' });

            const result = await controller.findOne('abc');
            expect(service.findOne).toHaveBeenCalledWith('abc');
            expect(result).toEqual({ _id: 'abc' });
        });
    });

    describe('update()', () => {
        it('should call service.update with id and dto + updatedAt', async () => {
            const req = { body: { ...mockCreateDto } } as FastifyRequest<{ Body: UpdateSponsorDto }>;
            (req.body.updatedAt as Date) = new Date();

            const id = 'abc';
            const expected = { ...req.body };
            mockService.update.mockResolvedValue(expected);


            const result = await controller.update(id, req);
            expect(req.body.updatedAt).toBeInstanceOf(Date);
            expect(service.update).toHaveBeenCalledWith(id, req.body);
            expect(result).toEqual(expected);
        });
    });

    describe('remove()', () => {
        it('should call service.remove with id', async () => {
            mockService.remove.mockResolvedValue({ deleted: true });

            const result = await controller.remove('abc');
            expect(service.remove).toHaveBeenCalledWith('abc');
            expect(result).toEqual({ deleted: true });
        });
    });
});
