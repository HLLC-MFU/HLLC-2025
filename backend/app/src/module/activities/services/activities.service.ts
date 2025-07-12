import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, isValidObjectId, Model, Types } from 'mongoose';

import { queryAll } from 'src/pkg/helper/query.util';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';
import { CreateActivitiesDto } from '../dto/activities/create-activities.dto';
import { UpdateActivityDto } from '../dto/activities/update-activities.dto';
import { Activities, ActivityDocument } from '../schemas/activities.schema';
import { isUserInScope, parseScope, parseStringArray } from '../utils/scope.util';
import { Checkin } from 'src/module/checkin/schema/checkin.schema';
import { RoleDocument } from 'src/module/role/schemas/role.schema';
import { AssessmentsService } from 'src/module/assessments/service/assessments.service';
import {
  Assessment,
  AssessmentDocument,
} from 'src/module/assessments/schema/assessment.schema';
import { ActivitiesType } from '../schemas/activitiesType.schema';
import {
  AssessmentAnswer,
  AssessmentAnswerDocument,
} from 'src/module/assessments/schema/assessment-answer.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activities.name)
    private activitiesModel: Model<ActivityDocument>,
    @InjectModel('ActivitiesType')
    private activitiesTypeModel: Model<ActivitiesType>,
    private usersService: UsersService,
    @InjectModel(Checkin.name)
    private readonly checkinsModel: Model<Checkin>,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectModel(Assessment.name)
    private readonly assessmentModel: Model<AssessmentDocument>,
    @InjectModel(AssessmentAnswer.name)
    private assessmentAnswersModel: Model<AssessmentAnswerDocument>,
    private readonly assessmentsService: AssessmentsService,
  ) {}

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

  async findAll() {
    try {
      const [activities, types] = await Promise.all([
        this.activitiesModel.find().lean(),
        this.activitiesTypeModel.find().lean(),
      ]);

      const typeMap = new Map(
        types.map((type) => [type._id.toString(), type.name]),
      );

      const mappedActivities = activities.map((activity) => ({
        ...activity,
        type: typeMap.get(activity.type?.toString()) || null,
      }));

      return mappedActivities;
    } catch (error) {
      throw new Error(`Failed to fetch activities , ${error}`);
    }
  }

  async findCanCheckinActivities(userId: Types.ObjectId | string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const userDoc = (await this.userModel
      .findById(userId)
      .populate('role')
      .exec()) as unknown as Omit<UserDocument, 'role'> & {
      role: Omit<RoleDocument, 'metadata'> & {
        metadata: {
          canCheckin: {
            user: string[];
            major: string[];
            school: string[];
          };
        };
      };
    };
    if (!userDoc) {
      throw new NotFoundException('User not found');
    }

    const currentDate = new Date();
    const major = userDoc.role?.metadata?.canCheckin?.major ?? [];
    const school = userDoc.role?.metadata?.canCheckin?.school ?? [];
    const user = userDoc.role?.metadata?.canCheckin?.user ?? [];

    if (user.includes('*')) {
      const activities = await this.activitiesModel
        .find({ 'metadata.isOpen': true, 'metadata.isVisible': true })
        .populate('type')
        .lean();

      return {
        data: activities,
        meta: {
          total: activities.length,
          totalPages: 1,
          page: 1,
          limit: activities.length,
          lastUpdatedAt: new Date().toISOString(),
        },
        message: 'All activities available for check-in',
      };
    }

    const query = {
      'metadata.isOpen': true,
      'metadata.isVisible': true,
      'metadata.checkinStartAt': { $lte: currentDate },
      'metadata.endAt': { $gte: currentDate },
      $or: [
        { 'metadata.scope.user': { $in: user.length ? user : [] } },
        { 'metadata.scope.major': { $in: major.length ? major : [] } },
        { 'metadata.scope.school': { $in: school.length ? school : [] } },
      ],
    };

    const result = await queryAll<Activities>({
      model: this.activitiesModel,
      query: query as FilterQuery<Activities>,
      filterSchema: {},
      populateFields: () => Promise.resolve([{ path: 'type' }]),
    });

    return {
      ...result,
      meta: {
        ...result.meta,
        lastUpdatedAt: new Date().toISOString(), // <-- add this line
      },
      message: 'Fetched activities successfully',
    };
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

    const userCheckins = (await this.checkinsModel
      .find({ user: user._id })
      .lean()
      .exec()) as Array<{ activity?: Types.ObjectId | string }>;

    const checkinMap = new Set(
      userCheckins
        .map((c) => c.activity)
        .filter((activity): activity is Types.ObjectId | string => !!activity)
        .map((activity) => activity.toString()),
    );

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

    const mapped = await Promise.all(
      result.data
        .filter((activity) => isUserInScope(user, activity as ActivityDocument))
        .map(async (activity) => {
          const meta = activity.metadata;
          const activityDoc = activity as ActivityDocument;
          const activityId =
            activityDoc._id instanceof Types.ObjectId
              ? activityDoc._id.toString()
              : String(activityDoc._id);
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

          const assessmentsResult =
            await this.assessmentsService.findAllByActivity(activityId);
          const assessments = (assessmentsResult.data ||
            []) as AssessmentDocument[];

          let hasAnswered = false;

          if (assessments.length > 0) {
            for (const assessment of assessments) {
              const answered = await this.assessmentAnswersModel.findOne({
                user: user._id,
                'answers.assessment': assessment._id,
              });
              if (answered) {
                hasAnswered = true;
                break;
              }
            }
          }

          const activityObj =
            typeof (activity as ActivityDocument).toObject === 'function'
              ? (activity as ActivityDocument).toObject()
              : activity;
          return {
            ...activityObj,
            checkinStatus: status,
            checkinMessage: message,
            hasAnsweredAssessment: hasAnswered,
          };
        }),
    );

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
      if (isValidObjectId(updateActivityDto.type)) {
        updateActivityDto.type = new Types.ObjectId(updateActivityDto.type);
      } else {
        throw new BadRequestException('Invalid activity type ID');
      }
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

  // หากิจกรรมที่มี Assessment
  async findActivitiesWithAssessment(activityId: string) {
    const activities =
      await this.assessmentsService.findAllByActivity(activityId);
    return activities;
  }
}
