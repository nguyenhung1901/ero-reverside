import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useListMedia, useCmsCreateMedia, useCmsDeleteMedia } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Play, Eye, EyeOff, Upload, FileVideo, Image as ImageIcon, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Bắt buộc"),
  type: z.enum(["image", "video"]),
  category: z.string().min(1, "Bắt buộc"),
  visibility: z.enum(["public", "private"]),
  description: z.string().optional(),
  externalUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

const VISIBILITY_LABELS: Record<string, { label: string; icon: any; class: string }> = {
  public: { label: "Công khai", icon: Eye, class: "bg-green-50 text-green-700 border-green-200" },
  private: { label: "Riêng tư", icon: EyeOff, class: "bg-orange-50 text-orange-700 border-orange-200" },
};

const isLikelyVideoFile = (value?: string | null) => !!value && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(value);

export default function AdminMedia() {
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const { data, isLoading } = useListMedia({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "image",
      category: "Phối cảnh",
      visibility: "public",
      description: "",
      externalUrl: "",
      thumbnailUrl: "",
    }
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/v1/media"] });

  const createMut = useCmsCreateMedia({
    mutation: {
      onSuccess: () => {
        invalidate();
        setIsOpen(false);
        setSelectedFile(null);
        toast({ title: "Đã thêm media" });
        form.reset();
      },
      onError: (error) => {
        toast({ title: "Không thể tải media lên", variant: "destructive" });
      }
    }
  });

  const deleteMut = useCmsDeleteMedia({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Đã xóa media" }); },
      onError: (error) => { toast({ title: "Không thể xóa media", variant: "destructive" }); }
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedFile && !values.externalUrl) {
      toast({ title: "Vui lòng chọn file tải lên hoặc nhập đường dẫn ngoài", variant: "destructive" });
      return;
    }
    if (values.type === "image" && !selectedFile) {
      toast({ title: "Media ảnh bắt buộc phải tải file lên storage", variant: "destructive" });
      return;
    }
    createMut.mutate({
      data: {
        ...values,
        file: selectedFile,
      } as any,
    });
  };

  const filteredMedia = useMemo(() => {
    return data?.media?.filter(m => {
      const visMatch = filterVisibility === "all" || m.visibility === filterVisibility;
      const typeMatch = filterType === "all" || m.type === filterType;
      return visMatch && typeMatch;
    }) || [];
  }, [data?.media, filterVisibility, filterType]);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản lý Media</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng: {data?.total || 0} file media</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setSelectedFile(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 rounded-none">
              <Plus className="w-4 h-4 mr-2" /> Tải media lên
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none max-w-2xl">
            <DialogHeader><DialogTitle>Thêm Media Mới</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <fieldset disabled={createMut.isPending} className="space-y-4 disabled:opacity-70">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="image">Hình ảnh</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Danh mục</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Phối cảnh">Phối cảnh</SelectItem>
                          <SelectItem value="Mặt bằng">Mặt bằng</SelectItem>
                          <SelectItem value="Tiện ích">Tiện ích</SelectItem>
                          <SelectItem value="Thực tế">Thực tế</SelectItem>
                          <SelectItem value="Video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="visibility" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quyền truy cập</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="public">Công khai — lưu ở bucket ero-public</SelectItem>
                        <SelectItem value="private">Riêng tư — lưu ở bucket ero-private</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <div className="space-y-2">
                  <Label htmlFor="media-file">Tải file lên Storage</Label>
                  <div className="border border-dashed border-gray-300 p-4 bg-gray-50">
                    <Input
                      id="media-file"
                      type="file"
                      accept={form.watch("type") === "image" ? "image/*" : "video/*,image/*"}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    {selectedFile && <p className="text-xs text-primary mt-2">Đã chọn: {selectedFile.name}</p>}
                  </div>
                </div>

                <FormField control={form.control} name="externalUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đường dẫn ngoài (tùy chọn, dành cho video nhúng)</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail video (tùy chọn)</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Ghi chú</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                </fieldset>
                <Button type="submit" className="w-full bg-primary rounded-none" disabled={createMut.isPending}>
                  {createMut.isPending ? "Đang lưu..." : "Lưu media"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex gap-1">
          {["all", "image", "video"].map(t => (
            <Button key={t} size="sm" variant={filterType === t ? "default" : "outline"} className="rounded-none" onClick={() => setFilterType(t)}>
              {t === "all" ? "Tất cả" : t === "image" ? "Hình ảnh" : "Video"}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "public", "private"].map(v => (
            <Button key={v} size="sm" variant={filterVisibility === v ? "default" : "outline"} className="rounded-none" onClick={() => setFilterVisibility(v)}>
              {v === "all" ? "Tất cả" : VISIBILITY_LABELS[v]?.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredMedia.map((m) => {
            const vis = VISIBILITY_LABELS[m.visibility] || VISIBILITY_LABELS.public;
            const VisIcon = vis.icon;
            const previewSrc = m.thumbnailUrl || m.url;
            return (
              <div key={m.id} className="group relative aspect-square bg-gray-100 border border-gray-200 overflow-hidden">
                {previewSrc && !isLikelyVideoFile(previewSrc) ? (
                  <img src={previewSrc} className="w-full h-full object-cover" alt={m.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                    {m.type === "video" ? <FileVideo className="w-10 h-10" /> : <ImageIcon className="w-10 h-10" />}
                  </div>
                )}
                {m.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="text-white w-8 h-8" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 border ${vis.class}`}>
                    <VisIcon className="w-3 h-3" /> {vis.label}
                  </span>
                </div>
                <div className="absolute inset-0 bg-primary/85 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-white font-bold text-sm line-clamp-2">{m.title}</p>
                  <p className="text-accent text-xs mt-1">{m.category}</p>
                  <p className="text-gray-200 text-[11px] mt-2">{m.storageBucket ? `Storage: ${m.storageBucket}` : "Nguồn ngoài"}</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-4 rounded-none"
                    onClick={() => { if (confirm("Xóa media này?")) deleteMut.mutate({ id: m.id }); }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Xóa
                  </Button>
                </div>
              </div>
            );
          })}
          {filteredMedia.length === 0 && (
            <div className="col-span-4 text-center py-16 text-gray-500 border border-dashed border-gray-200">
              Không có file media nào
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
