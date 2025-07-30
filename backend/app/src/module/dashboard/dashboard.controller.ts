import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PretestPosttestDashboardService } from './services/pretest-posttest.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService,
  private readonly pretestPosttestDashboardService: PretestPosttestDashboardService
  ) {}
  
  @Get('pretest-answers')
  async getPretestDashboard() {
    const result= await this.pretestPosttestDashboardService.getPretestDashboard();
    return result;
  }

  @Get('posttest-answers')
  async getPosttestDashboard() {
    const result = await this.pretestPosttestDashboardService.getPosttestDashboard();
    return result;
  } 

  @Get('activities')
  async getActivitiesDashboard() {
    const { dashboard } = await this.dashboardService.getActivitiesDashboard();
    return dashboard;
  }
}
