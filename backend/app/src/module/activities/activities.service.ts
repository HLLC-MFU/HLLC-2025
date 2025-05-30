import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Activities, ActivityDocument } from './schema/activities.schema';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { User } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

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
    console.log('[Activities] 🔍 Finding activities with query:', query);
    console.log('[Activities] 👤 User ID:', userId || 'none');

    const baseQuery = {
      ...query,
      'metadata.isVisible': true,
      'metadata.isOpen': true,
    };

    const activities = await this.activitiesModel.find(baseQuery).lean();
    console.log(`[Activities] 📋 Found ${activities.length} activities total`);

    // Return early if no activities found
    if (!activities.length) {
      console.log('[Activities] ℹ️ No activities found');
      return [];
    }

    // If no userId provided, only return activities with no scope restrictions
    if (!userId) {
      console.log('[Activities] ⚠️ No userId provided - filtering for public activities only');
      return activities.filter(activity => {
        const scope = activity.metadata?.scope;
        const isPublic = !scope || (!scope.user?.length && !scope.major?.length && !scope.school?.length);
        console.log(`[Activities] Activity ${activity._id}: ${isPublic ? 'public' : 'restricted'}`);
        return isPublic;
      });
    }

    // Invalid userId format
    if (!Types.ObjectId.isValid(userId)) {
      console.log('[Activities] ❌ Invalid userId format:', userId);
      return [];
    }

    console.log('[Activities] 🔍 Checking visibility for user:', userId);
    
    const visibleActivities = await Promise.all(
      activities.map(async (activity) => {
        console.log(`\n[Activities] Checking activity ${activity._id}:`);
        console.log('Scope:', JSON.stringify(activity.metadata?.scope, null, 2));
        
        const canSee = await this.isUserVisibleForActivity(activity, userId);
        return canSee ? activity : null;
      })
    );

    const filteredActivities = visibleActivities.filter((a): a is typeof activities[0] => a !== null);
    console.log(`[Activities] ✅ Filtered to ${filteredActivities.length} visible activities`);
    
    // Log which activities were filtered out
    const filteredOutIds = activities
      .filter(a => !filteredActivities.find(f => f._id.toString() === a._id.toString()))
      .map(a => a._id);
    if (filteredOutIds.length) {
      console.log('[Activities] 🚫 Filtered out activities:', filteredOutIds);
    }

    return filteredActivities;
  }

  async findOne(id: string, userId?: string) {
    const activity = await this.activitiesModel.findById(id).lean();
    if (!activity) throw new NotFoundException('Activity not found');

    if (!userId || !(await this.isUserVisibleForActivity(activity, userId))) {
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

  async isUserVisibleForActivity(activity: Activities, userId: string): Promise<boolean> {
    const activityId = (activity as any)._id?.toString() || 'unknown';
    console.log(`\n[Visibility] 🔍 Checking visibility for activity ${activityId}`);
    console.log('[Visibility] 👤 Checking for user:', userId);

    // Input validation
    if (!activity) {
      console.log('[Visibility] ❌ Activity is null or undefined');
      return false;
    }

    // Check if activity has any scope restrictions
    if (!activity.metadata?.scope) {
      console.log('[Visibility] ℹ️ No scope defined - activity is public');
      return true;
    }

    const scope = activity.metadata.scope;
    
    // If scope exists but all arrays are empty, activity is public
    const hasNoScope = (!scope.user?.length && !scope.major?.length && !scope.school?.length);
    if (hasNoScope) {
      console.log('[Visibility] ℹ️ Empty scope - activity is public');
      return true;
    }

    // Validate userId
    if (!Types.ObjectId.isValid(userId)) {
      console.log('[Visibility] ❌ Invalid userId format:', userId);
      return false;
    }

    // Get user details
    const user = await this.usersService.findOne(userId);
    if (!user) {
      console.log('[Visibility] ❌ User not found:', userId);
      return false;
    }

    // Log scope and user details
    console.log('[Visibility] 📋 Scope details:', {
      users: scope.user?.map(id => id.toString()) || [],
      majors: scope.major?.map(id => id.toString()) || [],
      schools: scope.school?.map(id => id.toString()) || []
    });

    console.log('[Visibility] 👤 User details:', {
      id: userId,
      major: user.metadata?.major?.toString() || 'none',
      school: user.metadata?.school?.toString() || 'none'
    });

    // Check user scope
    const userIdStr = userId.toString();
    if (scope.user?.length) {
      const userIds = scope.user.map(id => id.toString());
      console.log('[Visibility] Comparing user ID:', userIdStr, 'with scope users:', userIds);
      const inUserScope = userIds.includes(userIdStr);
      if (inUserScope) {
        console.log('[Visibility] ✅ User found in user scope');
        return true;
      }
    }

    // Check major scope
    const userMajor = user.metadata?.major?.toString();
    if (scope.major?.length && userMajor) {
      const majorIds = scope.major.map(id => id.toString());
      console.log('[Visibility] Comparing user major:', userMajor, 'with scope majors:', majorIds);
      const inMajorScope = majorIds.includes(userMajor);
      if (inMajorScope) {
        console.log('[Visibility] ✅ User major found in major scope');
        return true;
      }
    }

    // Check school scope
    if (scope.school?.length && userMajor) {
      console.log('[Visibility] 🏫 Checking school scope through majors');
      
      // Get all majors for each school in scope
      for (const schoolId of scope.school) {
        console.log(`[Visibility] 🔍 Checking majors for school: ${schoolId}`);
        
        try {
          // Find all majors in this school
          const schoolMajors = await this.usersService.findAllByQuery({
            school: schoolId.toString()
          });

          if (schoolMajors?.data?.length) {
            const majorIds = schoolMajors.data
              .filter(m => m.metadata?.major)
              .map(m => m.metadata.major.toString());

            console.log('[Visibility] Found school majors:', majorIds);

            // Check if user's major is in this school
            if (majorIds.includes(userMajor)) {
              console.log('[Visibility] ✅ User major found in school scope');
              return true;
            }
          }
        } catch (error) {
          console.error('[Visibility] ❌ Error checking school majors:', error);
        }
      }
    }

    console.log('[Visibility] ❌ User does not match any scope criteria');
    return false;
  }
}
