import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsString } from "class-validator";
import { PretestType } from "../enum/PretestType.enum";
import { Localization } from "src/pkg/types/common";

export class CreatePreTestDto {

    @IsEnum(PretestType)
    @IsNotEmpty()
    type: PretestType

    @IsObject()
    @IsNotEmpty()
    question: Localization

    @IsNumber()
    @IsNotEmpty()
    order: number
    
}
