import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useCmsListLeads, useCmsUpdateLeadStatus, useCmsDeleteLead, cmsExportLeads, useGetAdminMe } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  qualified: "Tiềm năng",
  converted: "Đã chốt",
  closed: "Đã đóng",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  qualified: "bg-purple-100 text-purple-700 border-purple-200",
  converted: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AdminRegistrations() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useGetAdminMe();

  const { data, isLoading } = useCmsListLeads();

  const deleteMut = useCmsDeleteLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/cms/leads"] });
        toast({ title: "Đã xóa khách hàng" });
      }
    }
  });

  const statusMut = useCmsUpdateLeadStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/cms/leads"] });
        toast({ title: "Đã cập nhật trạng thái" });
      }
    }
  });

  const [isExporting, setIsExporting] = useState(false);

  const summaryCounts = useMemo(() => {
    const registrations = data?.registrations || [];
    return {
      new: registrations.filter((r) => r.currentStatus === "new").length,
      contacted: registrations.filter((r) => r.currentStatus === "contacted").length,
      qualified: registrations.filter((r) => r.currentStatus === "qualified").length,
      converted: registrations.filter((r) => r.currentStatus === "converted").length,
      closed: registrations.filter((r) => r.currentStatus === "closed").length,
    };
  }, [data?.registrations]);

  const filteredRegistrations = useMemo(() => {
    const registrations = data?.registrations || [];
    if (statusFilter === "all") return registrations;
    return registrations.filter((r) => r.currentStatus === statusFilter);
  }, [data?.registrations, statusFilter]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await cmsExportLeads({ status: statusFilter });
      if (result) {
        const blob = new Blob([result as string], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `khach-hang${statusFilter !== "all" ? `-${statusFilter}` : ""}-${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: statusFilter === "all" ? "Đã xuất toàn bộ khách hàng" : `Đã xuất khách hàng trạng thái: ${STATUS_LABELS[statusFilter] || statusFilter}` });
      }
    } catch {
      toast({ title: "Lỗi xuất file", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    statusMut.mutate({ id, data: { status: status as any } });
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Khách Hàng Đăng Ký</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng số: {data?.total || 0} khách hàng</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="rounded-none border-gray-300 w-40">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {me?.role === "admin" && (
            <Button onClick={handleExport} variant="outline" className="rounded-none border-primary text-primary" disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" /> {isExporting ? "Đang xuất..." : "Xuất CSV"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const count = summaryCounts[status as keyof typeof summaryCounts] || 0;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={`p-3 border text-center transition-colors ${statusFilter === status ? "border-accent bg-accent/5" : "border-gray-100 bg-white hover:border-gray-200"}`}
            >
              <div className="text-2xl font-bold text-primary">{count}</div>
              <div className={`text-xs mt-1 px-2 py-0.5 border inline-block ${STATUS_COLORS[status]}`}>{label}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày đăng ký</TableHead>
              <TableHead>Họ Tên</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nhu cầu</TableHead>
              <TableHead>Kênh</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">Đang tải...</TableCell></TableRow>
            ) : filteredRegistrations.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs text-gray-500 font-mono whitespace-nowrap">
                  {format(new Date(r.createdAt), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell className="font-medium text-primary">{r.fullName}</TableCell>
                <TableCell className="font-mono text-sm">{r.phone}</TableCell>
                <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">{r.email}</TableCell>
                <TableCell>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 text-xs border border-blue-100">{r.interestCategory}</span>
                </TableCell>
                <TableCell className="text-xs text-gray-500">{r.sourceChannel || "website"}</TableCell>
                <TableCell>
                  <Select value={r.currentStatus} onValueChange={(val) => handleStatusChange(r.id, val)}>
                    <SelectTrigger className={`rounded-none text-xs h-8 w-32 border ${STATUS_COLORS[r.currentStatus] || ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => { if (confirm("Xóa khách hàng này?")) deleteMut.mutate({ id: r.id }); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filteredRegistrations.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-500">Không có khách hàng ở trạng thái này</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
