import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAdminMe } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, ClipboardList, Download, Filter, RefreshCcw, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

const ACTION_COLORS: Record<string, string> = {
  create: "text-green-600",
  update: "text-blue-600",
  delete: "text-red-600",
  login: "text-purple-600",
  logout: "text-gray-500",
  export: "text-orange-600",
  system: "text-gray-400",
  view: "text-indigo-600",
};

const ACTION_LABELS: Record<string, string> = {
  create: "TẠO MỚI",
  update: "CẬP NHẬT",
  delete: "XÓA",
  login: "ĐĂNG NHẬP",
  logout: "ĐĂNG XUẤT",
  export: "XUẤT DỮ LIỆU",
  system: "HỆ THỐNG",
};

const ENTITY_LABELS: Record<string, string> = {
  auth: "Xác thực",
  lead: "Khách hàng",
  leads: "Khách hàng",
  products: "Sản phẩm",
  product_categories: "Danh mục",
  media_assets: "Media",
  projects: "Dự án",
  project_contents: "Nội dung dự án",
  project_milestones: "Tiến độ dự án",
  profiles: "Tài khoản CMS",
  data_export: "Xuất dữ liệu",
};

const ACTION_OPTIONS = [
  { value: "", label: "Tất cả hành động" },
  { value: "create", label: "Tạo mới" },
  { value: "update", label: "Cập nhật" },
  { value: "delete", label: "Xóa" },
  { value: "login", label: "Đăng nhập" },
  { value: "logout", label: "Đăng xuất" },
  { value: "export", label: "Xuất dữ liệu" },
  { value: "system", label: "Hệ thống" },
];

const ENTITY_OPTIONS = [
  { value: "", label: "Tất cả đối tượng" },
  { value: "auth", label: "Xác thực" },
  { value: "lead", label: "Khách hàng" },
  { value: "products", label: "Sản phẩm" },
  { value: "product_categories", label: "Danh mục" },
  { value: "media_assets", label: "Media" },
  { value: "projects", label: "Dự án" },
  { value: "project_contents", label: "Nội dung dự án" },
  { value: "project_milestones", label: "Tiến độ dự án" },
  { value: "profiles", label: "Tài khoản CMS" },
  { value: "data_export", label: "Xuất dữ liệu" },
];

type ProfileRow = {
  id: string;
  username: string | null;
  email: string | null;
  full_name: string | null;
};

type AuditLogRow = {
  id: number;
  actor_id: string | null;
  actor_role: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
};

type DataExportRow = {
  id: number;
  export_type: string;
  file_name?: string | null;
  filters_json: Record<string, unknown> | null;
  exported_by: string | null;
  created_at: string;
};

type PagedResult<T> = {
  rows: T[];
  total: number;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Không xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd/MM/yyyy HH:mm:ss");
}

function formatEntity(entityType?: string | null) {
  if (!entityType) return "Không xác định";
  return ENTITY_LABELS[entityType] || entityType;
}

function formatExportType(value: string) {
  return value === "lead_list" ? "Danh sách khách hàng" : value;
}

function formatExportFilters(value: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return "Không áp dụng";
  const entries = Object.entries(value)
    .filter(([, entryValue]) => entryValue !== undefined && entryValue !== null && entryValue !== "")
    .map(([key, entryValue]) => `${key}: ${String(entryValue)}`);
  return entries.length ? entries.join(", ") : "Không áp dụng";
}

function sanitizeSearch(value: string) {
  return value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ");
}

function toDateStart(value: string) {
  return value ? `${value}T00:00:00.000` : "";
}

function toDateEnd(value: string) {
  return value ? `${value}T23:59:59.999` : "";
}

function getRange(page: number, pageSize: number) {
  const safePage = Math.max(1, page || 1);
  const safePageSize = Math.max(1, pageSize || DEFAULT_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  return { from, to: from + safePageSize - 1 };
}

function getProfileLabel(profile?: ProfileRow | null, fallbackRole?: string | null) {
  return {
    name: profile?.full_name || profile?.username || profile?.email || "Hệ thống",
    subtitle: profile?.email || (fallbackRole ? `Vai trò: ${fallbackRole}` : "Không xác định"),
  };
}

function PaginationBar({
  page,
  pageSize,
  total,
  loading,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border border-gray-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-gray-600">
        <strong>Trang {page}/{totalPages}</strong>
        <span className="mx-2">|</span>
        Hiển thị {firstItem}-{lastItem} trên {total} bản ghi
        {loading ? <span className="ml-2 text-xs text-gray-400">Đang tải...</span> : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Trang trước
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-none"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Trang sau <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminLogs() {
  const [tab, setTab] = useState<"audit" | "exports">("audit");

  const [auditRows, setAuditRows] = useState<AuditLogRow[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [exportRows, setExportRows] = useState<DataExportRow[]>([]);
  const [exportTotal, setExportTotal] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [profilesById, setProfilesById] = useState<Record<string, ProfileRow>>({});

  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [auditSearch, setAuditSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [entityType, setEntityType] = useState("");
  const [auditFromDate, setAuditFromDate] = useState("");
  const [auditToDate, setAuditToDate] = useState("");
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);

  const [exportPage, setExportPage] = useState(1);
  const [exportPageSize, setExportPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [exportSearch, setExportSearch] = useState("");
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportRefreshKey, setExportRefreshKey] = useState(0);

  const { data: me, isLoading: meLoading } = useGetAdminMe();
  const isAdmin = me?.role === "admin";

  const auditTotalPages = Math.max(1, Math.ceil(auditTotal / auditPageSize));
  const exportTotalPages = Math.max(1, Math.ceil(exportTotal / exportPageSize));

  const resetAuditFilters = () => {
    setAuditSearch("");
    setActionType("");
    setEntityType("");
    setAuditFromDate("");
    setAuditToDate("");
    setAuditPage(1);
  };

  const resetExportFilters = () => {
    setExportSearch("");
    setExportFromDate("");
    setExportToDate("");
    setExportPage(1);
  };

  useEffect(() => {
    if (!isAdmin || tab !== "audit") return;

    const loadAuditLogs = async () => {
      setAuditLoading(true);
      setAuditError(null);
      const { from, to } = getRange(auditPage, auditPageSize);

      let query = supabase
        .from("audit_logs")
        .select("id, actor_id, actor_role, action_type, entity_type, entity_id, description, ip_address, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (actionType) query = query.eq("action_type", actionType);
      if (entityType) query = query.eq("entity_type", entityType);
      if (auditFromDate) query = query.gte("created_at", toDateStart(auditFromDate));
      if (auditToDate) query = query.lte("created_at", toDateEnd(auditToDate));

      const cleanSearch = sanitizeSearch(auditSearch);
      if (cleanSearch) {
        const pattern = `%${cleanSearch}%`;
        query = query.or(
          `description.ilike.${pattern},entity_type.ilike.${pattern},entity_id.ilike.${pattern},action_type.ilike.${pattern}`,
        );
      }

      const { data, error, count } = await query;
      if (error) {
        setAuditRows([]);
        setAuditTotal(0);
        setAuditError(error.message);
        setAuditLoading(false);
        return;
      }

      const rows = (data || []) as AuditLogRow[];
      setAuditRows(rows);
      setAuditTotal(count || 0);
      setAuditLoading(false);

      const actorIds = Array.from(new Set(rows.map((row) => row.actor_id).filter(Boolean))) as string[];
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, email, full_name")
          .in("id", actorIds);

        if (profiles) {
          setProfilesById((current) => {
            const next = { ...current };
            (profiles as ProfileRow[]).forEach((profile) => {
              next[profile.id] = profile;
            });
            return next;
          });
        }
      }
    };

    void loadAuditLogs();
  }, [isAdmin, tab, auditPage, auditPageSize, auditSearch, actionType, entityType, auditFromDate, auditToDate, auditRefreshKey]);

  useEffect(() => {
    if (!isAdmin || tab !== "exports") return;

    const loadDataExports = async () => {
      setExportLoading(true);
      setExportError(null);
      const { from, to } = getRange(exportPage, exportPageSize);

      let query = supabase
        .from("data_exports")
        .select("id, export_type, file_name, filters_json, exported_by, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (exportFromDate) query = query.gte("created_at", toDateStart(exportFromDate));
      if (exportToDate) query = query.lte("created_at", toDateEnd(exportToDate));

      const cleanSearch = sanitizeSearch(exportSearch);
      if (cleanSearch) {
        const pattern = `%${cleanSearch}%`;
        query = query.or(`file_name.ilike.${pattern},export_type.ilike.${pattern}`);
      }

      const { data, error, count } = await query;
      if (error) {
        setExportRows([]);
        setExportTotal(0);
        setExportError(error.message);
        setExportLoading(false);
        return;
      }

      const rows = (data || []) as DataExportRow[];
      setExportRows(rows);
      setExportTotal(count || 0);
      setExportLoading(false);

      const actorIds = Array.from(new Set(rows.map((row) => row.exported_by).filter(Boolean))) as string[];
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, email, full_name")
          .in("id", actorIds);

        if (profiles) {
          setProfilesById((current) => {
            const next = { ...current };
            (profiles as ProfileRow[]).forEach((profile) => {
              next[profile.id] = profile;
            });
            return next;
          });
        }
      }
    };

    void loadDataExports();
  }, [isAdmin, tab, exportPage, exportPageSize, exportSearch, exportFromDate, exportToDate, exportRefreshKey]);

  useEffect(() => {
    if (auditPage > auditTotalPages) setAuditPage(auditTotalPages);
  }, [auditPage, auditTotalPages]);

  useEffect(() => {
    if (exportPage > exportTotalPages) setExportPage(exportTotalPages);
  }, [exportPage, exportTotalPages]);

  const auditVersionNote = useMemo(() => {
  }, [auditPageSize]);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Nhật Ký & Kiểm Toán</h1>
        <p className="mt-1 text-sm text-gray-500">
          Theo dõi hoạt động hệ thống theo từng trang, hỗ trợ lọc và tìm kiếm khi cần kiểm toán.
        </p>
      </div>

      {meLoading ? (
        <div className="border border-gray-200 bg-white p-6 text-sm text-gray-700">Đang kiểm tra quyền truy cập...</div>
      ) : !isAdmin ? (
        <div className="border border-gray-200 bg-white p-6 text-sm text-gray-700">
          Chỉ tài khoản <strong>admin</strong> mới được xem nhật ký và lịch sử xuất dữ liệu.
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            <Button variant={tab === "audit" ? "default" : "outline"} onClick={() => setTab("audit")} className="rounded-none">
              <ClipboardList className="mr-2 h-4 w-4" /> Nhật ký hoạt động ({auditTotal})
            </Button>
            <Button variant={tab === "exports" ? "default" : "outline"} onClick={() => setTab("exports")} className="rounded-none">
              <Download className="mr-2 h-4 w-4" /> Lịch sử xuất dữ liệu ({exportTotal})
            </Button>
          </div>

          {tab === "audit" ? (
            <div className="space-y-4">
              <div className="border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Filter className="h-4 w-4" /> Bộ lọc nhật ký
                  </div>
                  <span className="text-xs font-semibold text-gray-500">{auditVersionNote}</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
                  <div className="relative xl:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={auditSearch}
                      onChange={(event) => {
                        setAuditSearch(event.target.value);
                        setAuditPage(1);
                      }}
                      placeholder="Tìm kiếm..."
                      className="h-10 w-full border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <select
                    value={actionType}
                    onChange={(event) => {
                      setActionType(event.target.value);
                      setAuditPage(1);
                    }}
                    className="h-10 border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary"
                  >
                    {ACTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    value={entityType}
                    onChange={(event) => {
                      setEntityType(event.target.value);
                      setAuditPage(1);
                    }}
                    className="h-10 border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary"
                  >
                    {ENTITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={auditFromDate}
                    onChange={(event) => {
                      setAuditFromDate(event.target.value);
                      setAuditPage(1);
                    }}
                    className="h-10 border border-gray-200 px-3 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="date"
                    value={auditToDate}
                    onChange={(event) => {
                      setAuditToDate(event.target.value);
                      setAuditPage(1);
                    }}
                    className="h-10 border border-gray-200 px-3 text-sm outline-none focus:border-primary"
                  />
                  <select
                    value={auditPageSize}
                    onChange={(event) => {
                      setAuditPageSize(Number(event.target.value));
                      setAuditPage(1);
                    }}
                    className="h-10 border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size} dòng/trang</option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button variant="outline" size="sm" onClick={() => setAuditRefreshKey((key) => key + 1)} className="rounded-none">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Tải lại
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetAuditFilters} className="rounded-none">
                    <X className="mr-2 h-4 w-4" /> Xóa lọc
                  </Button>
                </div>
              </div>

              <PaginationBar page={auditPage} pageSize={auditPageSize} total={auditTotal} loading={auditLoading} onPageChange={setAuditPage} />

              <div className="overflow-hidden border border-gray-200 bg-white">
                <div className="max-h-[520px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-white">
                      <TableRow>
                        <TableHead className="w-[180px]">Thời gian</TableHead>
                        <TableHead className="w-[140px]">Hành động</TableHead>
                        <TableHead className="w-[220px]">Người thực hiện</TableHead>
                        <TableHead className="w-[160px]">Đối tượng</TableHead>
                        <TableHead>Chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLoading ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center">Đang tải...</TableCell></TableRow>
                      ) : auditError ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-red-600">{auditError}</TableCell></TableRow>
                      ) : auditRows.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-gray-500">Không có nhật ký phù hợp</TableCell></TableRow>
                      ) : auditRows.map((log) => {
                        const profile = log.actor_id ? profilesById[log.actor_id] : null;
                        const actor = getProfileLabel(profile, log.actor_role);
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap font-mono text-xs text-gray-500">{formatDateTime(log.created_at)}</TableCell>
                            <TableCell>
                              <span className={`text-xs font-bold ${ACTION_COLORS[log.action_type] || "text-gray-600"}`}>
                                {ACTION_LABELS[log.action_type] || log.action_type.toUpperCase()}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="font-medium text-primary">{actor.name}</div>
                              <div className="text-xs text-gray-500">{actor.subtitle}</div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold uppercase text-gray-700">{formatEntity(log.entity_type)}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              <div>{log.description || "Không có mô tả"}</div>
                              {log.entity_id ? <div className="mt-1 text-xs text-gray-400">Mã bản ghi: {log.entity_id}</div> : null}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <PaginationBar page={auditPage} pageSize={auditPageSize} total={auditTotal} loading={auditLoading} onPageChange={setAuditPage} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Filter className="h-4 w-4" /> Bộ lọc lịch sử xuất dữ liệu
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="relative xl:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={exportSearch}
                      onChange={(event) => {
                        setExportSearch(event.target.value);
                        setExportPage(1);
                      }}
                      placeholder="Tìm tên file hoặc loại xuất..."
                      className="h-10 w-full border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <input
                    type="date"
                    value={exportFromDate}
                    onChange={(event) => {
                      setExportFromDate(event.target.value);
                      setExportPage(1);
                    }}
                    className="h-10 border border-gray-200 px-3 text-sm outline-none focus:border-primary"
                  />
                  <input
                    type="date"
                    value={exportToDate}
                    onChange={(event) => {
                      setExportToDate(event.target.value);
                      setExportPage(1);
                    }}
                    className="h-10 border border-gray-200 px-3 text-sm outline-none focus:border-primary"
                  />
                  <select
                    value={exportPageSize}
                    onChange={(event) => {
                      setExportPageSize(Number(event.target.value));
                      setExportPage(1);
                    }}
                    className="h-10 border border-gray-200 bg-white px-3 text-sm outline-none focus:border-primary"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>{size} dòng/trang</option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button variant="outline" size="sm" onClick={() => setExportRefreshKey((key) => key + 1)} className="rounded-none">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Tải lại
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetExportFilters} className="rounded-none">
                    <X className="mr-2 h-4 w-4" /> Xóa lọc
                  </Button>
                </div>
              </div>

              <PaginationBar page={exportPage} pageSize={exportPageSize} total={exportTotal} loading={exportLoading} onPageChange={setExportPage} />

              <div className="overflow-hidden border border-gray-200 bg-white">
                <div className="max-h-[520px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-white">
                      <TableRow>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Loại xuất</TableHead>
                        <TableHead>Tệp</TableHead>
                        <TableHead>Bộ lọc áp dụng</TableHead>
                        <TableHead>Người xuất</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exportLoading ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center">Đang tải...</TableCell></TableRow>
                      ) : exportError ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-red-600">{exportError}</TableCell></TableRow>
                      ) : exportRows.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-gray-500">Không có lịch sử xuất dữ liệu phù hợp</TableCell></TableRow>
                      ) : exportRows.map((item) => {
                        const profile = item.exported_by ? profilesById[item.exported_by] : null;
                        const actor = getProfileLabel(profile, null);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="whitespace-nowrap font-mono text-xs text-gray-500">{formatDateTime(item.created_at)}</TableCell>
                            <TableCell>
                              <span className="border border-orange-100 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
                                {formatExportType(item.export_type)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{item.file_name || "Không ghi nhận"}</TableCell>
                            <TableCell className="text-sm text-gray-600">{formatExportFilters(item.filters_json)}</TableCell>
                            <TableCell className="text-sm">
                              <div className="font-medium text-primary">{actor.name}</div>
                              <div className="text-xs text-gray-500">{actor.subtitle}</div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <PaginationBar page={exportPage} pageSize={exportPageSize} total={exportTotal} loading={exportLoading} onPageChange={setExportPage} />
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
