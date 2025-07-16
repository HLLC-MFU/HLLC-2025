import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { calculateDistance } from './calculate-distance';
import { Landmark } from '../schema/landmark.schema';
import { CoinCollection } from '../schema/coin-collection.schema';
import { Evoucher } from 'src/module/evouchers/schemas/evoucher.schema';


@Injectable()
export class CoinCollectionsHelper {
    checkLandmarkExists(landmark: Landmark | null): asserts landmark is NonNullable<typeof landmark> {
        if (!landmark) {
            throw new NotFoundException('Landmark not found');
        }
    }

    checkDistance(
        userLat: number,
        userLong: number,
        landmarkLat: number,
        landmarkLong: number,
        limit: number,
    ) {
        const distance = calculateDistance(userLat, userLong, landmarkLat, landmarkLong);
        if (distance > limit) {
            throw new BadRequestException('You are too far from the landmark');
        }
        return distance;
    }

    checkCooldown(cooldownResults: any[], remainingCooldownMs: number) {
        if (cooldownResults.length > 0) {
            throw new BadRequestException({
                message: 'Landmark is in cooldown',
                remainingCooldownMs,
            });
        }
    }

    checkAlreadyCollected(collection: CoinCollection | null, landmarkId: Types.ObjectId) {
        if (
            collection?.landmarks.some((item) =>
                item.landmark.equals(landmarkId),
            )
        ) {
            throw new BadRequestException('Already collected this landmark');
        }
    }

    // checkEvoucherAlreadyClaimed(claimedBefore: any) {
    //     if (claimedBefore) {
    //         throw new BadRequestException('No coins available for this landmark');
    //     }
    // }

    checkEvoucherAvailability(evouchers: Evoucher[]) {
        if (evouchers.length === 0) {
            throw new BadRequestException('No coins and no evouchers available for this landmark');
        }
    }

    checkEvoucherClaimLimit(userClaimCount: number, maxClaims?: number): boolean {
        return userClaimCount < (maxClaims ?? Infinity);
    }

    buildEvoucherMetadata(landmarkId: string) {
        return {
            source: 'no-coin-reward',
            landmark: landmarkId,
        };
    }

    buildNewCoinCollection(userObjectId: Types.ObjectId, landmarkObjectId: Types.ObjectId) {
        return {
            user: userObjectId,
            landmarks: [{ landmark: landmarkObjectId, collectedAt: new Date() }],
        };
    }

    buildCollectedLandmark(landmarkObjectId: Types.ObjectId) {
        return {
            landmark: landmarkObjectId,
            collectedAt: new Date(),
        };
    }
}
