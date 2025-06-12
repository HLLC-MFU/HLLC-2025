import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePreTestAnswerDto } from './dto/create-pre-test-answer.dto';
import { UpdatePreTestAnswerDto } from './dto/update-pre-test-answer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PreTestAnswer, PreTestAnswerDocument } from './schema/pre-test-answer.schema';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';

@Injectable()
export class PreTestAnswerService {

  constructor(
    @InjectModel(PreTestAnswer.name)
    private PretestAnswerModel: Model<PreTestAnswerDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(createPreTestAnswerDto: CreatePreTestAnswerDto) {
    const { user, values } = createPreTestAnswerDto

    const userexists = await this.userModel.exists({ _id: user})
    if (!userexists) throw new NotFoundException('User not found')

    const filter = { user: new Types.ObjectId(user)}

    const existingvalues = new Set(
      ( await this.PretestAnswerModel.findOne(filter).select('values.pretest').lean())?.values.map(v => v.pretest.toString()) ?? []
    )

    const newValues = values.filter( a => !existingvalues.has(a.pretest));
    if (!newValues.length) throw new BadRequestException('Pre-Test answer already exist for this user')
    
    const answerToInsert = newValues.map(values => ({
      pretest: new Types.ObjectId(values.pretest),
      value: values.value
    }))

    const update = {
      $addToSet: {
        values: { $each: answerToInsert}
      }
    }
    return await queryUpdateOneByFilter<PreTestAnswer>(
      this.PretestAnswerModel,
      filter,
      update,
      { upsert: true}
    )
  }

  async findAll( query: Record<string,string>) {
    return await queryAll<PreTestAnswer>({
      model: this.PretestAnswerModel,
      query,
      filterSchema: {}
    })
  }

  async findOne(id: string): Promise<{ data: PreTestAnswer[] | null; message: string}> {
    return await queryFindOne(this.PretestAnswerModel, {_id:id})
  }

  async update(id: string, updatePreTestAnswerDto: UpdatePreTestAnswerDto) {
    return await queryUpdateOne(this.PretestAnswerModel, id, updatePreTestAnswerDto)
  }

  async remove(id: string) {
    return await queryDeleteOne(this.PretestAnswerModel, id)
  }
}
