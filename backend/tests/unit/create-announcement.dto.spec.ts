import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAnnouncementDto } from '../../src/announcements/dto/create-announcement.dto';

describe('CreateAnnouncementDto validation', () => {
  it('rejects missing required fields', async () => {
    const dto = plainToInstance(CreateAnnouncementDto, {});

    const errors = await validate(dto);
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));

    expect(messages).toEqual(expect.arrayContaining(['title is required', 'body is required']));
  });

  it('rejects invalid pinned type', async () => {
    const dto = plainToInstance(CreateAnnouncementDto, {
      title: 'Hello',
      body: 'Body',
      pinned: 'yes',
    });

    const errors = await validate(dto);
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));

    expect(messages).toContain('pinned must be a boolean');
  });
});
