import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title!: string;

  @IsString({ message: 'body must be a string' })
  @IsNotEmpty({ message: 'body is required' })
  body!: string;

  @IsOptional()
  @IsBoolean({ message: 'pinned must be a boolean' })
  pinned?: boolean;
}