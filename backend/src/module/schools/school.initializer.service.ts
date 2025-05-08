import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { School, SchoolDocument } from './schemas/school.schema';

@Injectable()
export class SchoolInitializerService implements OnModuleInit {
  private readonly logger = new Logger(SchoolInitializerService.name);

  constructor(
    @InjectModel(School.name) private readonly schoolModel: Model<SchoolDocument>
  ) {}

  async onModuleInit() {
    await this.createDefaultSchools();
  }

  private async createDefaultSchools() {
    this.logger.log('Checking for default faculties...');
    
    const faculties = [
      {
        name: {
          th: 'คณะวิศวกรรมศาสตร์',
          en: 'Faculty of Engineering'
        },
        acronym: {
          th: 'วิศวะ',
          en: 'ENG'
        },
        detail: {
          th: 'คณะที่เน้นการเรียนการสอนด้านวิศวกรรมศาสตร์และเทคโนโลยี',
          en: 'Faculty focused on engineering and technology education'
        },
        photo: {
          coverPhoto: 'https://example.com/eng-cover.jpg',
          bannerPhoto: 'https://example.com/eng-banner.jpg',
          thumbnailPhoto: 'https://example.com/eng-thumbnail.jpg',
          logoPhoto: 'https://example.com/eng-logo.jpg'
        }
      },
      {
        name: {
          th: 'คณะเทคโนโลยีสารสนเทศ',
          en: 'Faculty of Information Technology'
        },
        acronym: {
          th: 'ไอที',
          en: 'IT'
        },
        detail: {
          th: 'คณะที่เน้นการศึกษาด้านเทคโนโลยีสารสนเทศและคอมพิวเตอร์',
          en: 'Faculty focused on information technology and computer studies'
        },
        photo: {
          coverPhoto: 'https://example.com/it-cover.jpg',
          bannerPhoto: 'https://example.com/it-banner.jpg',
          thumbnailPhoto: 'https://example.com/it-thumbnail.jpg',
          logoPhoto: 'https://example.com/it-logo.jpg'
        }
      },
      {
        name: {
          th: 'คณะวิทยาศาสตร์',
          en: 'Faculty of Science'
        },
        acronym: {
          th: 'วิทย์',
          en: 'SCI'
        },
        detail: {
          th: 'คณะที่เน้นการศึกษาด้านวิทยาศาสตร์และการวิจัย',
          en: 'Faculty focused on scientific studies and research'
        },
        photo: {
          coverPhoto: 'https://example.com/sci-cover.jpg',
          bannerPhoto: 'https://example.com/sci-banner.jpg',
          thumbnailPhoto: 'https://example.com/sci-thumbnail.jpg',
          logoPhoto: 'https://example.com/sci-logo.jpg'
        }
      },
      {
        name: {
          th: 'คณะบริหารธุรกิจ',
          en: 'Faculty of Business Administration'
        },
        acronym: {
          th: 'บริหาร',
          en: 'BA'
        },
        detail: {
          th: 'คณะที่เน้นการศึกษาด้านการบริหารธุรกิจและการจัดการ',
          en: 'Faculty focused on business administration and management'
        },
        photo: {
          coverPhoto: 'https://example.com/ba-cover.jpg',
          bannerPhoto: 'https://example.com/ba-banner.jpg',
          thumbnailPhoto: 'https://example.com/ba-thumbnail.jpg',
          logoPhoto: 'https://example.com/ba-logo.jpg'
        }
      },
      {
        name: {
          th: 'คณะสถาปัตยกรรมศาสตร์',
          en: 'Faculty of Architecture'
        },
        acronym: {
          th: 'สถาปัตย์',
          en: 'ARCH'
        },
        detail: {
          th: 'คณะที่เน้นการศึกษาด้านการออกแบบและสถาปัตยกรรม',
          en: 'Faculty focused on design and architecture'
        },
        photo: {
          coverPhoto: 'https://example.com/arch-cover.jpg',
          bannerPhoto: 'https://example.com/arch-banner.jpg',
          thumbnailPhoto: 'https://example.com/arch-thumbnail.jpg',
          logoPhoto: 'https://example.com/arch-logo.jpg'
        }
      }
    ];

    for (const facultyData of faculties) {
      const existing = await this.schoolModel.findOne({ 
        'name.en': facultyData.name.en 
      });
      
      if (!existing) {
        this.logger.log(`Creating faculty: ${facultyData.name.en}`);
        await this.schoolModel.create({
          ...facultyData,
          createdAt: new Date()
        });
      } else {
        this.logger.log(`Faculty already exists: ${facultyData.name.en}`);
      }
    }

    this.logger.log('Default faculties check completed');
  }
} 