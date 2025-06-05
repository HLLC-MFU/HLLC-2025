import { IsNotEmpty, IsString } from "class-validator";

export class CreateSponsorsTypeDto {

    @IsString()
    @IsNotEmpty()
    name: string;   
}
