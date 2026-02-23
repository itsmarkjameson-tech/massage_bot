import { Queue, QueueEvents, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';

/**
 * Імена черг для різних типів завдань
 */
export const QUEUE_NAMES = {
    NOTIFICATIONS: 'notifications',
    REMINDERS: 'reminders',
    REVIEWS: 'reviews',
    SCHEDULES: 'schedules',
} as const;

/**
 * Типи завдань в черзі
 */
export const JOB_TYPES = {
    SEND_NOTIFICATION: 'send-notification',
    REMINDER_24H: 'reminder-24h',
    REMINDER_2H: 'reminder-2h',
    REVIEW_REQUEST: 'review-request',
    DAILY_SCHEDULE: 'daily-schedule',
} as const;

/**
 * Пріоритети завдань (lower = higher priority)
 */
export const JOB_PRIORITIES = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
} as const;

/**
 * Отримати Redis з'єднання для BullMQ
 */
function getRedisConnection() {
    const redis = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });
    return redis as unknown as ConnectionOptions;
}

const redisConnection = getRedisConnection();

/**
 * Конфігурація черги сповіщень
 */
export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: {
            count: 100,
            age: 24 * 3600,
        },
        removeOnFail: {
            count: 500,
            age: 7 * 24 * 3600,
        },
    },
});

/**
 * Конфігурація черги нагадувань
 */
export const reminderQueue = new Queue(QUEUE_NAMES.REMINDERS, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: {
            count: 200,
            age: 24 * 3600,
        },
        removeOnFail: {
            count: 500,
            age: 7 * 24 * 3600,
        },
    },
});

/**
 * Конфігурація черги відгуків
 */
export const reviewQueue = new Queue(QUEUE_NAMES.REVIEWS, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 2000,
        },
        removeOnComplete: {
            count: 100,
            age: 7 * 24 * 3600,
        },
        removeOnFail: {
            count: 200,
            age: 30 * 24 * 3600,
        },
    },
});

/**
 * Конфігурація черги розкладів
 */
export const scheduleQueue = new Queue(QUEUE_NAMES.SCHEDULES, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 5000,
        },
        removeOnComplete: {
            count: 50,
            age: 24 * 3600,
        },
        removeOnFail: {
            count: 100,
            age: 30 * 24 * 3600,
        },
    },
});

/**
 * Події черг для логування
 */
export const notificationQueueEvents = new QueueEvents(QUEUE_NAMES.NOTIFICATIONS, {
    connection: redisConnection,
});

export const reminderQueueEvents = new QueueEvents(QUEUE_NAMES.REMINDERS, {
    connection: redisConnection,
});

export const reviewQueueEvents = new QueueEvents(QUEUE_NAMES.REVIEWS, {
    connection: redisConnection,
});

/**
 * Додати завдання в чергу сповіщень
 */
export async function addNotificationJob(
    type: string,
    data: {
        userId: string;
        bookingId?: string;
        language?: string;
        params?: Record<string, string>;
    },
    options?: {
        priority?: number;
        delay?: number;
    }
) {
    const jobName = `${type}-${Date.now()}`;

    return await notificationQueue.add(
        jobName,
        { type, ...data },
        {
            priority: options?.priority ?? JOB_PRIORITIES.MEDIUM,
            delay: options?.delay,
        }
    );
}

/**
 * Додати завдання нагадування
 */
export async function addReminderJob(
    reminderType: 'reminder-24h' | 'reminder-2h',
    data: {
        userId: string;
        bookingId: string;
        language?: string;
        params: Record<string, string>;
    },
    options?: {
        delay?: number;
    }
) {
    return await reminderQueue.add(
        reminderType,
        data,
        {
            priority: JOB_PRIORITIES.HIGH,
            delay: options?.delay,
        }
    );
}

/**
 * Додати запит відгуку
 */
export async function addReviewRequestJob(
    data: {
        userId: string;
        bookingId: string;
        language?: string;
        params: Record<string, string>;
    },
    options?: {
        delay?: number;
    }
) {
    return await reviewQueue.add(
        JOB_TYPES.REVIEW_REQUEST,
        data,
        {
            priority: JOB_PRIORITIES.LOW,
            delay: options?.delay,
        }
    );
}

/**
 * Закрити всі з'єднання черг
 */
export async function closeQueues() {
    await notificationQueue.close();
    await reminderQueue.close();
    await reviewQueue.close();
    await scheduleQueue.close();
    console.log('✅ All queues closed');
}
