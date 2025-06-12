import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePretestAnswerDto } from './dto/create-pretest-answer.dto';
import { UpdatePretestAnswerDto } from './dto/update-pretest-answer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PretestAnswer, PretestAnswerDocument } from './schema/pre-test-answer.schema';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';

@Injectable()
export class PretestAnswerService {

  constructor(
    @InjectModel(PretestAnswer.name)
    private pretestAnswerModel: Model<PretestAnswerDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(createPretestAnswerDto: CreatePretestAnswerDto) {
    const { user, answers } = createPretestAnswerDto

    const userexists = await this.userModel.exists({ _id: user})
    if (!userexists) throw new NotFoundException('User not found')

    const filter = { user: new Types.ObjectId(user)}

    const existinganswers = new Set(
      ( await this.pretestAnswerModel.findOne(filter).select('answers.pretest').lean())?.answers.map(v => v.pretest.toString()) ?? []
    )

    const newAnswers = answers.filter( a => !existinganswers.has(a.pretest));
    if (!newAnswers.length) throw new BadRequestException('Pre-Test answer already exist for this user')
    
    const answerToInsert = newAnswers.map(answers => ({
      pretest: new Types.ObjectId(answers.pretest),
      answer: answers.answer
    }))

    const update = {
      $addToSet: {
        answers: { $each: answerToInsert}
      }
    }
    return await queryUpdateOneByFilter<PretestAnswer>(
      this.pretestAnswerModel,
      filter,
      update,
      { upsert: true}
    )
  }

  async findAll( query: Record<string,string>) {
    return await queryAll<PretestAnswer>({
      model: this.pretestAnswerModel,
      query,
      filterSchema: {}
    })
  }

  async findOne(id: string): Promise<{ data: PretestAnswer[] | null; message: string}> {
    return await queryFindOne(this.pretestAnswerModel, {_id:id})
  }

  async update(id: string, updatePreTestAnswerDto: UpdatePretestAnswerDto) {
    return await queryUpdateOne(this.pretestAnswerModel, id, updatePreTestAnswerDto)
  }

  async remove(id: string) {
    return await queryDeleteOne(this.pretestAnswerModel, id)
  }
}
