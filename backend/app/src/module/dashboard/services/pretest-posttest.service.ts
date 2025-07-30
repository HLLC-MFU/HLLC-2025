import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { PosttestAnswer } from "src/module/prepost-questions/schema/posttest-answer.schema";
import { PrepostQuestion } from "src/module/prepost-questions/schema/prepost-question.schema";
import { PretestAnswer } from "src/module/prepost-questions/schema/pretest-answer.schema";
import { User } from "src/module/users/schemas/user.schema";

@Injectable()
export class PretestPosttestDashboardService {
    constructor(
          @InjectModel(User.name) private userModel: Model<User>,
          @InjectModel(PretestAnswer.name) private pretestAnswersModel: Model<PretestAnswer>,
          @InjectModel(PosttestAnswer.name) private posttestAnswersModel: Model<PosttestAnswer>,
          @InjectModel(PrepostQuestion.name) private prepostQuestionModel: Model<PrepostQuestion>,
      ) { }

      async getPretestDashboard() {
        const TARGET_ROLE_ID = new Types.ObjectId('6879046e68c81ea1923a5048');
    
        // 1. Get all user IDs with this role
        const users = await this.userModel
          .find({ role: TARGET_ROLE_ID })
          .select('_id name')
          .lean();
    
        const userIds = users.map(user => user._id);
    
        // 2. Fetch all user answers
        const rawAnswers = await this.pretestAnswersModel
          .find({ user: { $in: userIds } })
          .lean();
    
        // 3. Build user answers list
        const answers = rawAnswers.map(entry => {
          const userInfo = users.find(u => u._id.toString() === entry.user.toString());
          return {
            userId: entry.user,
            name: userInfo?.name || {},
            answers: entry.answers,
          };
        });
    
        // 4. Flatten all answers across all users
        const allAnswersFlat = rawAnswers.flatMap(entry =>
          entry.answers.map(ans => ({
            questionId: ans.pretest.toString(),
            answer: parseFloat(ans.answer),
          }))
        ).filter(a => !isNaN(a.answer));
    
        // 5. Group and average by question
        const averageMap = allAnswersFlat.reduce<Record<string, { total: number; count: number }>>((acc, curr) => {
          if (!acc[curr.questionId]) {
            acc[curr.questionId] = { total: 0, count: 0 };
          }
          acc[curr.questionId].total += curr.answer;
          acc[curr.questionId].count += 1;
          return acc;
        }, {});
    
        const questionsDetails = await this.prepostQuestionModel
          .find({ _id: { $in: Object.keys(averageMap) } })
          .select('_id question')
          .lean();
        const average = Object.entries(averageMap).map(([questionId, { total, count }]) => {
          const question = questionsDetails.find(q => q._id.toString() === questionId);
          return {
            questionId,
            average: parseFloat((total / count).toFixed(2)),
            question: question?.question || null,
          };
        });
    
        return {
          answers,
          average,
          totalAnswers: answers.length,
        };
      }
    
      async getPosttestDashboard() {
        const TARGET_ROLE_ID = new Types.ObjectId('6879046e68c81ea1923a5048');
    
        // 1. Get all user IDs with this role
        const users = await this.userModel
          .find({ role: TARGET_ROLE_ID })
          .select('_id name')
          .lean();
    
        const userIds = users.map(user => user._id);
    
        // 2. Fetch all user answers
        const rawAnswers = await this.posttestAnswersModel
          .find({ user: { $in: userIds } })
          .lean();
    
        // 3. Build user answers list
        const answers = rawAnswers.map(entry => {
          const userInfo = users.find(u => u._id.toString() === entry.user.toString());
          return {
            userId: entry.user,
            name: userInfo?.name || {},
            answers: entry.answers,
          };
        });
    
        // 4. Flatten all answers across all users
        const allAnswersFlat = rawAnswers.flatMap(entry =>
          entry.answers.map(ans => ({
            questionId: ans.posttest.toString(),
            answer: parseFloat(ans.answer),
          }))
        ).filter(a => !isNaN(a.answer));
    
        // 5. Group and average by question
        const averageMap = allAnswersFlat.reduce<Record<string, { total: number; count: number }>>((acc, curr) => {
          if (!acc[curr.questionId]) {
            acc[curr.questionId] = { total: 0, count: 0 };
          }
          acc[curr.questionId].total += curr.answer;
          acc[curr.questionId].count += 1;
          return acc;
        }, {});
    
        const questionsDetails = await this.prepostQuestionModel
          .find({ _id: { $in: Object.keys(averageMap) } })
          .select('_id question')
          .lean();
        const average = Object.entries(averageMap).map(([questionId, { total, count }]) => {
          const question = questionsDetails.find(q => q._id.toString() === questionId);
          return {
            questionId,
            average: parseFloat((total / count).toFixed(2)),
            question: question?.question || null,
          };
        });
    
        return {
          answers,
          average,
          totalAnswers: answers.length,
        };
      }
    
}