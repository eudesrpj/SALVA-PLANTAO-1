import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseStorage } from '../storage';
import { db } from '../db';
import { shifts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { startOfDay, addDays } from 'date-fns';

describe('Shifts Service', () => {
  const storage = new DatabaseStorage();
  const testUserId = 'test-user-shifts';

  beforeEach(async () => {
    // Clean up test data
    await db.delete(shifts).where(eq(shifts.userId, testUserId));
  });

  it('should create and retrieve shift without timezone issues', async () => {
    const shiftDate = startOfDay(new Date());
    
    const created = await storage.createShift({
      userId: testUserId,
      date: shiftDate,
      location: 'UPA Central',
      type: '12h Diurno',
      startTime: '07:00',
      endTime: '19:00',
      value: '500.00',
    });

    expect(created).toBeDefined();
    expect(created.id).toBeTypeOf('number');
    expect(created.location).toBe('UPA Central');

    const retrieved = await storage.getShift(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.date.toISOString()).toBe(shiftDate.toISOString());
  });

  it('should list shifts for user', async () => {
    const date1 = startOfDay(new Date());
    const date2 = startOfDay(addDays(new Date(), 1));

    await storage.createShift({
      userId: testUserId,
      date: date1,
      location: 'UPA 1',
      type: '12h Diurno',
      startTime: '07:00',
      endTime: '19:00',
    });

    await storage.createShift({
      userId: testUserId,
      date: date2,
      location: 'UPA 2',
      type: '12h Noturno',
      startTime: '19:00',
      endTime: '07:00',
    });

    const list = await storage.getShifts(testUserId);
    expect(list).toHaveLength(2);
    expect(list[0].location).toBe('UPA 2'); // Ordered by date desc
    expect(list[1].location).toBe('UPA 1');
  });

  it('should update shift with updatedAt timestamp', async () => {
    const created = await storage.createShift({
      userId: testUserId,
      date: startOfDay(new Date()),
      location: 'Original',
      type: '12h Diurno',
      startTime: '07:00',
      endTime: '19:00',
    });

    const originalUpdatedAt = created.updatedAt;

    // Wait a bit to ensure updatedAt changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const updated = await storage.updateShift(created.id, {
      location: 'Updated',
      value: '600.00',
    });

    expect(updated.location).toBe('Updated');
    expect(updated.value).toBe('600.00');
    expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime());
  });

  it('should delete shift', async () => {
    const created = await storage.createShift({
      userId: testUserId,
      date: startOfDay(new Date()),
      location: 'To Delete',
      type: '12h Diurno',
      startTime: '07:00',
      endTime: '19:00',
    });

    await storage.deleteShift(created.id);

    const retrieved = await storage.getShift(created.id);
    expect(retrieved).toBeUndefined();
  });

  it('should get next upcoming shift correctly', async () => {
    const yesterday = startOfDay(addDays(new Date(), -1));
    const tomorrow = startOfDay(addDays(new Date(), 1));

    await storage.createShift({
      userId: testUserId,
      date: yesterday,
      location: 'Past Shift',
      type: '12h Diurno',
      startTime: '07:00',
      endTime: '19:00',
    });

    const futureShift = await storage.createShift({
      userId: testUserId,
      date: tomorrow,
      location: 'Future Shift',
      type: '12h Diurno',
      startTime: '07:00',
      endTime: '19:00',
    });

    const nextShift = await storage.getNextShift(testUserId);
    expect(nextShift).toBeDefined();
    expect(nextShift?.location).toBe('Future Shift');
  });

  it('should calculate shift stats correctly', async () => {
    await storage.createShift({
      userId: testUserId,
      date: startOfDay(addDays(new Date(), 1)),
      location: 'UPA 1',
      type: '12h Diurno',
      startTime: '07:00',
      endTime: '19:00',
      value: '500.00',
    });

    await storage.createShift({
      userId: testUserId,
      date: startOfDay(addDays(new Date(), 2)),
      location: 'UPA 2',
      type: '24h',
      startTime: '07:00',
      endTime: '07:00',
      value: '800.00',
    });

    const stats = await storage.getShiftStats(testUserId);
    expect(stats.totalEarnings).toBe(1300);
    expect(stats.totalHours).toBe(36); // 12 + 24
    expect(stats.upcomingShifts).toHaveLength(2);
  });
});
