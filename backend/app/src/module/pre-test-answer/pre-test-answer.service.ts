import { Injectable } from '@nestjs/common';
import { CreatePreTestAnswerDto } from './dto/create-pre-test-answer.dto';
import { UpdatePreTestAnswerDto } from './dto/update-pre-test-answer.dto';

@Injectable()
export class PreTestAnswerService {
  create(createPreTestAnswerDto: CreatePreTestAnswerDto) {
    return 'This action adds a new preTestAnswer';
  }

  findAll() {
    return `This action returns all preTestAnswer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} preTestAnswer`;
  }

  update(id: number, updatePreTestAnswerDto: UpdatePreTestAnswerDto) {
    return `This action updates a #${id} preTestAnswer`;
  }

  remove(id: number) {
    return `This action removes a #${id} preTestAnswer`;
  }
}
