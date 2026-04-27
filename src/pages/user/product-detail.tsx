import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { PublicLayout } from "@/components/layout/public-layout";
import { useGetProduct, useCreateRegistration } from "@/lib/api-client";
import { Maximize, BedDouble, Bath, Layers, ShieldCheck, ArrowLeft, CheckCircle, Phone, Mail, Clock, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const regSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z.string().min(9, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ"),
  need: z.string().min(1, "Vui lòng chọn nhu cầu"),
  note: z.string().optional(),
});

function SuccessScreen({ fullName, phone, onClose }: { fullName: string; phone: string; onClose: () => void }) {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Decorative gold rays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/4 left-1/2 origin-bottom opacity-10"
            style={{
              width: "2px",
              height: "200px",
              background: "linear-gradient(to top, transparent, #C5963A)",
              transform: `translateX(-50%) rotate(${i * 45}deg)`,
              animation: `rayExpand 1s ease-out ${i * 0.08}s both`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="bg-gradient-to-b from-[#0D1B2E] to-[#162340] px-8 pt-10 pb-8 text-center relative">
        {/* Animated checkmark */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div
            className="w-24 h-24 rounded-full border-4 border-[#C5963A]/30 flex items-center justify-center"
            style={{ animation: "pulseRing 2s ease-in-out infinite" }}
          >
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C5963A] to-[#E8B84B] flex items-center justify-center shadow-lg"
              style={{ animation: "scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both" }}
            >
              <CheckCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          </div>
          {/* Floating stars */}
          {["-top-2 left-2", "top-0 right-0", "-bottom-1 right-3", "-bottom-2 left-6"].map((pos, i) => (
            <Star
              key={i}
              className={`absolute ${pos} w-4 h-4 text-[#C5963A] fill-[#C5963A]`}
              style={{ animation: `starFloat 0.6s ease-out ${0.4 + i * 0.1}s both` }}
            />
          ))}
        </div>

        <h2
          className="font-display text-3xl font-bold text-white mb-2"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.3s both" }}
        >
          Đăng Ký Thành Công!
        </h2>
        <p
          className="text-[#C5963A] text-sm font-medium tracking-widest uppercase"
          style={{ animation: "fadeSlideUp 0.5s ease-out 0.4s both" }}
        >
          ERO Riverside xin trân trọng cảm ơn
        </p>
      </div>

      {/* Content */}
      <div className="px-8 py-8" style={{ animation: "fadeSlideUp 0.5s ease-out 0.5s both" }}>
        {/* Personal greeting */}
        <p className="text-gray-700 text-center mb-6 text-base leading-relaxed">
          Xin chào <span className="font-semibold text-[#0D1B2E]">{fullName}</span>,<br />
          thông tin của quý khách đã được ghi nhận thành công.
        </p>

        {/* What happens next */}
        <div className="bg-gray-50 border border-gray-100 p-5 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Các bước tiếp theo</p>
          <div className="space-y-4">
            {[
              { icon: Phone, color: "text-[#C5963A]", bg: "bg-[#C5963A]/10", time: "Trong vòng 24 giờ", label: "Chuyên viên tư vấn sẽ liên hệ qua số " + phone },
              { icon: Clock, color: "text-blue-600", bg: "bg-blue-50", time: "Trong 2–3 ngày làm việc", label: "Quý khách nhận được bảng giá chi tiết và chính sách ưu đãi" },
              { icon: Mail, color: "text-green-600", bg: "bg-green-50", time: "Sau khi liên hệ", label: "Email xác nhận và tài liệu dự án sẽ được gửi đến hộp thư" },
            ].map(({ icon: Icon, color, bg, time, label }, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wider ${color} mb-0.5`}>{time}</p>
                  <p className="text-sm text-gray-600 leading-snug">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotline reminder */}
        <div className="flex items-center justify-center gap-3 bg-[#0D1B2E] text-white px-5 py-3 mb-6">
          <Phone className="w-4 h-4 text-[#C5963A]" />
          <span className="text-sm">Hotline hỗ trợ 24/7:</span>
          <a href="tel:0901234567" className="font-bold text-[#C5963A] tracking-wider">090 123 4567</a>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-none border-gray-300 text-gray-600 hover:bg-gray-50 py-5"
          >
            Đóng
          </Button>
          <Link href="/products" className="flex-1">
            <Button className="w-full bg-[#C5963A] hover:bg-[#b08530] text-white rounded-none py-5 font-semibold uppercase tracking-wider">
              Xem sản phẩm khác
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes starFloat {
          from { opacity: 0; transform: scale(0) rotate(-30deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes rayExpand {
          from { opacity: 0; transform: translateX(-50%) rotate(var(--r, 0deg)) scaleY(0); }
          to { opacity: 0.1; transform: translateX(-50%) rotate(var(--r, 0deg)) scaleY(1); }
        }
      `}</style>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { data: product, isLoading, isError } = useGetProduct(id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const productGallery = useMemo(() => {
    if (!product) return [] as Array<{ id: number | string; title: string; url: string }>;
    const items: Array<{ id: number | string; title: string; url: string }> = [];
    const seen = new Set<string>();

    if (product.imageUrl) {
      items.push({ id: product.coverMediaId || 'cover', title: product.name, url: product.imageUrl });
      seen.add(product.imageUrl);
    }

    for (const media of product.gallery || []) {
      if (media?.url && !seen.has(media.url)) {
        items.push({ id: media.id, title: media.title, url: media.url });
        seen.add(media.url);
      }
    }

    return items;
  }, [product]);

  useEffect(() => {
    setSelectedImageUrl(productGallery[0]?.url || null);
  }, [productGallery]);

  const createReg = useCreateRegistration({
    mutation: {
      onSuccess: () => {
        setSubmittedName(form.getValues("fullName"));
        setSubmittedPhone(form.getValues("phone"));
        setSubmitted(true);
      },
      onError: () => {},
    }
  });

  const form = useForm<z.infer<typeof regSchema>>({
    resolver: zodResolver(regSchema),
    defaultValues: { fullName: "", phone: "", email: "", need: "Mua để ở", note: "" }
  });

  const onSubmit = (values: z.infer<typeof regSchema>) => {
    createReg.mutate({ data: values });
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSubmitted(false);
      form.reset();
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-8 rounded-none" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="h-[500px] w-full rounded-none" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4 rounded-none" />
              <Skeleton className="h-6 w-1/4 rounded-none" />
              <Skeleton className="h-24 w-full rounded-none" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full rounded-none" />
                <Skeleton className="h-16 w-full rounded-none" />
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (isError || !product) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Không tìm thấy sản phẩm</h2>
          <Link href="/products">
            <Button className="bg-accent text-white rounded-none">Quay lại danh sách</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-gray-50 py-6 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <Link href="/products" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4 mr-2" /> Trở về danh sách
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Images */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] w-full mb-4 bg-gray-100 group overflow-hidden border border-gray-100">
              {selectedImageUrl ? (
                <img
                  src={selectedImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                  Sản phẩm chưa có ảnh trong thư viện media
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 shadow-md">
                  {product.categoryName}
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 shadow-md ${
                  product.status === 'available' ? 'bg-green-500 text-white' :
                  product.status === 'sold' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                }`}>
                  {product.status === 'available' ? 'Còn hàng' : product.status === 'sold' ? 'Đã bán' : 'Giữ chỗ'}
                </span>
              </div>
            </div>

            {productGallery.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {productGallery.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => setSelectedImageUrl(media.url)}
                    className={`border overflow-hidden transition ${selectedImageUrl === media.url ? 'border-primary ring-1 ring-primary' : 'border-gray-200 hover:border-primary/40'}`}
                  >
                    <img src={media.url} className="w-full aspect-[4/3] object-cover hover:opacity-90 transition cursor-pointer" alt={media.title || product.name} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 bg-gray-50">
                Chưa có ảnh mô tả bổ sung cho sản phẩm này.
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-5 flex flex-col">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">{product.name}</h1>
            <div className="font-display text-4xl font-bold text-accent mb-8">
              {product.price} <span className="text-xl text-gray-500 font-sans">tỷ VND</span>
            </div>

            <div className="bg-white border border-gray-100 p-6 mb-8 luxury-shadow">
              <h3 className="font-semibold text-primary uppercase tracking-wider text-sm mb-4 border-b border-gray-100 pb-3">Thông số kỹ thuật</h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-accent">
                    <Maximize className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Diện tích</p>
                    <p className="font-semibold text-primary">{product.area} m²</p>
                  </div>
                </div>
                {product.floor && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-accent">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Số tầng</p>
                      <p className="font-semibold text-primary">{product.floor}</p>
                    </div>
                  </div>
                )}
                {product.bedrooms && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-accent">
                      <BedDouble className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Phòng ngủ</p>
                      <p className="font-semibold text-primary">{product.bedrooms}</p>
                    </div>
                  </div>
                )}
                {product.bathrooms && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-accent">
                      <Bath className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Phòng tắm</p>
                      <p className="font-semibold text-primary">{product.bathrooms}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8 flex-grow">
              <h3 className="font-semibold text-primary uppercase tracking-wider text-sm mb-4">Mô tả sản phẩm</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>

              {product.features && product.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-primary uppercase tracking-wider text-sm mb-4">Điểm nổi bật</h3>
                  <ul className="space-y-2">
                    {product.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600">
                        <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white text-lg py-8 rounded-none uppercase tracking-widest font-semibold luxury-shadow"
              disabled={product.status === 'sold'}
              onClick={() => { setDialogOpen(true); setSubmitted(false); form.reset(); }}
            >
              {product.status === 'sold' ? 'Đã bán' : 'Đăng ký tư vấn ngay'}
            </Button>
          </div>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-none">
          {submitted ? (
            <SuccessScreen
              fullName={submittedName}
              phone={submittedPhone}
              onClose={() => handleOpenChange(false)}
            />
          ) : (
            <>
              <div className="bg-primary p-6 text-center">
                <DialogTitle className="text-2xl font-display font-bold text-white mb-2">Đăng Ký Tư Vấn</DialogTitle>
                <p className="text-gray-300 text-sm">Sản phẩm: {product.name}</p>
              </div>
              <div className="p-6 bg-white">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold">Họ và tên *</FormLabel>
                        <FormControl><Input placeholder="Nhập họ tên" className="rounded-none border-gray-300 focus-visible:ring-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-semibold">Số điện thoại *</FormLabel>
                          <FormControl><Input placeholder="Nhập SĐT" className="rounded-none border-gray-300 focus-visible:ring-accent" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-semibold">Email *</FormLabel>
                          <FormControl><Input placeholder="Nhập Email" className="rounded-none border-gray-300 focus-visible:ring-accent" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="need" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold">Nhu cầu *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-none border-gray-300 focus-visible:ring-accent">
                              <SelectValue placeholder="Chọn nhu cầu" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mua để ở">Mua để ở</SelectItem>
                            <SelectItem value="Đầu tư">Đầu tư</SelectItem>
                            <SelectItem value="Tìm hiểu thêm">Tìm hiểu thêm</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="note" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold">Ghi chú thêm</FormLabel>
                        <FormControl><Textarea placeholder="..." className="rounded-none border-gray-300 focus-visible:ring-accent resize-none" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/90 text-white rounded-none py-6 uppercase tracking-widest mt-4"
                      disabled={createReg.isPending}
                    >
                      {createReg.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang gửi...
                        </span>
                      ) : "Gửi thông tin"}
                    </Button>
                  </form>
                </Form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
