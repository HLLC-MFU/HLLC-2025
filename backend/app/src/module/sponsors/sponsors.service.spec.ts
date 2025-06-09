import { Test, TestingModule } from '@nestjs/testing';
import { SponsorsService } from './sponsors.service';
import { getModelToken } from '@nestjs/mongoose';
import { Sponsors } from './schema/sponsors.schema';
import { SponsorsType } from '../sponsors-type/schema/sponsors-type.schema';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';
import { Types } from 'mongoose';

jest.mock('src/pkg/helper/query.util', () => ({
    queryAll: jest.fn(),
    queryFindOne: jest.fn(),
}));
jest.mock('src/pkg/validator/model.validator', () => ({
    findOrThrow: jest.fn(),
}));
jest.mock('src/pkg/helper/helpers', () => ({
    handleMongoDuplicateError: jest.fn(),
}));

import { queryAll, queryFindOne } from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';

describe('SponsorsService', () => {
    let service: SponsorsService;

    const mockSponsorsModel = {
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
    };

    const mockSponsorsTypeModel = {
        findById: jest.fn(),
    };

    const mockObjectId = new Types.ObjectId().toHexString();

    const createSponsorDto: CreateSponsorDto = {
        name: { th: 'สปอนเซอร์', en: 'Sponsor' },
        photo: {  
            coverPhoto: '',
            bannerPhoto: '',
            thumbnail: '',
            logoPhoto: 'G:\ความทรงจำมหาวิทยาลัย\My rose', },
        type: mockObjectId,
        metadata: { key: 'value' },
    };

    

    const updateSponsorDto: UpdateSponsorDto = {
        name: { th: 'อัปเดต', en: 'Updated' },
        photo: {
            coverPhoto: '',
            bannerPhoto: '',
            thumbnail: '',
            logoPhoto: 'G:\ความทรงจำมหาวิทยาลัย\My rose',
        },
        type: mockObjectId,
        metadata: { level: 'gold' },
        updatedAt:new Date,
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SponsorsService,
                {
                    provide: getModelToken(Sponsors.name),
                    useValue: mockSponsorsModel,
                },
                {
                    provide: getModelToken(SponsorsType.name),
                    useValue: mockSponsorsTypeModel,
                },
            ],
        }).compile();

        service = module.get<SponsorsService>(SponsorsService);
    });

    describe('create()', () => {
        it('should create a sponsor after validating type', async () => {
            (findOrThrow as jest.Mock).mockResolvedValue({ _id: 'type123' });
            const saveMock = jest.fn().mockResolvedValue({ _id: 'sponsor1', ...createSponsorDto });
            const SponsorConstructor = jest.fn().mockImplementation(() => ({
                save: saveMock,
            }));

            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    SponsorsService,
                    {
                        provide: getModelToken(Sponsors.name),
                        useValue: SponsorConstructor,
                    },
                    {
                        provide: getModelToken(SponsorsType.name),
                        useValue: mockSponsorsTypeModel,
                    },
                ],
            }).compile();

            const localService = module.get<SponsorsService>(SponsorsService);
            const result = await localService.create(createSponsorDto);

            expect(findOrThrow).toHaveBeenCalledWith(
                mockSponsorsTypeModel,
                mockObjectId,
                'Sponsors type not found',
            );
            expect(SponsorConstructor).toHaveBeenCalledWith(expect.objectContaining({
                ...createSponsorDto,
                type: new Types.ObjectId(mockObjectId),
            }));
            expect(saveMock).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({ _id: 'sponsor1' }));
        });

        it('should handle duplicate error', async () => {
            (findOrThrow as jest.Mock).mockResolvedValue({ _id: 'type123' });

            const error = new Error('duplicate key');
            const SponsorConstructor = jest.fn().mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(error),
            }));

            const module = await Test.createTestingModule({
                providers: [
                    SponsorsService,
                    { provide: getModelToken(Sponsors.name), useValue: SponsorConstructor },
                    { provide: getModelToken(SponsorsType.name), useValue: mockSponsorsTypeModel },
                ],
            }).compile();

            const localService = module.get<SponsorsService>(SponsorsService);
            await localService.create(createSponsorDto);

            expect(handleMongoDuplicateError).toHaveBeenCalledWith(error, 'name');
        });
    });

    describe('findAll()', () => {
        it('should call queryAll with correct arguments', async () => {
            (queryAll as jest.Mock).mockResolvedValue(['result']);
            const query = { keyword: 'abc' };
            const result = await service.findAll(query);

            expect(queryAll).toHaveBeenCalledWith({
                model: mockSponsorsModel,
                query,
                filterSchema: {},
                populateFields: expect.any(Function),
            });

            expect(result).toEqual(['result']);
        });
    });

    describe('findOne()', () => {
        it('should call queryFindOne with populated type', async () => {
            (queryFindOne as jest.Mock).mockResolvedValue({ _id: 's1' });

            const result = await service.findOne('s1');

            expect(queryFindOne).toHaveBeenCalledWith(
                mockSponsorsModel,
                { _id: 's1' },
                [{ path: 'type' }],
            );

            expect(result).toEqual({ _id: 's1' });
        });
    });

    describe('update()', () => {
        it('should update sponsor if exists and type is valid', async () => {
            const _id = 's1';
            (findOrThrow as jest.Mock).mockResolvedValueOnce(true); // for sponsor exists
            (findOrThrow as jest.Mock).mockResolvedValueOnce(true); // for type exists
            mockSponsorsModel.findByIdAndUpdate.mockResolvedValue({ _id, ...updateSponsorDto });

            const result = await service.update(_id, updateSponsorDto);

            expect(findOrThrow).toHaveBeenNthCalledWith(1, mockSponsorsModel, _id, 'Sponsor not found');
            expect(findOrThrow).toHaveBeenNthCalledWith(2, mockSponsorsTypeModel, updateSponsorDto.type, 'Sponsors type not found');
            expect(mockSponsorsModel.findByIdAndUpdate).toHaveBeenCalledWith(_id, updateSponsorDto, { new: true });
            expect(result).toEqual(expect.objectContaining({ _id }));
        });
    });

    describe('remove()', () => {
        it('should remove sponsor if exists', async () => {
            const _id = 's1';
            (findOrThrow as jest.Mock).mockResolvedValue(true);
            mockSponsorsModel.findByIdAndDelete.mockResolvedValue({ _id });

            const result = await service.remove(_id);

            expect(findOrThrow).toHaveBeenCalledWith(mockSponsorsModel, _id, 'Sponsor not found');
            expect(mockSponsorsModel.findByIdAndDelete).toHaveBeenCalledWith(_id);
            expect(result).toEqual({ _id });
        });
    });
});
