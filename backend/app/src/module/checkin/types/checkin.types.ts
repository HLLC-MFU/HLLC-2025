import { Types } from 'mongoose';
import { Localization } from 'src/pkg/types/common';

export type UserWithRole = {
  _id: Types.ObjectId;
  role: {
    name: string;
  };
  metadata: {
    major: {
      _id: Types.ObjectId;
      school: {
        _id: Types.ObjectId;
      };
    };
  };
};

export type ActivityMetadata = {
  startAt: Date;
  endAt: Date;
  scope: {
    major: Types.ObjectId[];
    school: Types.ObjectId[];
    user: Types.ObjectId[];
  };
};

export type ActivityWithMetadata = {
  _id: Types.ObjectId;
  name: Localization;
  metadata: ActivityMetadata;
};