import prisma from '../config/database';
import { AppError, CreateEventDto, UpdateEventDto, EventFilters } from '../types';
import { auditService } from './audit.service';
import { sseManager } from '../utils/sseManager';

export const eventService = {
  async list(filters: EventFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(filters.year !== undefined && { year: filters.year }),
      ...(filters.weekCode && { weekCode: filters.weekCode }),
      ...(filters.locationCode && { locationCode: filters.locationCode }),
      ...(filters.mainGroup && { mainGroup: filters.mainGroup }),
      ...(filters.category && { category: filters.category }),
      ...(filters.status && { status: filters.status }),
      ...(filters.classification && { classification: filters.classification }),
      ...(filters.eventType && { eventType: filters.eventType }),
      ...(filters.search && {
        OR: [
          { description: { contains: filters.search } },
          { systemComponent: { contains: filters.search } },
          { resolution: { contains: filters.search } },
        ],
      }),
    };

    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { weekCode: 'desc' }, { createdAt: 'desc' }],
        include: {
          location: { select: { code: true, fullName: true } },
        },
      }),
    ]);

    return { events, pagination: { page, limit, total } };
  },

  async getById(id: string) {
    const event = await prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: { location: { select: { code: true, fullName: true } } },
    });
    if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
    return event;
  },

  async create(data: CreateEventDto, userId: string) {
    // Validate week reference exists
    const weekRef = await prisma.weekReference.findUnique({
      where: { year_weekCode: { year: data.year, weekCode: data.weekCode } },
    });
    if (!weekRef) {
      throw new AppError(400, 'INVALID_WEEK', `Week ${data.weekCode}/${data.year} not found in reference table`);
    }

    // Validate location exists and is active
    const location = await prisma.locationMaster.findFirst({
      where: { code: data.locationCode, isActive: true },
    });
    if (!location) {
      throw new AppError(400, 'INVALID_LOCATION', `Location "${data.locationCode}" not found`);
    }

    const event = await prisma.event.create({
      data: {
        year: data.year,
        weekCode: data.weekCode,
        date: new Date(data.date),
        locationCode: data.locationCode,
        mainGroup: data.mainGroup,
        category: data.category,
        systemComponent: data.systemComponent,
        description: data.description,
        impact: data.impact,
        rootCause: data.rootCause,
        resolution: data.resolution,
        downtimeMinutes: data.downtimeMinutes,
        classification: data.classification,
        eventType: data.eventType ?? 'Incident',
        impactScope: data.impactScope ?? 'Site',
        severity: data.severity ?? 'Medium',
        status: data.status ?? 'Open',
        createdBy: userId,
      },
    });

    await auditService.log({ userId, action: 'create', entityType: 'event', entityId: event.id, newValues: event });
    sseManager.broadcast('created', event.id, userId);
    return event;
  },

  async update(id: string, data: UpdateEventDto, userId: string) {
    const { version, date: dateStr, ...fields } = data;

    // OCC check: only update if version matches — prevents lost updates
    const result = await prisma.event.updateMany({
      where: { id, version, deletedAt: null },
      data: {
        ...(fields.year !== undefined && { year: fields.year }),
        ...(fields.weekCode !== undefined && { weekCode: fields.weekCode }),
        ...(dateStr !== undefined && { date: new Date(dateStr) }),
        ...(fields.locationCode !== undefined && { locationCode: fields.locationCode }),
        ...(fields.mainGroup !== undefined && { mainGroup: fields.mainGroup }),
        ...(fields.category !== undefined && { category: fields.category }),
        ...(fields.systemComponent !== undefined && { systemComponent: fields.systemComponent }),
        ...(fields.description !== undefined && { description: fields.description }),
        ...(fields.impact !== undefined && { impact: fields.impact }),
        ...(fields.rootCause !== undefined && { rootCause: fields.rootCause }),
        ...(fields.resolution !== undefined && { resolution: fields.resolution }),
        ...(fields.downtimeMinutes !== undefined && { downtimeMinutes: fields.downtimeMinutes }),
        ...(fields.classification !== undefined && { classification: fields.classification }),
        ...(fields.eventType !== undefined && { eventType: fields.eventType }),
        ...(fields.impactScope !== undefined && { impactScope: fields.impactScope }),
        ...(fields.severity !== undefined && { severity: fields.severity }),
        ...(fields.status !== undefined && { status: fields.status }),
        version: { increment: 1 }, // Increment atomically on success
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      // Distinguish "not found" from "version conflict"
      const exists = await prisma.event.findFirst({ where: { id, deletedAt: null } });
      if (!exists) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
      throw new AppError(
        409,
        'EVENT_CONFLICT',
        'This event was modified by another user. Please reload and try again.',
      );
    }

    const updated = await prisma.event.findFirst({ where: { id } });
    await auditService.log({ userId, action: 'update', entityType: 'event', entityId: id, newValues: fields });
    sseManager.broadcast('updated', id, userId);
    return updated!;
  },

  async delete(id: string, userId: string) {
    const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });
    if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');

    // Soft delete — never hard delete events
    await prisma.event.update({ where: { id }, data: { deletedAt: new Date() } });

    await auditService.log({ userId, action: 'delete', entityType: 'event', entityId: id, oldValues: event });
    sseManager.broadcast('deleted', id, userId);
  },
};
