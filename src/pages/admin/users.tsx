import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useCmsListUsers, useCmsUpdateUserStatus, useCmsCreateUser, useCmsUpdateUserRole, useGetAdminMe } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Lock, Unlock , RefreshCw, UserPlus } from "lucide-react";

type CmsRole = "admin" | "editor";

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useCmsListUsers();
  const { data: me } = useGetAdminMe();

  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    fullName: "",
    role: "editor" as CmsRole,
  });

  const canManageUsers = me?.role === "admin";

  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/v1/cms/users"] });
  };

  const statusMut = useCmsUpdateUserStatus({
    mutation: {
      onSuccess: () => {
        refreshUsers();
        toast({ title: "Đã cập nhật trạng thái tài khoản" });
      },
      onError: (error) => {
        toast({ title: "Không thể cập nhật tài khoản", variant: "destructive" });
      },
    }
  });

  const roleMut = useCmsUpdateUserRole({
    mutation: {
      onSuccess: () => {
        refreshUsers();
        toast({ title: "Đã cập nhật vai trò tài khoản" });
      },
      onError: (error) => {
        toast({ title: "Không thể cập nhật vai trò", variant: "destructive" });
      },
    }
  });

  const createMut = useCmsCreateUser({
    mutation: {
      onSuccess: () => {
        setForm({ email: "", password: "", username: "", fullName: "", role: "editor" });
        refreshUsers();
        toast({ title: "Đã tạo tài khoản CMS mới" });
      },
      onError: (error) => {
        toast({ title: "Không thể tạo tài khoản mới", variant: "destructive" });
      },
    }
  });

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "locked" : "active";
    statusMut.mutate({ id, data: { status: newStatus as "active" | "locked" } });
  };

  const handleRoleChange = (id: string, role: CmsRole) => {
    roleMut.mutate({ id, data: { role } });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ data: form });
  };

  const userCountLabel = useMemo(() => `${data?.total || 0} tài khoản`, [data?.total]);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản Lý Tài Khoản CMS</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng số: {userCountLabel}</p>
        </div>
        <Button variant="outline" className="rounded-none" onClick={refreshUsers}>
          <RefreshCw className="w-4 h-4 mr-2" /> Tải lại
        </Button>
      </div>

      {!canManageUsers ? (
        <div className="bg-white border border-gray-200 p-6 text-sm text-gray-700">
          Chỉ tài khoản <strong>admin</strong> mới được quản lý người dùng CMS.
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">Tạo tài khoản CMS mới</h2>
            </div>

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Họ tên</label>
                <Input value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Tên đăng nhập</label>
                <Input value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Email</label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Mật khẩu</label>
                <Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required minLength={8} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Vai trò</label>
                <Select value={form.role} onValueChange={(value: CmsRole) => setForm((prev) => ({ ...prev, role: value }))}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="rounded-none" disabled={createMut.isPending}>
                  {createMut.isPending ? "Đang tạo..." : "Tạo tài khoản"}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Lần đăng nhập cuối</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Đang tải...</TableCell></TableRow>
                ) : data?.users?.map((user) => {
                  const isSelf = me?.id === user.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-primary">{user.username}</TableCell>
                      <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: CmsRole) => handleRoleChange(user.id, value)}
                          disabled={isSelf || roleMut.isPending}
                        >
                          <SelectTrigger className="rounded-none h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-bold ${user.status === "active" ? "text-green-600" : "text-red-500"}`}>
                          {user.status === "active" ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm") : "Chưa đăng nhập"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{format(new Date(user.createdAt), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={user.status === "active" ? "text-orange-500 hover:text-orange-700" : "text-green-500 hover:text-green-700"}
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          disabled={isSelf || statusMut.isPending}
                        >
                          {user.status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
