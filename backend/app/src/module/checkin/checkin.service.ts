import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Checkin, CheckinDocument } from './schema/checkin.schema';
import { Model, Types } from 'mongoose';
import { findOrThrow } from 'src/pkg/validator/model.validator';
import {
  queryAll,
  queryFindOne,
} from 'src/pkg/helper/query.util';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Activities, ActivityDocument } from '../activities/schema/activities.schema';
import { PopulateField } from 'src/pkg/types/query';
import { ActivitiesService } from '../activities/service/activities.service';
import { RoleService } from '../role/role.service';
import { UsersService } from '../users/users.service';
import { ActivityWithMetadata, UserWithRole } from './types/checkin.types';

@Injectable()
export class CheckinService {
  private readonly THAI_TZ_OFFSET = 7; // UTC+7 for Thailand

  private getThaiTime(date: Date): Date {
    return new Date(date.getTime() + (this.THAI_TZ_OFFSET * 60 * 60 * 1000));
  }

  private formatThaiTime(date: Date): string {
    return this.getThaiTime(date).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

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

  async create(createCheckinDto: CreateCheckinDto): Promise<CheckinDocument> {
    const { user } = await this.validateUserAndStaff(
      createCheckinDto.user,
      createCheckinDto.staff!
    );

    // Validate all activities in parallel for better performance
    const activities = await Promise.all(
      createCheckinDto.activities.map(id => this.activitiesService.findOne(id))
    );

    // Validate each activity's time and scope
    activities.forEach(activity => {
      if (!activity) {
        throw new BadRequestException('One or more activities not found');
      }

      const activityWithMetadata = activity as unknown as ActivityWithMetadata;
      this.validateActivityTime(activityWithMetadata);
      this.validateActivityScope(activityWithMetadata, user);
    });

    // Create checkin record
    const newCheckin = new this.checkinModel({
      user: new Types.ObjectId(createCheckinDto.user),
      staff: new Types.ObjectId(createCheckinDto.staff),
      activities: createCheckinDto.activities.map(id => new Types.ObjectId(id)),
    });

    return newCheckin.save();
  }

  async findAll(query: Record<string, string>) {
    const excludedFields = 'user.password,user.refreshToken,user.role.permissions,user.role.metadataSchema';
    const populateFields: PopulateField[] = [
      { path: 'user' },
      { path: 'activities' }
    ];

    return queryAll<Checkin>({
      model: this.checkinModel,
      query: { ...query, excluded: excludedFields },
      filterSchema: {},
      populateFields: () => Promise.resolve(populateFields),
    });
  }

  async findOne(id: string) {
    return queryFindOne<Checkin>(this.checkinModel, { _id: id }, [
      { path: 'user' },
      { path: 'activities' },
    ]);
  }

  async update(id: string, updateCheckinDto: UpdateCheckinDto) {
    await Promise.all([
      updateCheckinDto.user && findOrThrow(
        this.userModel,
        new Types.ObjectId(updateCheckinDto.user),
        'User not found'
      ),
      updateCheckinDto.staff && findOrThrow(
        this.userModel,
        new Types.ObjectId(updateCheckinDto.staff),
        'Staff not found'
      ),
      ...(updateCheckinDto.activities || []).map(activityId =>
        findOrThrow(
          this.activitiesModel,
          new Types.ObjectId(activityId),
          'Activity not found'
        )
      )
    ]);

    return this.checkinModel.findByIdAndUpdate(
      id,
      updateCheckinDto,
      { new: true }
    ).exec();
  }

  async remove(id: string) {
    await findOrThrow(this.checkinModel, id, 'Checkin not found');
    return this.checkinModel.findByIdAndDelete(id).exec();
  }

  /**
   * Validate user and staff
   * @param userId - User ID
   * @param staffId - Staff ID
   * @returns {Promise<{ user: UserWithRole; staffRole: string }>} - User and staff role
   */
  private async validateUserAndStaff(userId: string, staffId: string): Promise<{ user: UserWithRole; staffRole: string }> {
    const [userResult, staff] = await Promise.all([
      this.usersService.findOneByQuery({ _id: userId }),
      this.userModel.findById(new Types.ObjectId(staffId))
        .populate('role', 'name metadataScanned')
        .lean()
    ]);

    const user = userResult?.data?.[0] as unknown as UserWithRole;
    const staffData = staff as unknown as UserWithRole & { role: { metadataScanned?: Record<string, any> } };

    if (!user?.role?.name || !staffData?.role?.name) {
      throw new BadRequestException('User or staff not found or missing role');
    }

    const canScan = await this.roleService.canScan(staffData.role.name, user.role.name);
    if (!canScan) {
      throw new UnauthorizedException(
        `Staff with role "${staffData.role.name}" is not allowed to scan users with role "${user.role.name}"`
      );
    }

    // Check staff's scanning scope
    const staffScanConfig = staffData.role.metadataScanned?.['default'];
    if (staffScanConfig?.scope) {
      const staffScope = staffScanConfig.scope;
      const userMajorId = user.metadata?.major?._id?.toString();
      const userSchoolId = user.metadata?.major?.school?._id?.toString();

      if (staffScope.type === 'major' && staffScope.values?.length > 0) {
        if (!userMajorId || !staffScope.values.includes(userMajorId)) {
          throw new UnauthorizedException(
            'Staff is not authorized to scan users from this major'
          );
        }
      } else if (staffScope.type === 'school' && staffScope.values?.length > 0) {
        if (!userSchoolId || !staffScope.values.includes(userSchoolId)) {
          throw new UnauthorizedException(
            'Staff is not authorized to scan users from this school'
          );
        }
      }
    }

    return { user, staffRole: staffData.role.name };
  }

  /**
   * Validate activity time
   * @param activity - Activity
   */
  private validateActivityTime(activity: ActivityWithMetadata): void {
    const { startAt, endAt } = activity.metadata || {};
    if (!startAt || !endAt) return;

    const now = this.getThaiTime(new Date());
    const activityStartAt = this.getThaiTime(new Date(startAt));
    const activityEndAt = this.getThaiTime(new Date(endAt));
    const activityName = activity.name?.th || activity.name?.en;

    if (now < activityStartAt) {
      throw new BadRequestException(
        `Activity "${activityName}" has not started yet. Starts at ${this.formatThaiTime(startAt)}`
      );
    }

    if (now > activityEndAt) {
      throw new BadRequestException(
        `Activity "${activityName}" has already ended at ${this.formatThaiTime(endAt)}`
      );
    }
  }

  /**
   * Validate activity scope
   * @param activity - Activity
   * @param user - User
   */
  private validateActivityScope(activity: ActivityWithMetadata, user: UserWithRole): void {
    const scope = activity.metadata?.scope;
    if (!scope) return;

    const userId = user._id.toString();
    const majorId = user.metadata?.major?._id?.toString();
    const schoolId = user.metadata?.major?.school?._id?.toString();

    const isInUserScope = scope.user?.some(id => id.toString() === userId);
    const isInMajorScope = majorId && scope.major?.some(id => id.toString() === majorId);
    const isInSchoolScope = schoolId && scope.school?.some(id => id.toString() === schoolId);

    const hasScopeRestrictions = Boolean(
      (scope.major?.length ?? 0) ||
      (scope.school?.length ?? 0) ||
      (scope.user?.length ?? 0)
    );

    if (hasScopeRestrictions && !isInUserScope && !isInMajorScope && !isInSchoolScope) {
      throw new BadRequestException(
        `User is not in the allowed scope for activity "${activity.name?.th || activity.name?.en}"`
      );
    }
  }
}
