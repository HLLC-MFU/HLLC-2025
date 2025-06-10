import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activities, ActivityDocument } from '../schemas/activities.schema';
import { queryAll } from 'src/pkg/helper/query.util';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';
import { CreateActivitiesDto } from '../dto/activities/create-activities.dto';
import { UpdateActivityDto } from '../dto/activities/update-activities.dto';
import {
  convertScopeToObjectIds,
  isUserInActivityScope,
} from '../utils/scope.helper';
import { validateActivityDates } from '../utils/activity.validate';
import { toValidObjectIds } from 'src/pkg/libs/object-id.util';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activities.name)
    private activitiesModel: Model<ActivityDocument>,
    private usersService: UsersService,
  ) {}

  create(createActivitiesDto: CreateActivitiesDto) {
    const metadata = createActivitiesDto.metadata || {};

    validateActivityDates(metadata.startAt, metadata.endAt);

    const rawScope = metadata.scope || {};
    console.log('📥 Raw scope from request:', rawScope);
    const convertedScope = convertScopeToObjectIds(rawScope);

    const activity = new this.activitiesModel({
      ...createActivitiesDto,
      metadata: {
        ...metadata,
        isOpen: metadata.isOpen !== false,
        isProgressCount: metadata.isProgressCount === true,
        isVisible: metadata.isVisible !== false,
        scope: convertedScope,
      },
    });
    console.log('Creating activity with metadata:', activity);
    return activity.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Activities>({
      model: this.activitiesModel,
      query: {
        ...query,
        excluded: 'user.password,user.refreshToken,metadata.secret,__v',
      },
      filterSchema: {},
      populateFields: () =>
        Promise.resolve([
          {
            path: 'type',
          },
        ]),
    });
  }

  async findOne(id: string) {
    return this.activitiesModel.findById(id).lean();
  }

  async findActivitiesByUserId(
    userId: string,
    query: Record<string, string> = {},
  ) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const userResult = await this.usersService.findOneByQuery({ _id: userId });
    const user = userResult?.data?.[0] as UserDocument;

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await queryAll<Activities>({
      model: this.activitiesModel,
      query: {
        ...query,
        excluded:
          'user.password,user.refreshToken,user.metadata.secret,activities.metadata.scope',
      },
      filterSchema: {
        'metadata.isVisible': 'boolean',
        'metadata.isOpen': 'boolean',
      },
      populateFields: () => Promise.resolve([{ path: 'type' }]),
    });

    const filteredData = result.data.filter((activity) =>
      isUserInActivityScope(user, activity as ActivityDocument),
    );

    return {
      ...result,
      data: filteredData,
      meta: {
        ...result.meta,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / Number(query.limit || 20)),
      },
    };
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    if (updateActivityDto.metadata?.scope) {
      const scope = updateActivityDto.metadata.scope;

      updateActivityDto.metadata.scope = {
        major: toValidObjectIds(scope.major).map((id) => id.toString()),
        school: toValidObjectIds(scope.school).map((id) => id.toString()),
        user: toValidObjectIds(scope.user).map((id) => id.toString()),
      };
    }

    const activity = await this.activitiesModel
      .findByIdAndUpdate(id, updateActivityDto, { new: true })
      .lean();

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async remove(id: string) {
    await this.activitiesModel.findByIdAndDelete(id).lean();
    return {
      message: 'Activity deleted successfully',
      id,
    };
  }
}
