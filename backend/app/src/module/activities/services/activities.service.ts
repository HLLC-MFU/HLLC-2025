import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

import { queryAll } from 'src/pkg/helper/query.util';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';
import { CreateActivitiesDto } from '../dto/activities/create-activities.dto';
import { UpdateActivityDto } from '../dto/activities/update-activities.dto';
import { Activities, ActivityDocument } from '../schemas/activities.schema';
import {
  isUserInScope,
  parseScope,
  parseStringArray,
} from '../utils/scope.util';
import { Checkin, CheckinDocument } from 'src/module/checkin/schema/checkin.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activities.name)
    private activitiesModel: Model<ActivityDocument>,
    private usersService: UsersService,
    @InjectModel(Checkin.name)
    private readonly checkinsModel: Model<Checkin>,
  ) { }

  async create(createActivitiesDto: CreateActivitiesDto) {
    const metadata = createActivitiesDto.metadata || {};
    const scope = metadata.scope || {};

    if (metadata.startAt && metadata.endAt && metadata.checkinStartAt) {
      const startAt = new Date(metadata.startAt);
      const endAt = new Date(metadata.endAt);
      const checkinStartAt = new Date(metadata.checkinStartAt);
      if (
        isNaN(startAt.getTime()) ||
        isNaN(endAt.getTime()) ||
        isNaN(checkinStartAt.getTime())
      ) {
        throw new BadRequestException(
          'Invalid date format for startAt or endAt',
        );
      }

      if (startAt >= endAt) {
        throw new BadRequestException('startAt must be before endAt');
      }
    }

    const processedScope = {
      major: parseStringArray(scope.major || []),
      school: parseStringArray(scope.school || []),
      user: parseStringArray(scope.user || []),
    };

    const convertedScope = parseScope(processedScope);

    const activity = new this.activitiesModel({
      ...createActivitiesDto,
      metadata: {
        isOpen: metadata.isOpen === false ? false : true,
        isProgressCount: metadata.isProgressCount === true ? true : false,
        isVisible: metadata.isVisible === false ? false : true,
        scope: convertedScope,
        checkinStartAt: metadata.checkinStartAt,
        startAt: metadata.startAt,
        endAt: metadata.endAt,
      },
    });

    return await activity.save();
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

  async findCanCheckinActivities() {
    const currentDate = new Date();
    const query = {
      'metadata.isOpen': true,
      'metadata.isVisible': true,
      'metadata.checkinStartAt': { $lte: currentDate },
      'metadata.endAt': { $gte: currentDate },
    };

    return queryAll<Activities>({
      model: this.activitiesModel,
      query: query as FilterQuery<Activities>,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'type' }]),
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

    const now = new Date();

    // ✅ Step 1: Fetch check-ins for this user
    const userCheckins = await this.checkinsModel.find({ user: user._id }).lean();

    const checkinMap = new Set(
      userCheckins.map((c) => c.activity.toString()),
    );

    // ✅ Step 2: Fetch activities (without populate)
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

    const mapped = result.data
      .filter((activity) => isUserInScope(user, activity as ActivityDocument))
      .map((activity) => {
        const meta = activity.metadata;
        const activityId = (activity as any)._id.toString();
        const hasCheckedIn = checkinMap.has(activityId);

        let status = 0;
        let message = 'Not yet open for check-in';

        const checkinStart = new Date(meta.checkinStartAt);
        const end = new Date(meta.endAt);

        if (!meta.isOpen || now < checkinStart) {
          status = 0;
          message = 'Not yet open for check-in';
        } else if (now > end && !hasCheckedIn) {
          status = -1;
          message = 'You missed the check-in time';
        } else if (now > end && hasCheckedIn) {
          status = 3;
          message = 'Activity has ended';
        } else if (hasCheckedIn) {
          status = 2;
          message = 'You have already checked in';
        } else if (now >= checkinStart && now <= end) {
          status = 1;
          message = 'Check-in available now';
        }

        return {
          ...(typeof (activity as any).toObject === 'function'
            ? (activity as any).toObject()
            : activity),
          checkinStatus: status,
          checkinMessage: message,
        };
      });

    return {
      ...result,
      data: mapped,
      meta: {
        ...result.meta,
        total: mapped.length,
        totalPages: Math.ceil(mapped.length / Number(query.limit || 20)),
      },
    };
  }



  async update(id: string, updateActivityDto: UpdateActivityDto) {
    if (updateActivityDto.metadata?.scope) {
      const scope = updateActivityDto.metadata.scope;
      const convertedScope = {
        major: Array.isArray(scope.major)
          ? scope.major.map((id) => new Types.ObjectId(id))
          : scope.major
            ? [Types.ObjectId.createFromHexString(scope.major)]
            : [],
        school: Array.isArray(scope.school)
          ? scope.school.map((id) => new Types.ObjectId(id))
          : scope.school
            ? [Types.ObjectId.createFromHexString(scope.school)]
            : [],
        user: Array.isArray(scope.user)
          ? scope.user.map((id) => new Types.ObjectId(id))
          : scope.user
            ? [Types.ObjectId.createFromHexString(scope.user)]
            : [],
      };
      updateActivityDto.metadata.scope = {
        major: convertedScope.major.map((id) => id.toString()),
        school: convertedScope.school.map((id) => id.toString()),
        user: convertedScope.user.map((id) => id.toString()),
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
