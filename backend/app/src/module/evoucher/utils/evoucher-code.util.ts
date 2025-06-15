import { BadRequestException } from '@nestjs/common';
import { Model, Types, HydratedDocument } from 'mongoose';
import { EvoucherDocument, EvoucherType } from '../schema/evoucher.schema';
import { EvoucherCodeDocument } from '../schema/evoucher-code.schema';
import {
  BulkGenerateInput,
  VoucherCodeInsert,
  VoucherUpdateParams
} from '../types/evoucher-code.type';

/**
 * ตรวจสอบว่า Evoucher ยังสามารถใช้งานได้หรือไม่
 * - ถ้าไม่เจอ หรือ หมดอายุ → throw error
 * @param evoucherId - รหัส Evoucher
 * @param evoucherModel - Model ของ Evoucher
 * @returns Document ของ Evoucher
 */
export async function validateEvoucherExpired(evoucherId: string, evoucherModel: Model<EvoucherDocument>) {
  const evoucher = await evoucherModel.findById(evoucherId);
  if (!evoucher) throw new BadRequestException('Evoucher not found');
  if (new Date() > new Date(evoucher.expiration)) {
    throw new BadRequestException('Evoucher expired');
  }
  return evoucher;
} 

/**
 * ตรวจสอบว่า Evoucher ประเภทนี้สามารถ Claim ได้หรือไม่
 * - อนุญาตเฉพาะประเภท GLOBAL
 * @param type - ประเภทของ Evoucher
 */
export function validateEvoucherTypeClaimable(type: EvoucherType) {
  if (type !== EvoucherType.GLOBAL) {
    throw new BadRequestException('This type is not claimable');
  }
}

/**
 * ตรวจสอบว่าผู้ใช้เคย Claim Evoucher นี้ไปแล้วหรือยัง
 * - ถ้าเคย Claim แล้ว → throw error
 * @param userId - รหัสผู้ใช้
 * @param evoucherId - รหัส Evoucher
 * @param evoucherCodeModel - Model ของ Evoucher Code
 */
export async function validateUserDuplicateClaim(
    userId: string,
    evoucherId: string,
    evoucherCodeModel: Model<EvoucherCodeDocument>
  ): Promise<void> {
    const exists = await evoucherCodeModel.findOne({
      user: new Types.ObjectId(userId),
      evoucher: new Types.ObjectId(evoucherId),
    });
    if (exists) throw new BadRequestException('You already have this evoucher');
  }
  

/**
 * ตรวจสอบเงื่อนไขก่อนอัปเดต Voucher Code
 * - ห้ามใช้ซ้ำ ห้ามแก้กลับมาเป็นยังไม่ใช้
 * - เช็ควันหมดอายุด้วย
 * @param params - ข้อมูลสำหรับตรวจสอบ
 */
export function validateUpdateVoucher(params: VoucherUpdateParams) {
  const { currentVoucherIsUsed, updateIsUsed, evoucherExpiration } = params;

  if (updateIsUsed === true && currentVoucherIsUsed) {
    throw new BadRequestException('Already used');
  }
  if (currentVoucherIsUsed && updateIsUsed === false) {
    throw new BadRequestException('Cannot reuse');
  }
  if (new Date() > new Date(evoucherExpiration)) {
    throw new BadRequestException('Voucher code expired');
  }
}

/**
 * สร้างรหัส Voucher Code ถัดไป (Next Code)
 * - ใช้เลข running number ต่อจากตัวล่าสุด
 * @param evoucherCodeModel - Model ของ Evoucher Code
 * @param acronym - Prefix ของ Evoucher
 * @returns รหัส Voucher Code ใหม่
 */
export async function generateNextVoucherCode(
  evoucherCodeModel: Model<EvoucherCodeDocument>,
  acronym: string
): Promise<string> {
  const latest = await evoucherCodeModel.findOne({ code: new RegExp(`^${acronym}\\d+$`) }).sort({ code: -1 });
  const lastNumber = latest?.code.match(/\d+$/)?.[0] ?? '0';
  const nextNumber = (parseInt(lastNumber, 10) + 1).toString().padStart(6, '0');
  return `${acronym}${nextNumber}`;
}

/**
 * สร้างรหัส Voucher Code หลายรหัสพร้อมกัน
 * - ใช้เลข running number ต่อจากตัวล่าสุด
 * @param dto - ข้อมูลสำหรับสร้างรหัส
 * @param evoucher - Document ของ Evoucher
 * @param existingCodes - รหัส Voucher Code ที่มีอยู่
 * @returns รหัส Voucher Code ที่สร้างขึ้น
 */
export function generateBulkVoucherCodes(
  dto: BulkGenerateInput,
  evoucher: EvoucherDocument,
  existingCodes: EvoucherCodeDocument[]
): VoucherCodeInsert[] {
  const existingNumbers = new Set(existingCodes.map(c => parseInt(c.code.replace(evoucher.acronym, ''))));
  const codesToInsert: VoucherCodeInsert[] = [];
  let current = Math.max(...Array.from(existingNumbers), 0) + 1;

  while (codesToInsert.length < dto.count) {
    const code = `${evoucher.acronym}${String(current).padStart(6, '0')}`;
    if (!existingNumbers.has(current)) {
      codesToInsert.push({
        code,
        evoucher: new Types.ObjectId(dto.evoucher),
        user: new Types.ObjectId(dto.user),
        isUsed: false,
        metadata: { expiration: evoucher.expiration }
      });
    }
    current++;
  }
  return codesToInsert;
}

/**
 * รับรหัส Voucher Code จากผู้ใช้
 * - ถ้าไม่มีรหัสที่สอดคล้อง จะสร้างรหัสใหม่
 * @param userId - รหัสผู้ใช้
 * @param evoucher - Document ของ Evoucher
 * @param evoucherCodeModel - Model ของ Evoucher Code
 * @returns Document ของ Voucher Code
 */
export async function claimVoucherCode(
  userId: string,
  evoucher: EvoucherDocument,
  evoucherCodeModel: Model<EvoucherCodeDocument>
) {
  let code = await evoucherCodeModel.findOneAndUpdate(
    { evoucher: evoucher._id, user: null, isUsed: false },
    { user: new Types.ObjectId(userId) },
    { new: true }
  );

  if (!code) {
    const generatedCode = await generateNextVoucherCode(evoucherCodeModel, evoucher.acronym);
    code = await new evoucherCodeModel({
      code: generatedCode,
      evoucher: evoucher._id,
      user: new Types.ObjectId(userId),
      isUsed: false,
      metadata: { expiration: evoucher.expiration }
    }).save();
  }

  return code;
}

/**
 * ตรวจสอบว่า Evoucher สามารถ Claim ได้หรือไม่
 * - ถ้าเป็น GLOBAL และยังไม่มีผู้ใช้ Claim แล้ว จะสามารถ Claim ได้
 * @param evouchers - รายการ Evoucher
 * @param evoucherCodeModel - Model ของ Evoucher Code
 * @param userId - รหัสผู้ใช้
 * @returns รายการ Evoucher ที่สามารถ
 */
export async function validatePublicAvailableVouchers(
  evouchers: EvoucherDocument[],
  evoucherCodeModel: Model<EvoucherCodeDocument>,
  userId?: string
) {
  return await Promise.all(
    evouchers.map(async (evoucher) => {
      const expired = new Date() > new Date(evoucher.expiration);
      let userHas = false;

      if (userId) {
        const code = await evoucherCodeModel.exists({ user: userId, evoucher: evoucher._id });
        userHas = !!code;
      }

      let availableCount = 0;
      if (evoucher.type === EvoucherType.GLOBAL) {
        availableCount = userHas ? 0 : 1;
      } else {
        availableCount = await evoucherCodeModel.countDocuments({
          evoucher: evoucher._id,
          user: null,
          isUsed: false
        });
      }

      const canClaim = evoucher.type === EvoucherType.GLOBAL && !userHas && !expired;
      return {
        ...evoucher,
        isClaimable: evoucher.type === EvoucherType.GLOBAL,
        userHas,
        availableCount,
        expired,
        canClaim,
      };
    })
  );
}
