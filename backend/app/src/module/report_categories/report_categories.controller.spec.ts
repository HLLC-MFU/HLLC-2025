import { Test, TestingModule } from '@nestjs/testing';
import { ReportCategoriesController } from './report_categories.controller';
import { ReportCategoriesService } from './report_categories.service';

describe('ReportCategoriesController', () => {
  let controller: ReportCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportCategoriesController],
      providers: [ReportCategoriesService],
    }).compile();

    controller = module.get<ReportCategoriesController>(ReportCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
