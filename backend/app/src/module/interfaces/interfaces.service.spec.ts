import { Test, TestingModule } from '@nestjs/testing';
import { InterfacesService } from './interfaces.service';
import { getModelToken } from '@nestjs/mongoose';
import { Interfaces, InterfacesDocument } from './schema/interfaces.schema';
import { Model, Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

describe('InterfacesService', () => {
    let service: InterfacesService;
    let model: Model<InterfacesDocument>;

    const mockId = new Types.ObjectId().toHexString();

    const mockInterface = {
        _id: mockId,
        school: new Types.ObjectId().toHexString(),
        assets: {
            logo: 'logo.png',
            banner: 'banner.png',
        },
    };

    const mockSave = jest.fn().mockResolvedValue(mockInterface);
    const mockFind = jest.fn();
    const mockFindById = jest.fn();
    const mockFindByIdAndUpdate = jest.fn();
    const mockFindByIdAndDelete = jest.fn();

    beforeEach(async () => {
        const mockModel: any = jest.fn().mockImplementation(() => ({
            save: mockSave,
        }));

        mockModel.find = mockFind;
        mockModel.findById = mockFindById;
        mockModel.findByIdAndUpdate = mockFindByIdAndUpdate;
        mockModel.findByIdAndDelete = mockFindByIdAndDelete;

        mockFind.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([mockInterface]),
            }),
        });

        mockFindById.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockInterface),
        });

        mockFindByIdAndUpdate.mockReturnValue({
            lean: jest.fn().mockResolvedValue({
                ...mockInterface,
                assets: { logo: 'new-logo.png' },
            }),
        });

        mockFindByIdAndDelete.mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockInterface),
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InterfacesService,
                {
                    provide: getModelToken(Interfaces.name),
                    useValue: mockModel,
                },
            ],
        }).compile();

        service = module.get<InterfacesService>(InterfacesService);
        model = module.get<Model<any>>(getModelToken(Interfaces.name));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new interface document', async () => {
            const dto = { school: mockInterface.school };
            const created = await service.create(dto);
            expect(mockSave).toHaveBeenCalled();
            expect(created).toEqual(mockInterface);
        });
    });

    describe('findAll', () => {
        it('should return all interfaces', async () => {
            const result = await service.findAll();
            expect(result).toEqual([mockInterface]);
            expect(model.find).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return one interface by id', async () => {
            const result = await service.findOne(mockId);
            expect(result).toEqual(mockInterface);
            expect(model.findById).toHaveBeenCalledWith(mockId);
        });
    });

    describe('update', () => {
        it('should merge assets and update interface', async () => {
            const updated = await service.update(mockId, {
                assets: { logo: 'new-logo.png' },
            });

            if (!updated) throw new Error('Updated is null');
            expect(updated.assets.logo).toBe('new-logo.png');
        });

        it('should throw NotFoundException if not found', async () => {
            mockFindById.mockReset();
            mockFindById.mockReturnValueOnce(null);

            await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
        });

    });


    describe('remove', () => {
        it('should delete the interface', async () => {
            const result = await service.remove(mockId);
            expect(result).toEqual(mockInterface);
            expect(model.findByIdAndDelete).toHaveBeenCalledWith(mockId);
        });
    });
});
