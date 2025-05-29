import { Injectable } from '@nestjs/common';
import { CreateSystemStatusDto } from './dto/create-system-status.dto';
import { UpdateSystemStatusDto } from './dto/update-system-status.dto';
import { InjectModel } from '@nestjs/mongoose';
import { SystemStatus, SystemStatusDocument } from './schemas/system-status.schema';
import { Model } from 'mongoose';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class SystemStatusService {
  constructor(
    @InjectModel(SystemStatus.name)
    private systemStatusModel: Model<SystemStatusDocument>,
  ) { }

  async create(createSystemStatusDto: CreateSystemStatusDto) {
    const systemStatus = new this.systemStatusModel({
      ...createSystemStatusDto,
    });

    try {
      return await systemStatus.save();
    } catch (error) {
      error;
    }
  }

  async findAll(query: Record<string, string>) {
    return queryAll<SystemStatus>({
      model: this.systemStatusModel,
      query,
      filterSchema: {},
    });
  }

  async findOne(id: string) {
    return queryFindOne<SystemStatus>(this.systemStatusModel, { _id: id }, []);
  }

  async update(id: string, updateSystemStatusDto: UpdateSystemStatusDto) {
    return queryUpdateOne<SystemStatus>(this.systemStatusModel, id, updateSystemStatusDto);
  }

  async remove(id: string) {
    await queryDeleteOne<SystemStatus>(this.systemStatusModel, id);
    return {
      message: 'System status deleted successfully',
      id,
    }

  }
}
