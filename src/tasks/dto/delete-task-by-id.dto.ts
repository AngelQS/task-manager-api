import { IsNotEmpty, IsString } from "class-validator";

export class DeleteTaskByIdDto {
    @IsString()
    @IsNotEmpty()
    id: string;
}