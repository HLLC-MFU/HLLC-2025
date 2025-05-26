import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';

// Entity & Document
import { Report, ReportDocument } from './schemas/reports.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ReportCategory, ReportCategoryDocument } from '../report_categories/schemas/report_categories.schemas';

// DTO
import { CreateReportDto } from './dto/create-report.dto';

// Helpers
import { queryAll, queryFindOne, queryUpdateOne, queryDeleteOne } from 'src/pkg/helper/query.util';
import { findOrThrow, throwIfExists } from 'src/pkg/validator/model.validator';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { UpdateReportDto } from './dto/update-report.dto';

const userSelectFields = 'username name';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(ReportCategory.name)
    private readonly categoryModel: Model<ReportCategoryDocument>,
  ) {}

  async create(createReportDto: CreateReportDto) {
  // 1. ตรวจสอบความถูกต้องของ reporter และ category
  await findOrThrow(this.userModel, createReportDto.reporter, 'User not found');
  await findOrThrow(this.categoryModel, createReportDto.category, 'Category not found');

  // 2. สร้างเอกสารใหม่
  const report = new this.reportModel({
    ...createReportDto,
    reporter: new Types.ObjectId(createReportDto.reporter),
    category: new Types.ObjectId(createReportDto.category),
  });

  try {
    // 3. บันทึกข้อมูล
    const saved = await report.save();

    // 4. ดึงข้อมูลพร้อม populate หลังบันทึก
    const populateFields: PopulateOptions[] = [
      { path: 'reporter', select: userSelectFields },
      { path: 'category' },
    ];

    const populated = await this.reportModel
      .findById(saved._id)
      .populate(populateFields)
      .lean()
      .exec();

    // 5. ส่ง response
    return {
      message: 'Report created successfully',
      createdId: saved._id,
      data: populated,
    };
  } catch (error) {
    handleMongoDuplicateError(error, 'reporter');
  }
}


  async findAll(query: Record<string, string>) {
    return queryAll<Report>({
      model: this.reportModel,
      query,
      filterSchema: {},
      buildPopulateFields: () =>
        Promise.resolve([
          { path: 'reporter', select: userSelectFields },
          { path: 'category'},
        ]),
    });
  }

  async findOne(id: string) {
  const populateFields: PopulateOptions[] = [
  { path: 'reporter', select: userSelectFields },
  { path: 'category' },
  ];
   return queryFindOne<Report>(
      this.reportModel,
      { _id: id },
      populateFields,
    );
  }


  async update(id: string, updateReportDto: UpdateReportDto) {
  // 1. อัปเดตข้อมูลก่อน
  const updated = await queryUpdateOne<Report>(
    this.reportModel,
    id,
    updateReportDto,
  );

  // 2. ถ้าไม่เจอ → ขว้าง error
  if (!updated) {
    throw new NotFoundException('Report not found');
  }

  // 3. ดึงข้อมูลที่ populate แล้ว (เหมือน findOne)
  const populateFields: PopulateOptions[] = [
    { path: 'reporter', select: userSelectFields },
    { path: 'category' },
  ];

  const populated = await this.reportModel
    .findById(id)
    .populate(populateFields)
    .lean()
    .exec();

  // 4. ส่ง response
  return {
    message: 'Report updated successfully',
    updatedId: id,
    data: populated,
  };
}



  async remove(id: string) {
  // 1. หา document ก่อนว่ามีจริงไหม
  const found = await this.reportModel.findById(id).lean();

  // 2. ถ้าไม่เจอ → ขว้าง error เลย
  if (!found) {
    throw new NotFoundException('Report not found');
  }

  // 3. ถ้าเจอ → ลบ
  await this.reportModel.findByIdAndDelete(id).exec();

  // 4. ส่ง response กลับไปหา client
  return {
    message: 'Report deleted successfully',
    deletedId: id,
  };
}



}
