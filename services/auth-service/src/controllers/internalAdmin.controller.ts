import type { Request, Response } from 'express';
import { HttpError, actorFromHeaders, ok, okList, okPage, created, deleted } from '@ucc/service-kit';
import type { IntegrationProvider } from '@ucc/types';
import { locationService } from '../services/location.service.js';
import { roleService } from '../services/role.service.js';
import { settingService } from '../services/setting.service.js';
import { integrationCredentialService } from '../services/integrationCredential.service.js';
import { auditService } from '../services/audit.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { authService } from '../services/auth.service.js';

// Internal-only: reached via requireInternalSecret, not end-user JWT auth.
// Mutating handlers require the caller to forward X-Actor-* headers (built by
// superadmin-service's authAdminClient from the RBAC-verified end-user JWT).
function requireActor(req: Request) {
  const actor = actorFromHeaders(req);
  if (!actor) throw new HttpError(400, 'Missing X-Actor-* headers');
  return actor;
}

export const internalAdminController = {
  // ---- Locations (Multi-Clinic Management) ----
  async listLocations(req: Request, res: Response) {
    const status = req.query.status ? String(req.query.status) : undefined;
    okList(res, await locationService.list(status));
  },

  async getLocation(req: Request, res: Response) {
    ok(res, await locationService.get(req.params.id!));
  },

  async createLocation(req: Request, res: Response) {
    created(res, await locationService.create(req.body, requireActor(req)));
  },

  async updateLocation(req: Request, res: Response) {
    ok(res, await locationService.update(req.params.id!, req.body, requireActor(req)));
  },

  async deleteLocation(req: Request, res: Response) {
    const hard = req.query.hard === 'true' || req.query.hard === '1';
    await locationService.remove(req.params.id!, hard, requireActor(req));
    deleted(res);
  },

  // ---- Role configuration ----
  async listRoles(_req: Request, res: Response) {
    okList(res, await roleService.list());
  },

  async updateRole(req: Request, res: Response) {
    ok(res, await roleService.update(req.params.role!, req.body, requireActor(req)));
  },

  // ---- Platform settings ----
  async getSettings(_req: Request, res: Response) {
    ok(res, await settingService.getAll());
  },

  async updateSettings(req: Request, res: Response) {
    ok(res, await settingService.updateMany(req.body.settings, requireActor(req)));
  },

  // ---- Integration credentials (third-party API settings) ----
  async getIntegrations(req: Request, res: Response) {
    const provider = req.query.provider ? String(req.query.provider) : undefined;
    ok(res, await integrationCredentialService.getMasked(provider));
  },

  async updateIntegrations(req: Request, res: Response) {
    const { provider, values } = req.body as { provider: IntegrationProvider; values: Record<string, string> };
    ok(res, await integrationCredentialService.updateMany(provider, values, requireActor(req)));
  },

  // Service-to-service only (notification-service, billing-service) — decrypted values.
  async getIntegrationSecrets(req: Request, res: Response) {
    ok(res, await integrationCredentialService.getDecrypted(req.params.provider!));
  },

  // ---- Audit logs ----
  async listAuditLogs(req: Request, res: Response) {
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25) || 25));
    const parseDate = (v: unknown) => {
      if (!v) return undefined;
      const d = new Date(String(v));
      return Number.isNaN(d.getTime()) ? undefined : d;
    };
    const { logs, total } = await auditService.search({
      actorId: req.query.actorId ? String(req.query.actorId) : undefined,
      action: req.query.action ? String(req.query.action) : undefined,
      entity: req.query.entity ? String(req.query.entity) : undefined,
      from: parseDate(req.query.from),
      to: parseDate(req.query.to),
      page,
      pageSize,
    });
    okPage(res, logs, { page, pageSize, totalCount: total });
  },

  // ---- Analytics ----
  async analyticsOverview(_req: Request, res: Response) {
    ok(res, await analyticsService.overview());
  },

  // ---- User creation (any of the eight canonical roles) ----
  async createUser(req: Request, res: Response) {
    created(res, await authService.adminCreateUser(req.body, requireActor(req)));
  },
};
