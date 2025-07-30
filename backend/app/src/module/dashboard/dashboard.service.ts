import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activities } from '../activities/schemas/activities.schema';
import { Checkin } from '../checkin/schema/checkin.schema';
import { Assessment } from '../assessments/schema/assessment.schema';
import { AssessmentAnswer } from '../assessments/schema/assessment-answer.schema';
import { User } from '../users/schemas/user.schema';
import { PretestAnswer } from '../prepost-questions/schema/pretest-answer.schema';
import { PrepostQuestion } from '../prepost-questions/schema/prepost-question.schema';
import { PosttestAnswer } from '../prepost-questions/schema/posttest-answer.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Activities.name) private activitiesModel: Model<Activities>,
    @InjectModel(Checkin.name) private checkinModel: Model<Checkin>,
    @InjectModel(Assessment.name) private assessmentModel: Model<Assessment>,
    @InjectModel(AssessmentAnswer.name) private assessmentAnswerModel: Model<AssessmentAnswer>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(PretestAnswer.name) private pretestAnswersModel: Model<PretestAnswer>,
    @InjectModel(PosttestAnswer.name) private posttestAnswersModel: Model<PosttestAnswer>,
    @InjectModel(PrepostQuestion.name) private prepostQuestionModel: Model<PrepostQuestion>,
  ) { }

  async getActivitiesDashboard() {
    const TARGET_ROLE_ID = new Types.ObjectId('6879046e68c81ea1923a5048');

    // Step 1: Find user IDs with target role (single aggregation stage)
    const result = await this.userModel.aggregate([
      { $match: { role: TARGET_ROLE_ID } },
      {
        $group: {
          _id: null,
          userIds: { $addToSet: '$_id' },
        },
      },

      // Step 2: Lookup all activities (only _id and name)
      {
        $lookup: {
          from: 'activities',
          pipeline: [{ $project: { _id: 1, name: 1, acronym: 1 } }],
          as: 'activities',
        },
      },

      // Step 3: Lookup check-ins by these userIds, grouped by activity
      {
        $lookup: {
          from: 'checkins',
          let: { userIds: '$userIds' },
          pipeline: [
            { $match: { $expr: { $in: ['$user', '$$userIds'] } } },
            { $group: { _id: '$activity', checkin: { $sum: 1 } } },
          ],
          as: 'checkins',
        },
      },

      // Step 4: Group assessments by activity
      {
        $lookup: {
          from: 'assessments',
          pipeline: [
            { $match: { activity: { $ne: null } } },
            {
              $group: {
                _id: '$activity',
                assessments: {
                  $push: { _id: '$_id', name: '$question' },
                },
              },
            },
          ],
          as: 'assessmentsByActivity',
        },
      },

      // Step 5: Aggregate assessment answers from targeted users
      {
        $lookup: {
          from: 'assessment-answers',
          let: { userIds: '$userIds' },
          pipeline: [
            { $match: { $expr: { $in: ['$user', '$$userIds'] } } },
            { $unwind: '$answers' },
            {
              $lookup: {
                from: 'assessments',
                localField: 'answers.assessment',
                foreignField: '_id',
                as: 'assessmentInfo',
              },
            },
            { $unwind: '$assessmentInfo' },
            {
              $group: {
                _id: '$answers.assessment',
                type: { $first: '$assessmentInfo.type' },
                count: { $sum: 1 },
                averageAnswer: {
                  $avg: {
                    $cond: [
                      { $eq: ['$assessmentInfo.type', 'rating'] },
                      {
                        $convert: {
                          input: '$answers.answer',
                          to: 'double',
                          onError: null,
                          onNull: null,
                        },
                      },
                      null,
                    ],
                  },
                },
              },
            },
          ],
          as: 'assessmentAverages',
        },
      },

      // Step 6: Build dashboard array by mapping activities, enriching with checkin and assessments + averages
      {
        $project: {
          _id: 0,
          dashboard: {
            $map: {
              input: '$activities',
              as: 'activity',
              in: {
                activityId: '$$activity._id',
                name: '$$activity.name',
                acronym: '$$activity.acronym',

                // Find checkin count for this activity
                checkin: {
                  $let: {
                    vars: {
                      matchedCheckin: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$checkins',
                              as: 'checkin',
                              cond: { $eq: ['$$checkin._id', '$$activity._id'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ['$$matchedCheckin.checkin', 0] },
                  },
                },

                // Build assessments array for this activity with averageAnswer and count
                assessments: {
                  $let: {
                    vars: {
                      matchedAssessments: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$assessmentsByActivity',
                              as: 'assessGroup',
                              cond: { $eq: ['$$assessGroup._id', '$$activity._id'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      $map: {
                        input: {
                          $filter: {
                            input: { $ifNull: ['$$matchedAssessments.assessments', []] },
                            as: 'assessment',
                            cond: {
                              $in: [
                                '$$assessment._id',
                                {
                                  $map: {
                                    input: '$assessmentAverages',
                                    as: 'avg',
                                    in: '$$avg._id',
                                  },
                                },
                              ],
                            },
                          },
                        },
                        as: 'assessment',
                        in: {
                          _id: '$$assessment._id',
                          name: '$$assessment.name',
                          averageAnswer: {
                            $let: {
                              vars: {
                                avgData: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: '$assessmentAverages',
                                        as: 'avg',
                                        cond: { $eq: ['$$avg._id', '$$assessment._id'] },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: '$$avgData.averageAnswer',
                            },
                          },
                          count: {
                            $let: {
                              vars: {
                                avgData: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: '$assessmentAverages',
                                        as: 'avg',
                                        cond: { $eq: ['$$avg._id', '$$assessment._id'] },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: '$$avgData.count',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // Step 7: Sort dashboard by checkin descending
      { $unwind: '$dashboard' },
      { $sort: { 'dashboard.checkin': -1 } },
      {
        $group: {
          _id: null,
          dashboard: { $push: '$dashboard' },
        },
      },
      { $project: { _id: 0, dashboard: 1 } },
    ]).exec();

    return result[0]; // has { dashboard: [...] }
  }

}
