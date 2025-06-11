import { Injectable } from '@nestjs/common';
import { CreateLamduanFlowerDto } from './dto/create-lamduan-flower.dto';
import { UpdateLamduanFlowerDto } from './dto/update-lamduan-flower.dto';
import { LamduanFlowers, LamduanFlowersDocument } from './schema/lamduan-flowers.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class LamduanFlowersService {

  constructor(
    @InjectModel(LamduanFlowers.name)
    private lamduanflowersModel: Model<LamduanFlowersDocument>,
  ){ }

  async create(createLamduanFlowerDto: CreateLamduanFlowerDto) {
    await findOrThrow(
      this.lamduanflowersModel,
      createLamduanFlowerDto.user,
      'User Id not found'
    )

    const lamduanFlowers = new this.lamduanflowersModel({
      ...createLamduanFlowerDto,
      user: new Types.ObjectId(createLamduanFlowerDto.user)
    });

    try{
      return await lamduanFlowers.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name')
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<LamduanFlowers>({
      model: this.lamduanflowersModel,
      query: {
        // ...query,
        // excluded: 'user.password, '
      },
      filterSchema: {},
      populateFields: () => Promise.resolve([
        { path: 'user' },
      ]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<LamduanFlowers>(
      this.lamduanflowersModel,
      { _id: id },
      [
        { path:'user' },
      ]
    );
  }

  async update(id: string, updateLamduanFlowerDto: UpdateLamduanFlowerDto) {
    return queryUpdateOne<LamduanFlowers>(
      this.lamduanflowersModel,
      id,
      updateLamduanFlowerDto
    );
  }

  async remove(id: string) {
    return queryDeleteOne<LamduanFlowers>(
      this.lamduanflowersModel,
      id
    )
    return {
      message: 'User deleted successfully',
      id,
    }
  }
}
