import { authAdminClient } from '../clients/authAdminClient.js';

const bootedAt = Date.now();

export const analyticsService = {
  async overview() {
    const data = await authAdminClient.analytics.overview();
    return {
      ...data,
      health: {
        service: 'superadmin-service',
        uptimeSec: Math.floor((Date.now() - bootedAt) / 1000),
        authReachable: true,
      },
    };
  },
};
