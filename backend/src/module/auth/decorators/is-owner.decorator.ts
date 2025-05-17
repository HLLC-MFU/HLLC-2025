// auth/decorators/is-owner.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_OWNER_KEY = 'isOwnerParam';
export const IsOwner = (param: string) => SetMetadata(IS_OWNER_KEY, param);
