import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Major, MajorDocument } from './schemas/major.schema';
import { School, SchoolDocument } from '../schools/schemas/school.schema';

@Injectable()
export class MajorInitializerService implements OnModuleInit {
  private readonly logger = new Logger(MajorInitializerService.name);

  constructor(
    @InjectModel(Major.name) private readonly majorModel: Model<MajorDocument>,
    @InjectModel(School.name) private readonly schoolModel: Model<SchoolDocument>
  ) {}

  async onModuleInit() {
    await this.createDefaultMajors();
  }

  private async createDefaultMajors() {
    this.logger.log('Checking for default majors/departments...');
    
    // First, get faculty IDs
    const faculties = await this.schoolModel.find().lean();
    if (!faculties || faculties.length === 0) {
      this.logger.warn('No faculties found. Cannot create majors/departments.');
      return;
    }

    const facultyMap = new Map<string, Types.ObjectId>();
    faculties.forEach(faculty => {
      if (faculty._id) {
        facultyMap.set(faculty.name.en, faculty._id as Types.ObjectId);
      }
    });

    // Only try to create majors if we found faculties
    if (facultyMap.size === 0) {
      this.logger.warn('No faculties found. Skipping major creation.');
      return;
    }

    const majorsByFaculty = {
      'Faculty of Engineering': [
        {
          name: { th: 'วิศวกรรมซอฟต์แวร์', en: 'Software Engineering' },
          acronym: { th: 'วซ.', en: 'SE' },
          detail: { 
            th: 'สาขาที่เน้นการออกแบบและพัฒนาซอฟต์แวร์ที่มีคุณภาพสูง', 
            en: 'Department focused on design and development of high-quality software' 
          }
        },
        {
          name: { th: 'วิศวกรรมคอมพิวเตอร์', en: 'Computer Engineering' },
          acronym: { th: 'วค.', en: 'CPE' },
          detail: { 
            th: 'สาขาที่ผสมผสานความรู้ด้านวิศวกรรมไฟฟ้าและวิทยาการคอมพิวเตอร์', 
            en: 'Department that combines electrical engineering and computer science' 
          }
        },
        {
          name: { th: 'วิศวกรรมไฟฟ้า', en: 'Electrical Engineering' },
          acronym: { th: 'วฟ.', en: 'EE' },
          detail: { 
            th: 'สาขาที่ศึกษาเกี่ยวกับไฟฟ้า อิเล็กทรอนิกส์ และการสื่อสาร', 
            en: 'Department that studies electricity, electronics, and communications' 
          }
        }
      ],
      'Faculty of Information Technology': [
        {
          name: { th: 'วิทยาการคอมพิวเตอร์', en: 'Computer Science' },
          acronym: { th: 'วท.คอม', en: 'CS' },
          detail: { 
            th: 'สาขาที่เน้นทฤษฎีและการประยุกต์ใช้คอมพิวเตอร์', 
            en: 'Department focused on theory and application of computers' 
          }
        },
        {
          name: { th: 'เทคโนโลยีสารสนเทศ', en: 'Information Technology' },
          acronym: { th: 'ทส.', en: 'IT' },
          detail: { 
            th: 'สาขาที่เน้นการจัดการและประยุกต์ใช้เทคโนโลยีสารสนเทศในองค์กร', 
            en: 'Department focused on management and application of IT in organizations' 
          }
        },
        {
          name: { th: 'ความมั่นคงปลอดภัยไซเบอร์', en: 'Cybersecurity' },
          acronym: { th: 'คมป.', en: 'CYBER' },
          detail: { 
            th: 'สาขาที่เน้นการป้องกันและรักษาความปลอดภัยของระบบคอมพิวเตอร์', 
            en: 'Department focused on protection and security of computer systems' 
          }
        }
      ],
      'Faculty of Science': [
        {
          name: { th: 'วิทยาศาสตร์ข้อมูล', en: 'Data Science' },
          acronym: { th: 'วข.', en: 'DS' },
          detail: { 
            th: 'สาขาที่ศึกษาเกี่ยวกับการวิเคราะห์ข้อมูลขนาดใหญ่และการเรียนรู้ของเครื่อง', 
            en: 'Department studying big data analytics and machine learning' 
          }
        },
        {
          name: { th: 'คณิตศาสตร์', en: 'Mathematics' },
          acronym: { th: 'คณ.', en: 'MATH' },
          detail: { 
            th: 'สาขาที่ศึกษาเกี่ยวกับคณิตศาสตร์และการประยุกต์ใช้', 
            en: 'Department studying mathematics and its applications' 
          }
        }
      ],
      'Faculty of Business Administration': [
        {
          name: { th: 'การจัดการเทคโนโลยีสารสนเทศ', en: 'IT Management' },
          acronym: { th: 'จท.', en: 'ITM' },
          detail: { 
            th: 'สาขาที่เน้นการบริหารจัดการระบบเทคโนโลยีสารสนเทศในองค์กร', 
            en: 'Department focused on management of IT systems in organizations' 
          }
        },
        {
          name: { th: 'การพาณิชย์อิเล็กทรอนิกส์', en: 'E-Commerce' },
          acronym: { th: 'พอ.', en: 'EC' },
          detail: { 
            th: 'สาขาที่ศึกษาเกี่ยวกับการทำธุรกิจออนไลน์และพาณิชย์อิเล็กทรอนิกส์', 
            en: 'Department studying online business and e-commerce' 
          }
        }
      ],
      'Faculty of Architecture': [
        {
          name: { th: 'การออกแบบภายใน', en: 'Interior Design' },
          acronym: { th: 'อภ.', en: 'ID' },
          detail: { 
            th: 'สาขาที่เน้นการออกแบบและตกแต่งภายในอาคาร', 
            en: 'Department focused on interior design and decoration' 
          }
        },
        {
          name: { th: 'สถาปัตยกรรมศาสตร์', en: 'Architecture' },
          acronym: { th: 'สถ.', en: 'ARCH' },
          detail: { 
            th: 'สาขาที่เน้นการออกแบบอาคารและสิ่งปลูกสร้าง', 
            en: 'Department focused on building and structure design' 
          }
        }
      ]
    };

    // Create majors for each faculty
    for (const [facultyName, majors] of Object.entries(majorsByFaculty)) {
      const facultyId = facultyMap.get(facultyName);
      
      if (!facultyId) {
        this.logger.warn(`Faculty "${facultyName}" not found. Skipping majors.`);
        continue;
      }

      for (const majorData of majors) {
        // Check if major already exists
        const existing = await this.majorModel.findOne({
          'name.en': majorData.name.en,
          school: facultyId
        });

        if (!existing) {
          this.logger.log(`Creating major: ${majorData.name.en} for ${facultyName}`);
          await this.majorModel.create({
            ...majorData,
            school: facultyId,
            createdAt: new Date()
          });
        } else {
          this.logger.log(`Major already exists: ${majorData.name.en} for ${facultyName}`);
        }
      }
    }

    this.logger.log('Default majors/departments check completed');
  }
} 