import 'reflect-metadata';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeleteResult, Repository } from 'typeorm';
import { Announcement } from '../../src/announcements/announcement.entity';
import { AnnouncementsService } from '../../src/announcements/announcements.service';

const mockUser = {
  sub: 'user-1',
  email: 'user@example.com',
  displayName: 'Jimmy',
  name: 'Jim',
  surname: 'Hendrix',
  role: 'user' as const,
};

type RepoMethods = {
  create: jest.Mock<Announcement, [Partial<Announcement>]>;
  save: jest.Mock<Promise<Announcement>, [Announcement]>;
  find: jest.Mock<Promise<Announcement[]>, [unknown?]>;
  findOne: jest.Mock<Promise<Announcement | null>, [unknown]>;
  merge: jest.Mock<Announcement, [Announcement, Partial<Announcement>]>;
  delete: jest.Mock<Promise<DeleteResult>, [string]>;
};

function createRepositoryStub(initialData: Announcement[] = []): RepoMethods {
  const data = [...initialData];
  let idCounter = data.length;

  const create = jest.fn((entityLike: Partial<Announcement>) => entityLike as Announcement);

  const save = jest.fn(async (entity: Announcement): Promise<Announcement> => {
    const existingIndex = data.findIndex((item) => item.id === entity.id);

    if (existingIndex >= 0) {
      data[existingIndex] = { ...data[existingIndex], ...entity };
      return data[existingIndex];
    }

    idCounter += 1;
    const toSave: Announcement = {
      ...entity,
      id: entity.id ?? `announcement-${idCounter}`,
      owner_id: entity.owner_id ?? null,
      created_at: entity.created_at ?? new Date(1700000000000 + idCounter * 1000),
      updated_at: entity.updated_at ?? new Date(1700000000000 + idCounter * 1000),
    };
    data.push(toSave);
    return toSave;
  });

  const find = jest.fn(async (_options?: unknown): Promise<Announcement[]> => {
    return [...data].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return Number(b.pinned) - Number(a.pinned);
      }
      return b.created_at.getTime() - a.created_at.getTime();
    });
  });

  const findOne = jest.fn(async (options: any): Promise<Announcement | null> => {
      const id = options.where && 'id' in options.where ? options.where.id : undefined;
      return data.find((item) => item.id === id) ?? null;
    });

  const merge = jest.fn((target: Announcement, source: Partial<Announcement>): Announcement => ({
    ...target,
    ...source,
  }));

  const remove = jest.fn(async (id: string): Promise<DeleteResult> => {
    const index = data.findIndex((item) => item.id === id);
    if (index >= 0) {
      data.splice(index, 1);
      return { raw: null, affected: 1 } as DeleteResult;
    }

    return { raw: null, affected: 0 } as DeleteResult;
  });

  return {
    create,
    save,
    find,
    findOne,
    merge,
    delete: remove,
  };
}

function createService(repo: RepoMethods): AnnouncementsService {
  return new AnnouncementsService(repo as unknown as Repository<Announcement>);
}

describe('AnnouncementsService', () => {
  it('creates successfully with pinned default false', async () => {
    const repo = createRepositoryStub();
    const service = createService(repo);

    const result = await service.create({
      title: 'Title',
      body: 'Body',
    }, mockUser);

    expect(result.id).toBeDefined();
    expect(result.pinned).toBe(false);
    expect(result.owner_id).toBe('user-1');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Title',
        body: 'Body',
        author: 'Jim Hendrix',
        owner_id: 'user-1',
        pinned: false,
      }),
    );
  });

  it('lists pinned announcements first and then newest by created_at', async () => {
    const repo = createRepositoryStub([
      {
        id: 'a',
        title: 'Normal New',
        body: 'Body',
        author: 'A',
        owner_id: null,
        pinned: false,
        created_at: new Date('2026-01-03T00:00:00.000Z'),
        updated_at: new Date('2026-01-03T00:00:00.000Z'),
      },
      {
        id: 'b',
        title: 'Pinned Old',
        body: 'Body',
        author: 'B',
        owner_id: null,
        pinned: true,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'c',
        title: 'Pinned New',
        body: 'Body',
        author: 'C',
        owner_id: null,
        pinned: true,
        created_at: new Date('2026-01-04T00:00:00.000Z'),
        updated_at: new Date('2026-01-04T00:00:00.000Z'),
      },
    ]);
    const service = createService(repo);

    const result = await service.findAll();

    expect(result.map((item) => item.id)).toEqual(['c', 'b', 'a']);
    expect(repo.find).toHaveBeenCalledWith({
      order: {
        pinned: 'DESC',
        created_at: 'DESC',
      },
    });
  });

  it('gets by id successfully', async () => {
    const repo = createRepositoryStub([
      {
        id: 'x1',
        title: 'Hello',
        body: 'World',
        author: 'Jimmy',
        owner_id: null,
        pinned: false,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    const service = createService(repo);

    const result = await service.findOne('x1');

    expect(result.title).toBe('Hello');
  });

  it('throws not found when getting by unknown id', async () => {
    const repo = createRepositoryStub();
    const service = createService(repo);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('updates successfully', async () => {
    const repo = createRepositoryStub([
      {
        id: 'x2',
        title: 'Old',
        body: 'Body',
        author: 'Jimmy',
        owner_id: 'user-1',
        pinned: false,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    const service = createService(repo);

    const result = await service.update('x2', { title: 'New title' }, 'user-1');

    expect(result.title).toBe('New title');
    expect(repo.merge).toHaveBeenCalled();
  });

  it('update affects ordering when pinned changes to true', async () => {
    const repo = createRepositoryStub([
      {
        id: 'unpinned',
        title: 'Unpinned',
        body: 'Body',
        author: 'A',
        owner_id: 'user-1',
        pinned: false,
        created_at: new Date('2026-01-05T00:00:00.000Z'),
        updated_at: new Date('2026-01-05T00:00:00.000Z'),
      },
      {
        id: 'other',
        title: 'Other',
        body: 'Body',
        author: 'B',
        owner_id: 'user-1',
        pinned: false,
        created_at: new Date('2026-01-04T00:00:00.000Z'),
        updated_at: new Date('2026-01-04T00:00:00.000Z'),
      },
    ]);
    const service = createService(repo);

    await service.update('other', { pinned: true }, 'user-1');
    const result = await service.findAll();

    expect(result[0].id).toBe('other');
    expect(result[0].pinned).toBe(true);
  });

  it('deletes successfully', async () => {
    const repo = createRepositoryStub([
      {
        id: 'x3',
        title: 'Delete me',
        body: 'Body',
        author: 'Jimmy',
        owner_id: 'user-1',
        pinned: false,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    const service = createService(repo);

    await expect(service.remove('x3', 'user-1')).resolves.toBeUndefined();
    await expect(service.findOne('x3')).rejects.toThrow(NotFoundException);
  });

  it('throws not found when deleting unknown id', async () => {
    const repo = createRepositoryStub();
    const service = createService(repo);

    await expect(service.remove('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws forbidden when non-owner tries to update', async () => {
    const repo = createRepositoryStub([
      {
        id: 'x4',
        title: 'Owned by someone else',
        body: 'Body',
        author: 'Other',
        owner_id: 'other-user',
        pinned: false,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    const service = createService(repo);

    await expect(service.update('x4', { title: 'Nope' }, 'user-1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
