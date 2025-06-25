import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import {
  Sponsors,
  SponsorsDocument,
} from 'src/module/sponsors/schema/sponsors.schema';
import { CreateEvoucherDto } from '../dto/evouchers/create-evoucher.dto';
import { UpdateEvoucherDto } from '../dto/evouchers/update-evoucher.dto';
import {
  Evoucher,
  EvoucherDocument,
  EvoucherStatus,
  EvoucherType,
} from '../schema/evoucher.schema';
import { EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import { EvoucherCode } from '../schema/evoucher-code.schema';
import { buildPaginatedResponse } from 'src/pkg/helper/buildPaginatedResponse';
import { validatePublicAvailableVoucher } from '../utils/evoucher.util';

@Injectable()
export class EvoucherService {
  constructor(
    @InjectModel(Evoucher.name)
    private evoucherModel: Model<EvoucherDocument>,
    @InjectModel(Sponsors.name)
    private sponsorsModel: Model<SponsorsDocument>,
    @InjectModel(EvoucherCode.name)
    private evoucherCodeModel: Model<EvoucherCodeDocument>,
  ) {}

  async create(createEvoucherDto: CreateEvoucherDto) {
    await findOrThrow(
      this.sponsorsModel,
      createEvoucherDto.sponsors,
      'Sponsors not found',
    );

    const evoucher = new this.evoucherModel({
      ...createEvoucherDto,
      sponsors: new Types.ObjectId(createEvoucherDto.sponsors),
      expiration: createEvoucherDto.expiration,
      maxClaims: createEvoucherDto.maxClaims,
      status: EvoucherStatus.ACTIVE,
    });
    return await evoucher.save();
  }

  async findAll(query: Record<string, string>) {
    const result = await queryAll<Evoucher>({
      model: this.evoucherModel,
      query,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'sponsors' }]),
    });

    const processedData = await Promise.all(
      result.data.map(async (evoucher: EvoucherDocument) => {
        const currentClaims = await this.evoucherCodeModel.countDocuments({
          evoucher: evoucher._id,
          user: { $ne: null },
          isUsed: false,
        });

        const { maxClaims, ...evoucherWithoutMaxClaims } = evoucher.toJSON
          ? evoucher.toJSON()
          : evoucher;

        return {
          ...evoucherWithoutMaxClaims,
          claims: {
            maxClaim: maxClaims,
            currentClaim: currentClaims,
          },
        };
      }),
    );

    return buildPaginatedResponse<Evoucher>(processedData, result.meta);
  }

  findOne(id: string) {
    return queryFindOne<Evoucher>(this.evoucherModel, { _id: id }, [
      { path: 'sponsors' },
    ]);
  }

  async getPublicAvailableEvouchersForUser(
    userId?: string,
    query: Record<string, string> = {},
  ) {
    const result = await queryAll<Evoucher>({
      model: this.evoucherModel,
      query: { ...query, type: EvoucherType.GLOBAL, status: EvoucherStatus.ACTIVE },
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'sponsors' }]),
    });

    const processedData = await Promise.all(
      result.data.map((evoucher: EvoucherDocument) =>
        validatePublicAvailableVoucher(
          evoucher,
          this.evoucherCodeModel,
          userId,
        ),
      ),
    );

    return buildPaginatedResponse<Evoucher>(processedData, result.meta);
  }

  update(id: string, updateEvoucherDto: UpdateEvoucherDto) {
    return queryUpdateOne<Evoucher>(this.evoucherModel, id, updateEvoucherDto);
  }

  async remove(id: string) {
    await queryDeleteOne<Evoucher>(this.evoucherModel, id);
    return {
      message: 'Evoucher deleted successfully',
      id,
    };
  }
}
