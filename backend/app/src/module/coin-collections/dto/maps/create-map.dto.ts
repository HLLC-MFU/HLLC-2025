import { IsNotEmpty } from "class-validator";

export class CreateMapDto {
    @IsNotEmpty()
    map: string;
}
