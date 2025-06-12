import { Type } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsString, ValidateNested } from "class-validator";


export class CreatePreTestAnswerDto {

    @IsMongoId()
    @IsNotEmpty()
    user: string;

    @ValidateNested({ each: true })
    @Type(() => Answer)
    answers: Answer[];
    
}

class Answer{
    @IsMongoId()
    @IsNotEmpty()
    pretest: string;

    @IsString()
    @IsNotEmpty()
    answer: string;
}
