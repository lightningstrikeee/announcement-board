import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(6, { message: 'password must be at least 6 characters' })
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one number' })
  password!: string;

  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name!: string;

  @IsString({ message: 'surname must be a string' })
  @IsNotEmpty({ message: 'surname is required' })
  surname!: string;

  @IsString({ message: 'department must be a string' })
  @IsNotEmpty({ message: 'department is required' })
  department!: string;

  @IsString({ message: 'position must be a string' })
  @IsNotEmpty({ message: 'position is required' })
  position!: string;
}
