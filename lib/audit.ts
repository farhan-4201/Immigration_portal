import prisma from './prisma';

export enum AuditEventType {
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILURE = 'LOGIN_FAILURE',
    ROLE_CHANGE = 'ROLE_CHANGE',
    ACCOUNT_DEACTIVATION = 'ACCOUNT_DEACTIVATION',
    UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
}

export async function logAuditEvent(
    eventType: AuditEventType | string,
    details: string,
    userId?: string,
    actorId?: string,
    ipAddress?: string
) {
    try {
        await prisma.auditLog.create({
            data: {
                eventType: eventType.toString(),
                details,
                userId,
                actorId,
                ipAddress,
            },
        });
    } catch (error) {
        console.error('Failed to log audit event:', error);
    }
}
