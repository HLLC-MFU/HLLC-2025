import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
  queryAll,
} from 'src/pkg/helper/query.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: User) {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<User>({
      model: this.userModel,
      query,
      filterSchema: {},
      buildPopulateFields: (excluded) =>
        Promise.resolve(excluded.includes('role') ? [] : [{ path: 'role' }]),
    });
  }

  async findOne(id: string) {
    return queryFindOne<User>(this.userModel, { _id: id }, [
      { path: 'role' },
      { path: 'metadata.major', model: 'Major' },
    ]);
  }

  async update(id: string, updateData: Partial<User>) {
    return queryUpdateOne<User>(this.userModel, id, updateData);
  }

  async remove(id: string): Promise<void> {
    await queryDeleteOne<User>(this.userModel, id);
  }
}
