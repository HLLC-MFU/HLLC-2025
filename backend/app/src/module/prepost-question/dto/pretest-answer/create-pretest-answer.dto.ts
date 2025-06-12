import { Type } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsString, ValidateNested } from "class-validator";

export class CreatePretestAnswerDto {

    @IsMongoId()
    @IsNotEmpty()
    user: string;

    @ValidateNested({ each: true })
    @Type(() => Answer)
    answers: Answer[];

}

class Answer {
    @IsMongoId()
    @IsNotEmpty()
    question:string;

    @IsString()
    @IsNotEmpty()
    answer: string;
}
