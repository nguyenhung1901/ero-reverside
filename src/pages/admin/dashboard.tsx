import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListProducts,
  useCmsListLeads,
  useCmsListAuditLogs,
  useListProjectCategories,
} from "@/lib/api-client";
import {
  Building2, Users, CheckCircle, TrendingUp,
  LayoutGrid, Landmark, UsersRound, ScrollText,
  ArrowRight, ChevronUp, ChevronDown,
  BarChart2, Layers, Clock, AlertCircle, UserCheck
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, LabelList
} from "recharts";

const LEAD_PIPELINE = [
  { key: "new", label: "Mới", color: "#94a3b8" },
  { key: "contacted", label: "Đã liên hệ", color: "#60a5fa" },
  { key: "qualified", label: "Tiềm năng", color: "#C5963A" },
  { key: "converted", label: "Đã chốt", color: "#34d399" },
  { key: "closed", label: "Đã đóng", color: "#475569" },
];

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "TẠO MỚI", color: "bg-emerald-500/20 text-emerald-400" },
  update: { label: "CẬP NHẬT", color: "bg-blue-500/20 text-blue-400" },
  delete: { label: "XÓA", color: "bg-red-500/20 text-red-400" },
  login: { label: "ĐĂNG NHẬP", color: "bg-violet-500/20 text-violet-400" },
  logout: { label: "ĐĂNG XUẤT", color: "bg-gray-500/20 text-gray-400" },
  export: { label: "XUẤT DỮ LIỆU", color: "bg-orange-500/20 text-orange-400" },
};

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="text-right">
      <p className="text-2xl font-mono font-bold text-white tracking-wider">
        {now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest">
        {now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
      </p>
    </div>
  );
}

function KpiCard({ title, value, sub, icon: Icon, iconColor, trend, trendUp }: {
  title: string; value: string | number; sub?: string;
  icon: any; iconColor: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-100 p-6 hover:border-[#C5963A]/30 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {trendUp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-[#0D1B2E] mb-1 font-display">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{title}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function PipelineBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <p className="text-sm text-gray-300 w-28 shrink-0">{label}</p>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex items-center gap-2 w-14 shrink-0 justify-end">
        <span className="text-sm font-bold text-white">{value}</span>
        <span className="text-xs text-gray-500">({pct}%)</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0D1B2E] border border-white/10 px-4 py-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{payload[0].name}</p>
        <p className="text-lg font-bold text-[#C5963A]">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { data: products } = useListProducts();
  const { data: leads } = useCmsListLeads();
  const { data: logs } = useCmsListAuditLogs();
  const { data: categories } = useListProjectCategories("ero-riverside");

  const totalProducts = products?.total || 0;
  const available = products?.products?.filter(p => p.status === "available").length || 0;
  const sold = products?.products?.filter(p => p.status === "sold").length || 0;
  const reserved = products?.products?.filter(p => p.status === "reserved").length || 0;
  const allLeads = (leads as any)?.registrations || [];
  const totalLeads = leads?.total || 0;
  const newLeads = allLeads.filter((l: any) => l.currentStatus === "new").length;
  const converted = allLeads.filter((l: any) => l.currentStatus === "converted").length;
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

  const pipelineCounts = LEAD_PIPELINE.map(s => ({
    ...s,
    count: allLeads.filter((l: any) => l.currentStatus === s.key).length,
  }));

  const productPieData = [
    { name: "Còn hàng", value: available, color: "#10b981" },
    { name: "Giữ chỗ", value: reserved, color: "#f59e0b" },
    { name: "Đã bán", value: sold, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const categoryChartData = (categories?.categories || []).map((cat: any) => ({
    name: cat.name,
    "Còn hàng": products?.products?.filter(p => p.categorySlug === cat.slug && p.status === "available").length || 0,
    "Giữ chỗ": products?.products?.filter(p => p.categorySlug === cat.slug && p.status === "reserved").length || 0,
    "Đã bán": products?.products?.filter(p => p.categorySlug === cat.slug && p.status === "sold").length || 0,
  }));

  const QUICK_LINKS = [
    {
      label: "Danh mục", icon: LayoutGrid, href: "/admin/categories",
      color: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      count: categories?.total ?? 0,
      sub: `${categories?.categories?.length ?? 0} loại hình`,
    },
    {
      label: "Sản phẩm", icon: Landmark, href: "/admin/products",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      count: totalProducts,
      sub: `${available} còn · ${reserved} giữ chỗ`,
    },
    {
      label: "Khách hàng", icon: UsersRound, href: "/admin/registrations",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      count: totalLeads,
      sub: `${newLeads} chờ xử lý`,
    },
    {
      label: "Nhật ký", icon: ScrollText, href: "/admin/logs",
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      count: logs?.logs?.length ?? 0,
      sub: "thao tác gần đây",
    },
  ];

  return (
    <AdminLayout>
      {/* ── Luxury Header ─────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#0D1B2E] via-[#162340] to-[#0a1520] rounded-none mb-8 overflow-hidden">
        {/* Gold decorative line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C5963A] to-transparent" />
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-64 h-64 border border-white/20 rounded-full"
              style={{ top: `${-20 + i * 30}%`, right: `${-5 + i * 8}%` }} />
          ))}
        </div>

        <div className="relative px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-[#C5963A]" />
              <span className="text-[#C5963A] text-xs font-bold uppercase tracking-[0.3em]">ERO CMS Dashboard</span>
            </div>
            <h1 className="font-display text-4xl font-bold text-white mb-2">Tổng Quan Dự Án</h1>
            <p className="text-gray-400 text-sm">
              Theo dõi hiệu suất kinh doanh và quản lý toàn bộ hệ thống ERO Riverside
            </p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <LiveClock />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Hệ thống hoạt động bình thường</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Tổng Sản Phẩm"
          value={totalProducts}
          sub={`${available} còn hàng · ${reserved} giữ chỗ`}
          icon={Building2}
          iconColor="bg-blue-50 text-blue-600"
          trend="+0%"
          trendUp
        />
        <KpiCard
          title="Đã Bán"
          value={sold}
          sub={`${totalProducts > 0 ? Math.round((sold / totalProducts) * 100) : 0}% tổng quỹ hàng`}
          icon={CheckCircle}
          iconColor="bg-emerald-50 text-emerald-600"
          trend={`${totalProducts > 0 ? Math.round((sold / totalProducts) * 100) : 0}%`}
          trendUp={sold > 0}
        />
        <KpiCard
          title="Khách Hàng"
          value={totalLeads}
          sub={`${newLeads} chờ xử lý · ${converted} đã chốt`}
          icon={Users}
          iconColor="bg-violet-50 text-violet-600"
          trend={`${newLeads} mới`}
          trendUp={newLeads > 0}
        />
        <KpiCard
          title="Tỷ Lệ Chuyển Đổi"
          value={`${conversionRate}%`}
          sub={`${converted}/${totalLeads} khách chốt deal`}
          icon={TrendingUp}
          iconColor="bg-amber-50 text-amber-600"
          trend={`${conversionRate}%`}
          trendUp={conversionRate > 10}
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Category Breakdown – Grouped Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[#0D1B2E] text-sm uppercase tracking-widest">Phân Tích Theo Danh Mục</h3>
              <p className="text-xs text-gray-400 mt-0.5">Phân bố trạng thái sản phẩm theo từng loại hình</p>
            </div>
            <BarChart2 className="w-5 h-5 text-gray-300" />
          </div>
          {/* Legend */}
          <div className="flex items-center gap-5 mb-4">
            {[
              { color: "#10b981", label: "Còn hàng" },
              { color: "#f59e0b", label: "Giữ chỗ" },
              { color: "#ef4444", label: "Đã bán" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-xs text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }} barCategoryGap="28%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 0, fontSize: 12 }}
                  labelStyle={{ fontWeight: 700, color: "#0D1B2E", marginBottom: 4 }}
                />
                <Bar dataKey="Còn hàng" fill="#10b981" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="Còn hàng" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#10b981" }} />
                </Bar>
                <Bar dataKey="Giữ chỗ" fill="#f59e0b" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="Giữ chỗ" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#d97706" }} />
                </Bar>
                <Bar dataKey="Đã bán" fill="#ef4444" radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="Đã bán" position="top" style={{ fontSize: 12, fontWeight: 700, fill: "#dc2626" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Status – Bar Chart */}
        <div className="bg-white border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-[#0D1B2E] text-sm uppercase tracking-widest">Tình Trạng Hàng</h3>
              <p className="text-xs text-gray-400 mt-0.5">Phân bố trạng thái sản phẩm</p>
            </div>
            <Layers className="w-5 h-5 text-gray-300" />
          </div>
          {totalProducts > 0 ? (
            <>
              <div className="h-44 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productPieData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="30%">
                    <defs>
                      {productPieData.map((d, i) => (
                        <linearGradient key={i} id={`gradBar${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={d.color} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={d.color} stopOpacity={0.5} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                    <Tooltip
                      formatter={(value: any) => [value, "Số lượng"]}
                      contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 0, fontSize: 12 }}
                      labelStyle={{ fontWeight: 700, color: "#0D1B2E", marginBottom: 4 }}
                      itemStyle={{ color: "#374151" }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {productPieData.map((_, i) => (
                        <Cell key={i} fill={`url(#gradBar${i})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-50">
                {productPieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-500">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0D1B2E]">{d.value}</span>
                      <span className="text-gray-400">({totalProducts > 0 ? Math.round((d.value / totalProducts) * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* ── Lead Pipeline + Activity ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Pipeline */}
        <div className="bg-white border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-[#0D1B2E] text-sm uppercase tracking-widest">Phễu Khách Hàng</h3>
              <p className="text-xs text-gray-400 mt-0.5">Hành trình chuyển đổi khách hàng</p>
            </div>
            <UserCheck className="w-5 h-5 text-gray-300" />
          </div>

          <div className="space-y-4 mb-6">
            {pipelineCounts.map(s => (
              <PipelineBar key={s.key} label={s.label} value={s.count} total={totalLeads || 1} color={s.color} />
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Tổng khách hàng</p>
              <p className="text-2xl font-bold text-[#0D1B2E] font-display">{totalLeads}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Tỷ lệ chốt</p>
              <p className="text-2xl font-bold text-[#C5963A] font-display">{conversionRate}%</p>
            </div>
            <Link href="/admin/registrations">
              <button className="flex items-center gap-2 text-xs text-[#0D1B2E] hover:text-[#C5963A] transition-colors border border-gray-200 hover:border-[#C5963A]/40 px-3 py-2">
                Xem chi tiết <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-[#0D1B2E] text-sm uppercase tracking-widest">Hoạt Động Gần Đây</h3>
              <p className="text-xs text-gray-400 mt-0.5">Lịch sử thao tác trên hệ thống</p>
            </div>
            <Clock className="w-5 h-5 text-gray-300" />
          </div>

          <div className="space-y-0 overflow-y-auto max-h-64">
            {logs?.logs?.slice(0, 8).map((log, idx) => {
              const meta = ACTION_LABELS[log.actionType] || { label: log.actionType.toUpperCase(), color: "bg-gray-100 text-gray-500" };
              return (
                <div key={log.id} className={`flex items-start gap-3 py-3 ${idx < (logs.logs?.length || 0) - 1 ? "border-b border-gray-50" : ""}`}>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 uppercase whitespace-nowrap shrink-0 mt-0.5 ${meta.color}`}>
                    {meta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0D1B2E] truncate leading-tight">{log.description}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              );
            })}
            {(!logs?.logs || logs.logs.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Chưa có hoạt động nào</p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-gray-50">
            <Link href="/admin/logs">
              <button className="w-full flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0D1B2E] hover:text-[#C5963A] transition-colors py-2 border border-gray-200 hover:border-[#C5963A]/40">
                Xem toàn bộ nhật ký <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
