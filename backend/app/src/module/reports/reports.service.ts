import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Report, ReportDocument } from './schemas/reports.schema'
import { Model } from 'mongoose';
import { error } from 'console';

@Injectable()
export class ReportsService {
  constructor (
    @InjectModel(Report.name) private reportModel:Model<ReportDocument>,
  ){}

  async create(createReportDto: CreateReportDto): Promise<Report> {
    const result = new this.reportModel(createReportDto);

    return result.save();
  }

  async findAll():Promise<Report[]> {

    return this.reportModel.find().exec();
  }

  async findOne(id: string) {

    return this.reportModel.findById(id).exec();
  }

  async update(id: string, updateReportDto: UpdateReportDto) {
    const result = this.reportModel.findByIdAndUpdate(id,updateReportDto, { new:true})
    .exec();
    return result;
  }

  async remove(id: string) {
    try{
      const result = await this.reportModel.findByIdAndDelete(id)
    .exec();
    if (!result) {
      return { massage: 'id not found'};
    }
    return { massage: 'Delete successful'}
    }catch (error) {
      return { error };
    }    
    
  }
}
