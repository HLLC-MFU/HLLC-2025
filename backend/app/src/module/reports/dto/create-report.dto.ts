import { IsNotEmpty, IsMongoId, IsString } from "class-validator";

export class CreateReportDto {
@IsMongoId()
@IsNotEmpty()
reporter_id: string;

@IsMongoId()
@IsNotEmpty()
caragory_id: string;

@IsString()
@IsNotEmpty()
massage: string;

@IsString()
@IsNotEmpty()
status: string;
}

