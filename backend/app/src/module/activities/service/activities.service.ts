import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activities, ActivityDocument } from '../schema/activities.schema';
import { queryAll } from 'src/pkg/helper/query.util';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';
import { CreateActivitiesDto } from '../dto/activities/create-activities.dto';
import { UpdateActivityDto } from '../dto/activities/update-activities.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activities.name)
    private activitiesModel: Model<ActivityDocument>,
    private usersService: UsersService,
  ) {}

  async create(createActivitiesDto: CreateActivitiesDto) {
    const metadata = createActivitiesDto.metadata || {};
    const scope = metadata.scope || {};
    
    // Validate start and end times if provided
    if (metadata.startAt && metadata.endAt) {
      const startAt = new Date(metadata.startAt);
      const endAt = new Date(metadata.endAt);
      
      if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
        throw new BadRequestException('Invalid date format for startAt or endAt');
      }
      
      if (startAt >= endAt) {
        throw new BadRequestException('startAt must be before endAt');
      }
    }

    const processedScope = {
      major: this.processFormDataArray(scope.major || []),
      school: this.processFormDataArray(scope.school || []),
      user: this.processFormDataArray(scope.user || [])
    };

    const convertedScope = this.normalizeScope(processedScope);

    const activity = new this.activitiesModel({
      ...createActivitiesDto,
      metadata: {
        isOpen: metadata.isOpen === false ? false : true,
        isProgressCount: metadata.isProgressCount === true ? true : false,
        isVisible: metadata.isVisible === false ? false : true,
        scope: convertedScope,
        startAt: metadata.startAt,
        endAt: metadata.endAt
      },
    });

    return await activity.save();
  }

  private processFormDataArray(value: string | string[] | null ): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      if (!value.trim()) return [];
      if (value.includes(',')) return value.split(',').map(v => v.trim()).filter(Boolean);
      return [value.trim()];
    }
    return [];
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Activities>({
      model: this.activitiesModel,
      query: {
        ...query,
        excluded: 'user.password,user.refreshToken,metadata.secret,__v',
      },
      filterSchema: {},
      populateFields: () => Promise.resolve([
        {
          path: 'type',
        }
      ]),
    });
  }

  async findOne(id: string) {
    return this.activitiesModel.findById(id).lean();
  }

  async findActivitiesByUserId(userId: string, query: Record<string, string> = {}) {
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
        excluded: 'user.password,user.refreshToken,user.metadata.secret,activities.metadata.scope',
      },
      filterSchema: {
        'metadata.isVisible': 'boolean',
        'metadata.isOpen': 'boolean',
      },
      populateFields: () => Promise.resolve([{ path: 'type' }]),
    });
  
    const filteredData = result.data.filter((activity) =>
      this.checkUserAgainstActivityScope(user, activity as ActivityDocument)
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
      const convertedScope = {
        major: Array.isArray(scope.major) 
          ? scope.major.map(id => new Types.ObjectId(id))
          : scope.major 
            ? [new Types.ObjectId(scope.major)]
            : [],
        school: Array.isArray(scope.school)
          ? scope.school.map(id => new Types.ObjectId(id))
          : scope.school
            ? [new Types.ObjectId(scope.school)]
            : [],
        user: Array.isArray(scope.user)
          ? scope.user.map(id => new Types.ObjectId(id))
          : scope.user
            ? [new Types.ObjectId(scope.user)]
            : []
      };

      updateActivityDto.metadata.scope = {
        major: convertedScope.major.map(id => id.toString()),
        school: convertedScope.school.map(id => id.toString()),
        user: convertedScope.user.map(id => id.toString())
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
  
  private normalizeScope(scope: {
    major?: (string | Types.ObjectId)[];
    school?: (string | Types.ObjectId)[];
    user?: (string | Types.ObjectId)[];
  }) {
    const clean = (list?: (string | Types.ObjectId)[]) =>
      Array.isArray(list)
        ? list
            .map((id) => id?.toString().trim())
            .filter((id): id is string => Boolean(id && Types.ObjectId.isValid(id)))
            .map((id) => new Types.ObjectId(id))
        : [];
  
    return {
      major: clean(scope.major),
      school: clean(scope.school),
      user: clean(scope.user),
    };
  }

  private checkUserAgainstActivityScope(user: UserDocument, activity: ActivityDocument): boolean {
    const scope = activity.metadata?.scope;
    if (!scope) return true;
  
    const userId = user._id?.toString();
    const userMajor = user.metadata?.major as { 
      _id?: Types.ObjectId; 
      school?: { 
        _id?: Types.ObjectId 
      } 
    } | string;

    const majorId = typeof userMajor === 'string' 
      ? userMajor 
      : typeof userMajor === 'object' && userMajor?._id
        ? userMajor._id.toString()
        : undefined;

    let schoolId: string | undefined;
    if (typeof userMajor === 'object' && userMajor?.school?._id) {
      schoolId = userMajor.school._id.toString();
    }

    const isInUserScope = scope.user?.some(id => id.toString() === userId);
    const isInMajorScope = majorId && scope.major?.some(id => id.toString() === majorId);
    const isInSchoolScope = schoolId && scope.school?.some(id => id.toString() === schoolId);

    return Boolean(isInUserScope || isInMajorScope || isInSchoolScope);
  }
  
}