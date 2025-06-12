import { Injectable } from '@nestjs/common';
import { CreateLamduanFlowerDto } from './dto/create-lamduan-flower.dto';
import { UpdateLamduanFlowerDto } from './dto/update-lamduan-flower.dto';
import { LamduanFlowers, LamduanFlowersDocument } from './schema/lamduan-flowers.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class LamduanFlowersService {

  constructor(
    @InjectModel(LamduanFlowers.name)
    private lamduanflowersModel: Model<LamduanFlowersDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ){ }

  async create(createLamduanFlowerDto: CreateLamduanFlowerDto) {

    await findOrThrow(
      this.userModel,
      createLamduanFlowerDto.user,
      'User Id not found'
    )

    const lamduanFlowers = new this.lamduanflowersModel({
      ...createLamduanFlowerDto,
      user: new Types.ObjectId(createLamduanFlowerDto.user)
    });

      return await lamduanFlowers.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<LamduanFlowers>({
      model: this.lamduanflowersModel,
      query: {
        ...query,
        excluded: 'user.refreshToken ,user.role.permissions,user.role.metadataSchema, user.metadata.secret'
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
  }
}
