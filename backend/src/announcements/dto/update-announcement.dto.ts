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
  @IsString({ message: 'author must be a string' })
  @IsNotEmpty({ message: 'author cannot be empty' })
  author?: string;

  @IsOptional()
  @IsBoolean({ message: 'pinned must be a boolean' })
  pinned?: boolean;
}
