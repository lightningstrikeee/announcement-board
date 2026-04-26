import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @Column({ type: 'varchar', length: 120 })
  display_name!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 120 })
  surname!: string;

  @Column({ type: 'varchar', length: 120 })
  department!: string;

  @Column({ type: 'varchar', length: 120 })
  position!: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role!: 'user' | 'admin';
}
