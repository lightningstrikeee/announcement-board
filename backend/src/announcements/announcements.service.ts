import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Announcement } from './announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtUserPayload } from '../auth/auth.types';

const DEMO_USER = {
  email: 'nuntapop.khe@gmail.com',
  password: 'Hello123',
  name: 'Nuntapop',
  surname: 'Kheawthanong',
  department: 'Engineering',
  position: 'Developer',
};

@Injectable()
export class AnnouncementsService implements OnModuleInit {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementsRepository: Repository<Announcement>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialData();
  }

  private async seedInitialData(): Promise<void> {
    const demoUser = await this.ensureDemoUser();
    const existingCount = await this.announcementsRepository.count();

    if (existingCount > 0) {
      return;
    }

    const seedData: Array<Pick<Announcement, 'title' | 'body' | 'author' | 'owner_id' | 'pinned'>> = [
      {
        title: 'Platform Maintenance Window',
        body: 'Scheduled maintenance is planned for Sunday at 02:00 AM. Some services may be briefly unavailable.',
        author: 'Operations Team',
        owner_id: null,
        pinned: true,
      },
      {
        title: 'Welcome to the Announcement Board',
        body: 'This announcement belongs to the seeded demo account, so you can log in, edit it, and test the delete flow.',
        author: `${DEMO_USER.name} ${DEMO_USER.surname}`,
        owner_id: demoUser.id,
        pinned: false,
      },
    ];

    const seedAnnouncements = this.announcementsRepository.create(seedData);
    await this.announcementsRepository.save(seedAnnouncements);
  }

  private async ensureDemoUser(): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: DEMO_USER.email },
    });

    if (existingUser) {
      return existingUser;
    }

    const displayName = `${DEMO_USER.name} ${DEMO_USER.surname}`;
    const user = this.usersRepository.create({
      email: DEMO_USER.email,
      password_hash: await hash(DEMO_USER.password, 10),
      display_name: displayName,
      name: DEMO_USER.name,
      surname: DEMO_USER.surname,
      department: DEMO_USER.department,
      position: DEMO_USER.position,
      role: 'user',
    });

    return this.usersRepository.save(user);
  }

  async create(
    createAnnouncementDto: CreateAnnouncementDto,
    user: JwtUserPayload,
  ): Promise<Announcement> {
    const announcement = this.announcementsRepository.create({
      ...createAnnouncementDto,
      author: createAnnouncementDto.author.trim(),
      owner_id: user.sub,
      pinned: createAnnouncementDto.pinned ?? false,
    });

    return this.announcementsRepository.save(announcement);
  }

  async findAll(): Promise<Announcement[]> {
    return this.announcementsRepository.find({
      order: {
        pinned: 'DESC',
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Announcement> {
    const announcement = await this.announcementsRepository.findOne({ where: { id } });

    if (!announcement) {
      throw new NotFoundException(`Announcement with id ${id} not found`);
    }

    return announcement;
  }

  async update(
    id: string,
    updateAnnouncementDto: UpdateAnnouncementDto,
    requesterUserId: string,
  ): Promise<Announcement> {
    const announcement = await this.findOne(id);
    this.assertOwner(announcement, requesterUserId);
    const updated = this.announcementsRepository.merge(announcement, updateAnnouncementDto);
    return this.announcementsRepository.save(updated);
  }

  async togglePin(id: string): Promise<Announcement> {
    const announcement = await this.findOne(id);
    announcement.pinned = !announcement.pinned;
    return this.announcementsRepository.save(announcement);
  }

  async remove(id: string, requesterUserId: string): Promise<void> {
    const announcement = await this.findOne(id);
    this.assertOwner(announcement, requesterUserId);

    const result = await this.announcementsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Announcement with id ${id} not found`);
    }
  }

  private assertOwner(announcement: Announcement, requesterUserId: string): void {
    if (announcement.owner_id !== requesterUserId) {
      throw new ForbiddenException('You can only modify your own announcement.');
    }
  }
}
