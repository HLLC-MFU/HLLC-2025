import { IsNotEmpty, IsString } from "class-validator";

export class CreateActivitiesTypeDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}
