import { Types } from 'mongoose';
import { User } from '../../../module/users/schemas/user.schema';
import { Role } from '../../../module/role/schemas/role.schema';
import { Major } from '../../../module/majors/schemas/major.schema';
import { School } from '../../../module/schools/schemas/school.schema';

// Enriched User Interface
export interface EnrichedUser extends User {
  role: Role;
  metadata: {
    majorId?: string | Types.ObjectId;
    major?: Major;
    schoolId?: string | Types.ObjectId;
    school?: School;
    [key: string]: unknown;
  };
}
