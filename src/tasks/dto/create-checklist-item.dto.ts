import { IsString, IsNotEmpty } from 'class-validator';

export class CreateChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
