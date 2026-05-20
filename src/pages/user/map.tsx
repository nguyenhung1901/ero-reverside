import { PublicLayout } from "@/components/layout/public-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { MapPin, Navigation, School, ShoppingBag, HeartPulse } from "lucide-react";
import { useProjectOverview } from "@/lib/api-client";

const defaultMap = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14879.512!2d106.0227!3d21.1047!2m3!1f0!2f0!3f0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135b3a3c2f56789%3A0xabcdef1234567890!2zUGjGsOG7nW5nIFBow7kgQ2jhuqVuLCBUUC4gVOG7qyBTxqFuLCBC4bqvYyBOaW5o!5e0!3m2!1svi!2s!4v1700000000001!5m2!1svi!2s";

const fallbackConnections = [
  { time: "5 Phút", title: "Trung tâm hành chính TP. Từ Sơn" },
  { time: "15 Phút", title: "Quốc lộ 1A – cửa ngõ Hà Nội – Lạng Sơn" },
  { time: "25 Phút", title: "Trung tâm Hà Nội qua cầu Đông Trù" },
  { time: "30 Phút", title: "Sân bay quốc tế Nội Bài" },
];

const fallbackInfrastructure = [
  { icon: "school", title: "Giáo Dục", desc: "Trường học và hệ thống giáo dục trong khu vực kết nối." },
  { icon: "shopping", title: "Thương Mại", desc: "Trung tâm thương mại, dịch vụ và làng nghề trong bán kính kết nối." },
  { icon: "health", title: "Y Tế", desc: "Bệnh viện, phòng khám và hệ thống y tế khu vực." },
];

function cardIcon(icon?: string) {
  if (icon === "school") return School;
  if (icon === "shopping") return ShoppingBag;
  if (icon === "health") return HeartPulse;
  return MapPin;
}

export default function MapPage() {
  const { data: project } = useProjectOverview("ero-riverside");

  const baseUrl = import.meta.env.BASE_URL || "/";
  const localMasterPlan = `${baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`}images/master-plan.jpg`;

  const connections = project?.mapConnections?.length ? project.mapConnections : fallbackConnections;
  const infrastructure = project?.infrastructure?.length ? project.infrastructure.slice(0, 3) : fallbackInfrastructure;

  return (
    <PublicLayout>
      <div className="bg-primary text-white py-16 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Vị Trí & Mặt Bằng</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">{project?.location || "Tọa độ kết nối trên trục Hà Nội - Bắc Ninh"}</p>
      </div>

      <div className="container mx-auto px-4 py-16">
        <SectionHeading title="Vị Trí Dự Án" subtitle="Tâm điểm kết nối" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
          <div className="lg:col-span-2 h-[500px] bg-gray-100 luxury-shadow relative z-0">
            <iframe src={project?.mapEmbedUrl || defaultMap} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Project Location" />
          </div>
          <div className="space-y-8 flex flex-col justify-center">
            <div className="bg-white p-8 luxury-shadow border-t-4 border-accent">
              <h3 className="font-display text-2xl font-bold text-primary mb-6">Kết nối giao thông</h3>
              <ul className="space-y-4">
                {connections.map((item: any, index: number) => (
                  <li key={`${item.time || item.label}-${index}`} className="flex items-start gap-4">
                    <div className="bg-primary/5 p-2 rounded-full"><Navigation className="w-5 h-5 text-accent" /></div>
                    <div><h4 className="font-semibold text-primary">{item.time || item.label || item.distance}</h4><p className="text-sm text-gray-500">{item.title || item.name || item.desc || item.description}</p></div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <SectionHeading title="Mặt Bằng Tổng Thể" subtitle="Quy hoạch đồng bộ" />
        <div className="mb-16 flex justify-center">
          <div className="relative w-full max-w-6xl border border-gray-200 bg-white p-3 luxury-shadow">
            <a
              href={localMasterPlan}
              target="_blank"
              rel="noreferrer"
              title="Mở sơ đồ mặt bằng ở kích thước đầy đủ"
              className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur px-4 py-2 text-sm font-semibold text-primary shadow-lg flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-accent" /> Sơ đồ phân khu chi tiết
            </a>

            <div className="max-h-[82vh] overflow-auto bg-gray-50 flex justify-center items-start px-3 py-4">
              <img
                src={localMasterPlan}
                alt="Sơ đồ mặt bằng tổng thể"
                className="block w-full h-auto md:w-auto md:h-[82vh] max-w-none cursor-zoom-in select-none"
                onError={(event) => {
                  const img = event.currentTarget;
                  img.alt = "Không tải được ảnh /images/master-plan.jpg";
                }}
              />
            </div>

          
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {infrastructure.map((item: any, index: number) => {
            const Icon = cardIcon(item.icon);
            return (
              <div key={`${item.title || item.name}-${index}`} className="bg-gray-50 p-6 border-l-4 border-accent">
                <Icon className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-display font-bold text-xl text-primary mb-2">{item.title || item.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc || item.description || item.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </PublicLayout>
  );
}
