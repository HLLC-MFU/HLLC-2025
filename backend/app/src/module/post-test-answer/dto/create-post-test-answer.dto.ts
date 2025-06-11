import { IsMongoId, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreatePostTestAnswerDto {
    @IsMongoId()
    @IsNotEmpty()
    user: string;  

    @ValidateNested({ each: true })
    @Type(() => Answer)
    values: Answer[];
}

class Answer {
    @IsMongoId()
    @IsNotEmpty()
    posttest: string;   

    @IsString()
    @IsNotEmpty()
    value: string;
}

