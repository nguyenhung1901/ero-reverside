import { PublicLayout } from "@/components/layout/public-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateRegistration } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

const NEED_OPTIONS = ["Mua để ở", "Đầu tư", "Tìm hiểu thêm"] as const;
const phoneRegex = /^[0-9+\-\s().]+$/;
const normalizeSpaces = (value: string) => value.trim().replace(/\s+/g, " ");

const regSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(80, "Họ tên không được vượt quá 80 ký tự"),
  phone: z
    .string()
    .trim()
    .min(9, "Số điện thoại không hợp lệ")
    .max(20, "Số điện thoại không được vượt quá 20 ký tự")
    .regex(phoneRegex, "Số điện thoại chỉ được chứa số và các ký tự + - ( )")
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 9 && digits.length <= 15;
    }, "Số điện thoại phải có từ 9 đến 15 chữ số"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email không hợp lệ")
    .max(254, "Email không được vượt quá 254 ký tự"),
  need: z.enum(NEED_OPTIONS, {
    errorMap: () => ({ message: "Vui lòng chọn nhu cầu hợp lệ" }),
  }),
  note: z
    .string()
    .trim()
    .max(500, "Ghi chú không được vượt quá 500 ký tự")
    .optional(),
});

export default function RegisterPage() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const createReg = useCreateRegistration({
    mutation: {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: () => {
        toast({ title: "Lỗi", description: "Không thể gửi đăng ký. Vui lòng thử lại.", variant: "destructive" });
      }
    }
  });

  const form = useForm<z.infer<typeof regSchema>>({
    resolver: zodResolver(regSchema),
    defaultValues: { fullName: "", phone: "", email: "", need: "Mua để ở", note: "" }
  });

  const onSubmit = (values: z.infer<typeof regSchema>) => {
    createReg.mutate({
      data: {
        fullName: normalizeSpaces(values.fullName),
        phone: normalizeSpaces(values.phone),
        email: values.email.trim().toLowerCase(),
        need: values.need,
        note: values.note ? normalizeSpaces(values.note) : "",
      },
    });
  };

  return (
    <PublicLayout>
      <div className="relative min-h-[70vh] flex items-center py-24">
        {/* Background Image Unsplash */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=80" 
            alt="Interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 flex justify-center">
          <div className="bg-white max-w-2xl w-full p-8 md:p-12 luxury-shadow">
            {isSuccess ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="font-display text-3xl font-bold text-primary mb-4">Đăng ký thành công!</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Cảm ơn Quý khách đã quan tâm đến ERO Riverside. Chuyên viên tư vấn của chúng tôi sẽ liên hệ với Quý khách trong thời gian sớm nhất.
                </p>
                <Button 
                  onClick={() => {
                    form.reset();
                    setIsSuccess(false);
                  }}
                  className="bg-primary text-white rounded-none uppercase tracking-widest px-8"
                >
                  Đăng ký thêm
                </Button>
              </div>
            ) : (
              <>
                <SectionHeading title="Đăng Ký Tư Vấn" subtitle="Trở thành chủ nhân tinh hoa" className="mb-8" />
                <p className="text-center text-gray-500 mb-10">
                  Để lại thông tin để nhận bảng giá, chính sách bán hàng mới nhất và thư mời tham quan nhà mẫu.
                </p>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold uppercase tracking-wider text-xs">Họ và tên *</FormLabel>
                        <FormControl><Input placeholder="Nguyễn Văn A" maxLength={80} className="rounded-none border-gray-300 h-12 focus-visible:ring-accent" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-semibold uppercase tracking-wider text-xs">Số điện thoại *</FormLabel>
                          <FormControl><Input placeholder="0901234567" inputMode="tel" maxLength={20} className="rounded-none border-gray-300 h-12 focus-visible:ring-accent" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-semibold uppercase tracking-wider text-xs">Email *</FormLabel>
                          <FormControl><Input placeholder="email@domain.com" type="email" maxLength={254} className="rounded-none border-gray-300 h-12 focus-visible:ring-accent" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="need" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-semibold uppercase tracking-wider text-xs">Nhu cầu *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-none border-gray-300 h-12 focus-visible:ring-accent">
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
                        <FormLabel className="text-primary font-semibold uppercase tracking-wider text-xs">Ghi chú thêm</FormLabel>
                        <FormControl><Textarea placeholder="Yêu cầu cụ thể..." maxLength={500} className="rounded-none border-gray-300 focus-visible:ring-accent resize-none min-h-[100px]" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button 
                      type="submit" 
                      className="w-full bg-accent hover:bg-primary text-white rounded-none py-8 uppercase tracking-widest text-lg font-bold transition-colors duration-300 mt-4" 
                      disabled={createReg.isPending}
                    >
                      {createReg.isPending ? "Đang xử lý..." : "Gửi Đăng Ký"}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
