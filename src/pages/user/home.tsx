import { PublicLayout } from "@/components/layout/public-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { useListProducts, useListMedia, useProjectOverview } from "@/lib/api-client";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Maximize, ArrowRight, ShieldCheck, TreePine, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";

const fallbackImage = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80";

function fmtArea(ha?: number | null, m2?: number | null) {
  if (ha) return `${String(ha).replace(".", ",")} ha`;
  if (m2) return `${Number(m2).toLocaleString("vi-VN")} m²`;
  return "Đang cập nhật";
}

export default function Home() {
  const { data: project } = useProjectOverview("ero-riverside");
  const { data: productsData } = useListProducts({ limit: 3 } as any);
  const { data: mediaData } = useListMedia({ publicOnly: true, type: "image" });

  const featuredProducts = productsData?.products?.slice(0, 3) || [];
  const publicImages = mediaData?.media || [];
  const heroImage = project?.heroImageUrl || publicImages.find((m: any) => /hero|banner|phối cảnh/i.test(`${m.category} ${m.title}`))?.url || publicImages[0]?.url || `${import.meta.env.BASE_URL}images/hero-bg.png`;
  const aboutImage = publicImages.find((m: any) => /mô hình|sa bàn|phối cảnh/i.test(`${m.category} ${m.title}`))?.url || `${import.meta.env.BASE_URL}images/about-model.png`;
  const amenityImages = publicImages.filter((m: any) => /tiện ích|cảnh quan|công viên|clubhouse|bể bơi/i.test(`${m.category} ${m.title}`));
  const stats = project?.overviewStats?.length ? project.overviewStats : [
    { label: "Tổng diện tích", value: fmtArea(project?.totalAreaHa, project?.totalAreaM2) },
    { label: "Mật độ xây dựng", value: project?.densityPercent ? `${String(project.densityPercent).replace(".", ",")}%` : "46,15%" },
    { label: "Số lượng sản phẩm", value: project?.totalLowriseUnits ? `${project.totalLowriseUnits}+ căn` : "Đang cập nhật" },
    { label: "Pháp lý", value: project?.legalStatus || "Đang cập nhật" },
  ];
  const identityItems = project?.identityItems?.length ? project.identityItems : [
    "Dữ liệu tổng quan được quản trị từ Supabase CMS",
  ].map((text) => ({ title: text }));
  const amenities = project?.amenities?.length ? project.amenities.slice(0, 4) : [
    { name: "Công viên trung tâm", desc: "Không gian xanh nội khu" },
    { name: "Bể bơi & Clubhouse", desc: "Tiện ích cư dân" },
  ];

  return (
    <PublicLayout>
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt={project?.name || "ERO Riverside"} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <span className="text-accent font-semibold tracking-[0.3em] uppercase text-sm md:text-base mb-6 block">
              Chủ đầu tư: {project?.investorName || "Đang cập nhật"}
            </span>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
              {project?.name || "ERO Riverside"}
            </h1>
            <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              {project?.shortDescription || project?.description || "Nội dung dự án được đồng bộ từ Supabase backend."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-base px-8 py-6 rounded-none uppercase tracking-wider bg-transparent transition-all duration-300 w-full sm:w-auto">Nhận Báo Giá</Button></Link>
              <Link href="/map"><Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-base px-8 py-6 rounded-none uppercase tracking-wider bg-transparent transition-all duration-300 w-full sm:w-auto">Xem Sa Bàn</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-16 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
            {stats.slice(0, 4).map((stat: any, i: number) => (
              <motion.div key={`${stat.label}-${i}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center px-4">
                <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-gray-500 uppercase tracking-wider text-xs md:text-sm font-semibold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative">
              <div className="absolute -inset-4 bg-accent/10 translate-x-4 translate-y-4" />
              <img src={aboutImage} alt={project?.name || "ERO Riverside"} className="relative z-10 w-full h-auto object-cover luxury-shadow" />
            </div>
            <div className="lg:w-1/2">
              <SectionHeading title="Tầm Nhìn & Vị Thế" subtitle="Tổng quan dự án" align="left" />
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>{project?.description || project?.shortDescription || "Thông tin tổng quan dự án được lấy từ bảng projects và project_contents trên Supabase."}</p>
                <ul className="space-y-3 mt-8">
                  {identityItems.slice(0, 4).map((item: any, i: number) => (
                    <li key={i} className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
                      <span className="text-primary font-medium">{item.title || item.label || item.value || item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <SectionHeading title="Sản Phẩm Nổi Bật" subtitle="Dữ liệu từ Supabase" align="left" className="mb-0" />
            <Link href="/products" className="hidden md:flex items-center gap-2 text-accent font-semibold hover:text-primary transition-colors uppercase tracking-wider text-sm">Xem tất cả <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <motion.div key={product.id} whileHover={{ y: -10 }} className="group border border-gray-100 bg-white hover:luxury-shadow transition-all duration-300 flex flex-col h-full">
                <div className="relative h-64 overflow-hidden">
                  <img src={product.imageUrl || fallbackImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 left-4"><span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5">{product.categoryName}</span></div>
                  <div className="absolute top-4 right-4"><span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 ${product.status === 'available' ? 'bg-green-500 text-white' : product.status === 'sold' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>{product.status === 'available' ? 'Còn hàng' : product.status === 'sold' ? 'Đã bán' : 'Giữ chỗ'}</span></div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="font-display text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow">{product.description}</p>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600"><Maximize className="w-4 h-4 text-accent" /><span className="font-medium">{product.area} m²</span></div>
                    <div className="font-display font-bold text-xl text-primary">{product.price} <span className="text-sm font-sans text-gray-500">tỷ VND</span></div>
                  </div>
                  <Link href={`/products/${product.id}`}><Button variant="outline" className="w-full rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider text-xs py-5">Xem chi tiết</Button></Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionHeading title="Tiện Ích Nổi Bật" subtitle="Dữ liệu tiện ích từ project_contents" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {amenities.slice(0, 2).map((item: any, index: number) => (
              <div key={`${item.name || item.title}-${index}`} className="relative h-96 overflow-hidden luxury-shadow group">
                <img src={amenityImages[index]?.url || (index === 0 ? `${import.meta.env.BASE_URL}images/amenity-pool.png` : `${import.meta.env.BASE_URL}images/amenity-clubhouse.png`)} alt={item.name || item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent flex flex-col justify-end p-8">
                  {index === 0 ? <Droplets className="w-10 h-10 text-accent mb-4" /> : <TreePine className="w-10 h-10 text-accent mb-4" />}
                  <h3 className="font-display text-3xl font-bold text-white mb-2">{item.name || item.title}</h3>
                  <p className="text-gray-300">{item.desc || item.description || item.area || "Tiện ích nội khu đồng bộ"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
