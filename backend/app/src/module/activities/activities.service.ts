// activities.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery, HydratedDocument } from 'mongoose';
import { Activities, ActivityDocument } from './schema/activities.schema';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { User } from '../users/schemas/user.schema';
import { Major } from '../majors/schemas/major.schema';
import { UsersService } from '../users/users.service';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activities.name)
    private activitiesModel: Model<ActivityDocument>,
    @InjectModel(Major.name)
    private usersService: UsersService,
  ) {}

  async create(createActivitiesDto: CreateActivitiesDto) {
    const metadata = createActivitiesDto.metadata || {};
    const scope = metadata.scope || {};

    const convertedScope = {
      major: (scope.major || []).map(id => new Types.ObjectId(id)),
      school: (scope.school || []).map(id => new Types.ObjectId(id)),
      user: (scope.user || []).map(id => new Types.ObjectId(id)),
    };

    const activity = new this.activitiesModel({
      ...createActivitiesDto,
      metadata: {
        isOpen: metadata.isOpen ?? true,
        isProgressCount: metadata.isProgressCount ?? false,
        isVisible: metadata.isVisible ?? true,
        scope: convertedScope,
      },
    });

    return activity.save();
  }

  async findAll(query: Record<string, string>, userId?: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return this.activitiesModel.find({
        ...query,
        'metadata.isVisible': true,
        'metadata.isOpen': true,
      }).lean();
    }
  
    const activities = await this.activitiesModel.find({
      ...query,
      'metadata.isVisible': true,
      'metadata.isOpen': true,
    }).lean();
  
    const visibleActivities: typeof activities = [];
  
    for (const activity of activities) {
      const visibleUsers = await this.getVisibleUsersForActivity(activity);
      if (visibleUsers.some(u => u._id.equals(userId))) {
        visibleActivities.push(activity);
      }
    }
  
    return visibleActivities;
  }
  

  async findOne(id: string, userId?: string) {
    const activity = await this.activitiesModel.findById(id).lean();
    if (!activity) throw new NotFoundException('Activity not found');

    if (!userId) {
      throw new NotFoundException('Access denied');
    }

    const visibleUsers = await this.getVisibleUsersForActivity(activity);
    if (!visibleUsers.some(u => u._id.toString() === userId)) {
      throw new NotFoundException('Access denied');
    }

    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    if (updateActivityDto.metadata?.scope) {
      const scope = updateActivityDto.metadata.scope;
      const convertedScope = {
        major: (scope.major || []).map(id => new Types.ObjectId(id)),
        school: (scope.school || []).map(id => new Types.ObjectId(id)),
        user: (scope.user || []).map(id => new Types.ObjectId(id)),
      };
      updateActivityDto.metadata.scope = convertedScope as any;
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
    const activity = await this.activitiesModel.findByIdAndDelete(id).lean();
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }

  async getVisibleUsersForActivity(activity: Activities): Promise<User[]> {
    const scope = activity.metadata?.scope;
    if (!scope) return [];
  
    const resultUsers: User[] = [];
  
    // -- user
    if (Array.isArray(scope.user) && scope.user.length) {
      const users = await Promise.all(
        scope.user.map((id) => this.usersService.findOne(id.toString()).catch(() => null))
      );
      const filteredUsers = users.filter(
        (u): u is HydratedDocument<User> => u !== null
      );
      
      resultUsers.push(...filteredUsers);
    }
  
    // -- major
  if (Array.isArray(scope.major) && scope.major.length > 0) {
    const majorUsers = await this.usersService.findAllByQuery({
      'metadata.major': { $in: scope.major.map((id) => id.toString()) },
    } as FilterQuery<User>);
    resultUsers.push(...majorUsers.data);
  }
  
    // -- school
    if (Array.isArray(scope.school) && scope.school.length > 0) {
      const schoolUsers = await this.usersService.findAllByQuery({
        'metadata.school': { $in: scope.school.map((id) => id.toString()) },
      } as FilterQuery<User>);
      resultUsers.push(...schoolUsers.data);
    }
  
    // -- unique
    const uniqueUsers = Array.from(
      new Map(resultUsers.map((u) => [u._id.toString(), u])).values()
    );
  
    return uniqueUsers;
  }
  
  
  
}
