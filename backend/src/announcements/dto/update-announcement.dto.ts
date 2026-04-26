import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title cannot be empty' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'body must be a string' })
  @IsNotEmpty({ message: 'body cannot be empty' })
  body?: string;

  @IsOptional()
  @IsBoolean({ message: 'pinned must be a boolean' })
  pinned?: boolean;
}