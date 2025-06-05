import { IsString } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class CreateEvoucherTypeDto {

    @IsString()
    @IsNotEmpty()
    name: string;

}
