// Audit Log Service for AOSTP Admin Dashboard

import { apiService } from "@/services/api";
import { AuditLog, AuditAction, AuditEntityType } from "@/types/audit";

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  entity?: AuditEntityType;
  action?: AuditAction;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  entityId?: string;
  ipAddress?: string;
  search?: string;
}

export interface ExportAuditLogsParams extends GetAuditLogsParams {
  format: "csv" | "excel";
}

export const auditLogService = {
  async getAuditLogs(params: GetAuditLogsParams): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await apiService.get("/audit-logs", { params });
    return response.data;
  },

  async exportAuditLogs(params: ExportAuditLogsParams): Promise<Blob> {
    const response = await apiService.get("/audit-logs/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};
