import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useCmsListCategories,
  useCmsCreateCategory,
  useCmsUpdateCategory,
  useCmsDeleteCategory,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, GripVertical, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const slugify = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const formSchema = z.object({
  name: z.string().min(1, "Bắt buộc"),
  slug: z.string().min(1, "Bắt buộc").regex(/^[a-z0-9-]+$/, "Chỉ được dùng chữ thường, số, dấu gạch ngang"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().min(0).default(0),
});

export default function AdminCategories() {
  const { data, isLoading } = useCmsListCategories();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", slug: "", description: "", sortOrder: 0 },
  });

  const nameValue = form.watch("name");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/v1/cms/categories"] });

  const createMut = useCmsCreateCategory({
    mutation: { onSuccess: () => { invalidate(); setIsModalOpen(false); toast({ title: "Đã thêm danh mục" }); } }
  });

  const updateMut = useCmsUpdateCategory({
    mutation: { onSuccess: () => { invalidate(); setIsModalOpen(false); toast({ title: "Đã cập nhật danh mục" }); } }
  });

  const deleteMut = useCmsDeleteCategory({
    mutation: { onSuccess: () => { invalidate(); toast({ title: "Đã xóa danh mục" }); } }
  });

  const openAdd = () => {
    setEditingId(null);
    form.reset({ name: "", slug: "", description: "", sortOrder: (data?.categories?.length || 0) });
    setIsModalOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    form.reset({ name: cat.name, slug: cat.slug, description: cat.description || "", sortOrder: cat.sortOrder });
    setIsModalOpen(true);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingId) {
      updateMut.mutate({ id: editingId, data: { name: values.name, description: values.description, sortOrder: values.sortOrder } });
    } else {
      createMut.mutate({ data: { projectId: 1, name: values.name, slug: values.slug, description: values.description, sortOrder: values.sortOrder } });
    }
  };

  const categories = data?.categories || [];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản lý Danh Mục</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng: {categories.length} danh mục sản phẩm</p>
        </div>
        <Button onClick={openAdd} className="bg-accent hover:bg-accent/90 rounded-none">
          <Plus className="w-4 h-4 mr-2" /> Thêm danh mục
        </Button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {categories.map((cat: any) => (
          <div key={cat.id} className="bg-white border border-gray-200 p-5 flex items-start justify-between hover:border-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-primary">{cat.name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">/{cat.slug}</p>
                {cat.description && <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{cat.description}</p>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={() => { if (confirm(`Xóa danh mục "${cat.name}"? Hành động này không thể hoàn tác.`)) deleteMut.mutate({ id: cat.id }); }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && categories.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400 border border-dashed border-gray-300">
            Chưa có danh mục nào. Nhấn "Thêm danh mục" để bắt đầu.
          </div>
        )}
        {isLoading && [1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-gray-200 p-5 h-20 animate-pulse" />
        ))}
      </div>

      {/* Table View */}
      <div className="bg-white border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Chi tiết danh mục</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Slug (URL)</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Thứ tự</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell></TableRow>
            ) : categories.sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((cat: any) => (
              <TableRow key={cat.id}>
                <TableCell className="font-mono text-xs text-gray-400">{cat.id}</TableCell>
                <TableCell className="font-semibold text-primary">{cat.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 text-gray-600">{cat.slug}</code>
                </TableCell>
                <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{cat.description || "—"}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-sm font-medium rounded-full">{cat.sortOrder}</span>
                </TableCell>
                <TableCell className="text-sm text-gray-400">
                  {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString("vi-VN") : "—"}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => { if (confirm(`Xóa danh mục "${cat.name}"?`)) deleteMut.mutate({ id: cat.id }); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && categories.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">Chưa có danh mục</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa Danh Mục" : "Thêm Danh Mục Mới"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên danh mục</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!editingId) form.setValue("slug", slugify(e.target.value));
                      }}
                      placeholder="Liền Kề, Shophouse, Biệt Thự..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL)</FormLabel>
                  <FormControl>
                    <div className="flex items-center border border-input rounded-none overflow-hidden">
                      <span className="bg-gray-50 text-gray-400 text-sm px-3 py-2 border-r border-input">/category/</span>
                      <Input
                        {...field}
                        className="border-0 rounded-none focus-visible:ring-0"
                        placeholder="lien-ke"
                        disabled={!!editingId}
                      />
                    </div>
                  </FormControl>
                  {editingId && <p className="text-xs text-gray-400">Slug không thể thay đổi sau khi tạo</p>}
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả <span className="text-gray-400">(tùy chọn)</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nhà liền kề mặt đường, diện tích 60–120m²..." />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="sortOrder" render={({ field }) => (
                <FormItem>
                  <FormLabel>Thứ tự hiển thị</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} className="w-24" />
                  </FormControl>
                  <p className="text-xs text-gray-400">Số nhỏ hơn hiển thị trước</p>
                </FormItem>
              )} />

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-none" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-primary text-white rounded-none" disabled={createMut.isPending || updateMut.isPending}>
                  {createMut.isPending || updateMut.isPending ? "Lưu..." : "Lưu"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
