import { Types } from 'mongoose';

export type ActivityScope = {
  user?: (string | Types.ObjectId)[];
  major?: (string | Types.ObjectId)[];
  school?: (string | Types.ObjectId)[];
};
