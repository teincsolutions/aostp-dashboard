// Audit Log hooks for AOSTP Admin Dashboard

import { useQuery, useMutation } from "@tanstack/react-query";
import { auditLogService, GetAuditLogsParams, ExportAuditLogsParams } from "@/services/auditLogService";
import { AuditLog } from "@/types/audit";

export function useAuditLogs(params: GetAuditLogsParams) {
  return useQuery<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }>({
    queryKey: ["auditLogs", params],
    queryFn: () => auditLogService.getAuditLogs(params),
  });
}

export function useExportAuditLogs() {
  return useMutation<Blob, Error, ExportAuditLogsParams>({
    mutationFn: (params) => auditLogService.exportAuditLogs(params),
  });
}
