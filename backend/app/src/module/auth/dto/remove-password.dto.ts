import { IsNotEmpty, IsString } from "class-validator";

export class RemovePasswordDto {
    @IsString()
    @IsNotEmpty()
    username: string;
}