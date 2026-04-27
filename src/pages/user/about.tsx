import { PublicLayout } from "@/components/layout/public-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { Building2, TreePine, Car, School, CheckCircle2, ChevronRight, Landmark, Zap, Droplets, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useProjectMilestones, useProjectOverview } from "@/lib/api-client";

const iconMap: Record<string, any> = {
  house: Building2,
  building: Building2,
  school: School,
  tree: TreePine,
  road: Car,
  car: Car,
  power: Zap,
  water: Droplets,
  waste: Trash2,
};

const fallbackLandUse: any[] = [];

const fallbackMilestones: any[] = [];

function formatArea(project: any) {
  if (project?.totalAreaM2 && project?.totalAreaHa) {
    return `${Number(project.totalAreaM2).toLocaleString("vi-VN")} m² (${String(project.totalAreaHa).replace(".", ",")} ha)`;
  }
  return "Đang cập nhật";
}

function normalizeIdentity(project: any) {
  if (project?.identityItems?.length) return project.identityItems;
  return [
    { label: "Tên dự án", value: project?.name || "ERO Riverside" },
    { label: "Chủ đầu tư", value: project?.investorName || "Đang cập nhật" },
    { label: "Vị trí", value: project?.location || "Đang cập nhật" },
    { label: "Diện tích tổng quy hoạch", value: formatArea(project) },
    { label: "Pháp lý", value: project?.legalStatus || "Đang cập nhật" },
    { label: "Tổng số sản phẩm", value: project?.totalLowriseUnits ? `${project.totalLowriseUnits} căn thấp tầng` : "Đang cập nhật" },
  ];
}

export default function AboutPage() {
  const { data: project } = useProjectOverview("ero-riverside");
  const { data: milestonesData } = useProjectMilestones("ero-riverside");
  const milestones = milestonesData?.milestones?.length ? milestonesData.milestones : fallbackMilestones;
  const identityItems = normalizeIdentity(project);
  const boundaries = project?.boundaries?.length ? project.boundaries : [];
  const housing = project?.housingModels?.length ? project.housingModels : [];
  const landUse = project?.landUse?.length ? project.landUse : fallbackLandUse;
  const amenities = project?.amenities?.length ? project.amenities : [];
  const roads = project?.roads?.length ? project.roads : [];
  const infrastructure = project?.infrastructure?.length ? project.infrastructure : [];

  return (
    <PublicLayout>
      <div className="bg-primary text-white py-16 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Tổng Quan Dự Án</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">{project?.name || "ERO Riverside"} – dữ liệu hiển thị từ Supabase</p>
      </div>

      <div className="container mx-auto px-4 py-16 space-y-24">
        <section>
          <SectionHeading title="Thông Tin Dự Án" subtitle="Định danh & ranh giới địa lý" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
            <div className="space-y-4">
              {identityItems.map((item: any, index: number) => (
                <div key={`${item.label || item.title}-${index}`} className="flex items-start gap-3 border-b border-gray-100 pb-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{item.label || item.title}</p>
                    <p className="font-semibold text-primary">{item.value || item.desc || item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-primary mb-4 flex items-center gap-2"><Landmark className="w-5 h-5 text-accent" /> Ranh giới địa lý</h3>
              <div className="space-y-3">
                {(boundaries.length ? boundaries : [
                  { dir: "Dữ liệu", desc: "Chưa có ranh giới trong project_contents" },
                ]).map((item: any, index: number) => (
                  <div key={`${item.dir || item.label}-${index}`} className="flex items-start gap-3 bg-gray-50 p-4 border-l-4 border-accent">
                    <ChevronRight className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div><span className="font-bold text-primary mr-2">{item.dir || item.label}:</span><span className="text-gray-600 text-sm">{item.desc || item.value || item.description}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {housing.length > 0 && (
          <section>
            <SectionHeading title="Danh Mục Sản Phẩm" subtitle="Housing portfolio từ project_contents" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
              {housing.map((h: any, i: number) => (
                <motion.div key={`${h.code || h.name}-${i}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="bg-white luxury-shadow border-t-4 border-accent overflow-hidden">
                  {h.img || h.image || h.imageUrl ? <div className="h-48 overflow-hidden"><img src={h.img || h.image || h.imageUrl} alt={h.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div> : null}
                  <div className="p-5">
                    <span className="text-xs text-accent font-bold uppercase tracking-widest">{h.code || h.type || "Sản phẩm"}</span>
                    <h3 className="font-display font-bold text-lg text-primary mt-1 mb-3">{h.name || h.title}</h3>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {h.count ? <li><span className="font-semibold">Số lượng:</span> {h.count} căn/tòa</li> : null}
                      {h.totalArea ? <li><span className="font-semibold">Tổng DT đất:</span> {h.totalArea}</li> : null}
                      {h.size ? <li><span className="font-semibold">Kích thước lô:</span> {h.size}</li> : null}
                      {h.floors ? <li><span className="font-semibold">Tầng cao:</span> {h.floors}</li> : null}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeading title="Thông Số Sử Dụng Đất" subtitle="Quy hoạch chi tiết 1/500" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {landUse.map((item: any, i: number) => {
              const Icon = iconMap[item.icon] || iconMap[item.key] || Building2;
              return (
                <motion.div key={`${item.type || item.name}-${i}`} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="bg-white p-6 luxury-shadow border-b-4 border-accent">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4"><Icon className="w-6 h-6 text-white" /></div>
                  <p className="text-3xl font-display font-bold text-primary mb-1">{item.pct || item.percent || ""}</p>
                  <p className="font-semibold text-gray-700 text-sm mb-1">{item.type || item.name || item.label}</p>
                  <p className="text-accent font-bold text-sm">{item.area ? `${item.area} m²` : item.value}</p>
                  <p className="text-xs text-gray-400 mt-2">{item.note || item.desc || item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {amenities.length > 0 && (
          <section>
            <SectionHeading title="Hệ Thống Tiện Ích" subtitle="Dữ liệu tiện ích từ Supabase" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {amenities.map((a: any, i: number) => (
                <motion.div key={`${a.name || a.title}-${i}`} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }} className="bg-white p-5 luxury-shadow flex gap-4 items-start border-l-4 border-accent">
                  <TreePine className="w-6 h-6 text-accent shrink-0 mt-0.5" />
                  <div><h4 className="font-semibold text-primary text-sm">{a.name || a.title}</h4><p className="text-accent font-bold text-lg">{a.area || a.value}</p><p className="text-xs text-gray-400">{a.desc || a.description}</p></div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {(roads.length > 0 || infrastructure.length > 0) && (
          <section>
            <SectionHeading title="Quy Chuẩn Hạ Tầng" subtitle="Tiêu chuẩn kỹ thuật đồng bộ" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
              {roads.length > 0 && <div>
                <h3 className="font-display font-bold text-xl text-primary mb-4 flex items-center gap-2"><Car className="w-5 h-5 text-accent" /> Hệ thống đường giao thông</h3>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-primary text-white"><th className="p-3 text-left">Mặt cắt</th><th className="p-3 text-left">Loại đường</th><th className="p-3 text-left">Tổng rộng</th><th className="p-3 text-left">Chi tiết</th></tr></thead><tbody>{roads.map((r: any, i: number) => <tr key={`${r.code}-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}><td className="p-3 font-bold text-accent">{r.code}</td><td className="p-3 text-gray-700">{r.label || r.name}</td><td className="p-3 font-semibold text-primary">{r.width}</td><td className="p-3 text-gray-500 text-xs">{r.detail || r.description}</td></tr>)}</tbody></table></div>
              </div>}
              {infrastructure.length > 0 && <div>
                <h3 className="font-display font-bold text-xl text-primary mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-accent" /> Hệ thống kỹ thuật</h3>
                <div className="space-y-4">{infrastructure.map((item: any, i: number) => { const Icon = iconMap[item.icon] || Zap; return <div key={`${item.title}-${i}`} className="bg-gray-50 p-4 border-l-4 border-accent flex gap-4"><Icon className="w-5 h-5 text-accent shrink-0 mt-0.5" /><div><h4 className="font-semibold text-primary text-sm">{item.title || item.name}</h4><p className="text-xs text-gray-500 mt-1">{item.desc || item.description}</p></div></div>; })}</div>
              </div>}
            </div>
          </section>
        )}

        <section>
          <SectionHeading title="Hồ Sơ Pháp Lý" subtitle="Lịch sử hình thành & phê duyệt" />
          <div className="mt-8 relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-accent/30" />
            <div className="space-y-6">
              {milestones.map((m: any, i: number) => (
                <motion.div key={`${m.title}-${i}`} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="relative pl-16">
                  <div className="absolute left-3 top-3 w-6 h-6 bg-accent rounded-full border-4 border-white shadow-md" />
                  <div className="bg-white p-6 luxury-shadow">
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-2"><span className="text-accent font-bold text-sm">{new Date(m.milestoneDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span><span className="bg-primary/5 text-primary text-xs px-3 py-1 font-semibold">{m.documentRef}</span></div>
                    <h4 className="font-display font-bold text-lg text-primary mb-1">{m.title}</h4><p className="text-gray-500 text-sm leading-relaxed">{m.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
