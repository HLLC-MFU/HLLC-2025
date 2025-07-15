import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreatePosttestAnswerDto } from '../dto/posttest-answer/create-posttest-answer.dto';
import { PosttestAnswersService } from '../service/posttest-answers.service';
import { UserRequest } from 'src/pkg/types/users';

@UseGuards(PermissionsGuard)
@Controller('posttest-answers')
export class PosttestAnswersController {
  constructor(
    private readonly posttestAnswersService: PosttestAnswersService,
  ) { }

  @Post()
  create(@Req() req: UserRequest) {
    const dto = req.body as CreatePosttestAnswerDto
    dto.user = req.user._id.toString()
    return this.posttestAnswersService.create(dto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.posttestAnswersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.posttestAnswersService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.posttestAnswersService.remove(id);
  }

  @Get('/all/average')
  getAverageAll() {
    return this.posttestAnswersService.averageAllPosttests();
  }

  @Get('user')
  async findByUser(@Req() req: UserRequest) {
    const userId = req.user._id.toString();
    return this.posttestAnswersService.findByUserId(userId);
  }
}
