import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Checkin, CheckinDocument } from './schema/checkin.schema';
import { Model, Types } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
} from 'src/pkg/helper/query.util';
import { User } from '../users/schemas/user.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { Activities } from '../activities/schema/activities.schema';
import { ActivityDocument } from '../activities/schema/activities.schema';
import { PopulateField } from 'src/pkg/types/query';
import { ActivitiesService } from '../activities/service/activities.service';
import { RoleService } from '../role/role.service';
import { Role } from '../role/schemas/role.schema';
import { UsersService } from '../users/users.service';

type PopulatedUser = {
  _id: Types.ObjectId;
  role: {
    name: string;
  };
  metadata?: {
    major?: {
      _id: Types.ObjectId;
      school?: {
        _id: Types.ObjectId;
      };
    } | string;
  };
};

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel(Checkin.name)
    private readonly checkinModel: Model<CheckinDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Activities.name)
    private readonly activitiesModel: Model<ActivityDocument>,
    private readonly activitiesService: ActivitiesService,
    private readonly roleService: RoleService,
    private readonly usersService: UsersService,
  ) { }

  async create(createCheckinDto: CreateCheckinDto) {
    // Find user with complete data
    const userResult = await this.usersService.findOneByQuery({ _id: createCheckinDto.user });
    const user = userResult?.data?.[0] as unknown as PopulatedUser | undefined;
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Find staff
    const staff = await this.userModel.findById(new Types.ObjectId(createCheckinDto.staff))
      .populate<{ role: Role }>({
        path: 'role',
        select: 'name metadataScanned'
      })
      .lean()
      .orFail(() => new BadRequestException('Staff not found'));

    // Check if staff can scan user based on their roles
    const staffRole = staff.role?.name;
    const userRole = user.role?.name;

    if (!staffRole || !userRole) {
      throw new BadRequestException('Staff or user role not found');
    }

    console.log('Staff Role:', staffRole);
    console.log('User Role:', userRole);
    console.log('User Data:', {
      major: user.metadata?.major,
      school: typeof user.metadata?.major === 'object' ? user.metadata?.major?.school : undefined
    });
    
    const canScan = await this.roleService.canScan(staffRole, userRole);
    console.log('Can Scan:', canScan);
    
    if (!canScan) {
      throw new UnauthorizedException(`Staff with role "${staffRole}" is not allowed to scan users with role "${userRole}"`);
    }
  
    // Check each activity
    for (const activityId of createCheckinDto.activities) {
      const activity = await this.activitiesService.findOne(activityId);
      if (!activity) {
        throw new BadRequestException(`Activity ${activityId} not found`);
      }

      // Time validation
      const now = new Date();
      const startAt = activity.metadata?.startAt ? new Date(activity.metadata.startAt) : null;
      const endAt = activity.metadata?.endAt ? new Date(activity.metadata.endAt) : null;

      if (startAt && endAt) {
        if (now < startAt) {
          throw new BadRequestException(
            `Activity "${activity.name?.th || activity.name?.en}" has not started yet. Starts at ${startAt.toLocaleString()}`
          );
        }
        if (now > endAt) {
          throw new BadRequestException(
            `Activity "${activity.name?.th || activity.name?.en}" has already ended at ${endAt.toLocaleString()}`
          );
        }
      }

      // Scope validation
      const scope = activity.metadata?.scope;
      if (!scope) {
        // If no scope is defined, everyone can access
        continue;
      }

      const userId = user._id.toString();
      const userMajor = user.metadata?.major;

      let majorId: string | undefined;
      let schoolId: string | undefined;

      if (userMajor && typeof userMajor === 'object') {
        majorId = userMajor._id?.toString();
        schoolId = userMajor.school?._id?.toString();
      } else if (typeof userMajor === 'string') {
        majorId = userMajor;
      }

      console.log('Checking scope:', {
        userId,
        majorId,
        schoolId,
        activityScope: {
          major: scope.major?.map(id => id.toString()),
          school: scope.school?.map(id => id.toString()),
          user: scope.user?.map(id => id.toString())
        }
      });

      const isInUserScope = scope.user?.some(id => id.toString() === userId);
      const isInMajorScope = majorId && scope.major?.some(id => id.toString() === majorId);
      const isInSchoolScope = schoolId && scope.school?.some(id => id.toString() === schoolId);

      const hasScopeRestrictions = 
        (scope.major?.length ?? 0) > 0 || 
        (scope.school?.length ?? 0) > 0 || 
        (scope.user?.length ?? 0) > 0;

      console.log('Scope check results:', {
        isInUserScope,
        isInMajorScope,
        isInSchoolScope,
        hasScopeRestrictions
      });

      if (hasScopeRestrictions && !isInUserScope && !isInMajorScope && !isInSchoolScope) {
        throw new BadRequestException(
          `User is not in the allowed scope for activity "${activity.name?.th || activity.name?.en}"`
        );
      }
    }
  
    const newCheckin = new this.checkinModel({
      user: new Types.ObjectId(createCheckinDto.user),
      staff: new Types.ObjectId(createCheckinDto.staff),
      activities: createCheckinDto.activities.map(activity => new Types.ObjectId(activity)),
    });
    
    return newCheckin.save();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Checkin>({
      model: this.checkinModel,
      query: {
        ...query,
        excluded: 'user.password,user.refreshToken,user.role.permissions,user.role.metadataSchema',
      },
      filterSchema: {},
      populateFields: (excluded) =>
        Promise.resolve(
          excluded.includes('user') ? [] : [{ path: 'user' }, { path: 'activities' }] as PopulateField[],
        ),
    });
  }

  async findOne(id: string) {
    return queryFindOne<Checkin>(this.checkinModel, { _id: id }, [
      { path: 'user' },
      { path: 'activities' },
    ]);
  }

  async update(id: string, updateCheckinDto: UpdateCheckinDto) {
    if (updateCheckinDto.user) {
      await findOrThrow(
        this.userModel,
        new Types.ObjectId(updateCheckinDto.user),
        'User not found',
      );
    }

    if (updateCheckinDto.staff) {
      await findOrThrow(
        this.userModel,
        new Types.ObjectId(updateCheckinDto.staff),
        'Staff not found',
      );
    }

    if (updateCheckinDto.activities) {
      for (const activity of updateCheckinDto.activities) {
        await findOrThrow(
          this.activitiesModel,
          new Types.ObjectId(activity),
          'Activity not found',
        );
      }
    }
    return queryUpdateOne<Checkin>(this.checkinModel, id, updateCheckinDto);
  }

  async remove(id: string) {
    await findOrThrow(
      this.checkinModel,
      id,
      'Checkin not found'
    );

    return await this.checkinModel.findByIdAndDelete(id);
  }
}
