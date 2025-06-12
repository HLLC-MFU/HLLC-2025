import { Type } from "class-transformer";
import { IsMongoId, IsNotEmpty, IsString, ValidateNested } from "class-validator";


export class CreatePreTestAnswerDto {

    @IsMongoId()
    @IsNotEmpty()
    user: string;

    @ValidateNested({ each: true })
    @Type(() => Answer)
    values: Answer[];
    
}

class Answer{
    @IsMongoId()
    @IsNotEmpty()
    pretest: string;

    @IsString()
    @IsNotEmpty()
    value: string;
}
