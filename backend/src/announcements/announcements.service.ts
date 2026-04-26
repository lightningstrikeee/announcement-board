import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtUserPayload } from '../auth/auth.types';

@Injectable()
export class AnnouncementsService implements OnModuleInit {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementsRepository: Repository<Announcement>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialAnnouncements();
  }

  private async seedInitialAnnouncements(): Promise<void> {
    const existingCount = await this.announcementsRepository.count();

    if (existingCount > 0) {
      return;
    }

    const seedData: Array<Pick<Announcement, 'title' | 'body' | 'author' | 'pinned'>> = [
      {
        title: 'Platform Maintenance Window',
        body: 'Scheduled maintenance is planned for Sunday at 02:00 AM. Some services may be briefly unavailable.',
        author: 'Operations Team',
        pinned: true,
      },
      {
        title: 'Quarterly Goals Published',
        body: 'Q2 goals are now published in the strategy workspace. Please review and align your team plans.',
        author: 'Leadership Office',
        pinned: true,
      },
      {
        title: 'UI Polish Sprint',
        body: 'Frontend team will run a 3-day polish sprint focused on forms, spacing consistency, and feedback states.',
        author: 'Design System Team',
        pinned: false,
      },
      {
        title: 'Team Lunch Next Friday',
        body: 'Company lunch is booked for next Friday at 12:30 PM in the main hall. RSVP by Wednesday.',
        author: 'People Operations',
        pinned: false,
      },
    ];

    const seedAnnouncements = this.announcementsRepository.create(seedData);
    await this.announcementsRepository.save(seedAnnouncements);
  }

  async create(
    createAnnouncementDto: CreateAnnouncementDto,
    user: JwtUserPayload,
  ): Promise<Announcement> {
    const announcement = this.announcementsRepository.create({
      ...createAnnouncementDto,
      author: `${user.name} ${user.surname}`,
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