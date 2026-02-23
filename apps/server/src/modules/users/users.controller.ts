import type { FastifyInstance } from 'fastify';

export async function usersRoutes(app: FastifyInstance) {
    // TODO: Implement in Phase 7 (Admin panel)
    app.get('/', async () => ({ message: 'Users module - coming soon' }));
}
