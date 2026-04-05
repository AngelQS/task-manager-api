import { IsNumber, IsNotEmpty } from "class-validator";

export class FindTaskByIdDto {
    @IsNumber()
    @IsNotEmpty()
    id: number;
}