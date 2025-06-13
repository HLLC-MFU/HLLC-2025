import { IsMongoId, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreatePosttestAnswerDto {
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
    posttest: string;   

    @IsString()
    @IsNotEmpty()
    answer: string;
}

