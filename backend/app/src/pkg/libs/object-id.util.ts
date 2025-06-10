import { Types } from 'mongoose';

/**
 * Converts an array of string/ObjectId to a clean array of valid ObjectId.
 */
export const toValidObjectIds = (
  input?: string | Types.ObjectId | (string | Types.ObjectId)[],
): Types.ObjectId[] => {
  const list = Array.isArray(input) ? input : input ? [input] : [];

  return list
    .map((id) => id?.toString().trim())
    .filter((id): id is string => Boolean(id && Types.ObjectId.isValid(id)))
    .map((id) => new Types.ObjectId(id));
};
