import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useCmsChangeOwnPassword,
  useCmsCreateUser,
  useCmsListUsers,
  useCmsUpdateUserProfile,
  useCmsUpdateUserStatus,
  useGetAdminMe,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Edit, KeyRound, Lock, RefreshCw, Unlock, UserPlus } from "lucide-react";

type CmsRole = "admin" | "editor";
type AccountStatus = "active" | "locked";

type UserRow = {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  role: CmsRole;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt?: string | null;
};

const PASSWORD_POLICY_TEXT = "Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";

function getPasswordPolicyError(password: string, label = "Mật khẩu") {
  if (!password || password.length < 8) return `${label} phải có ít nhất 8 ký tự`;
  if (!/[A-Z]/.test(password)) return `${label} phải có ít nhất 1 chữ hoa`;
  if (!/[a-z]/.test(password)) return `${label} phải có ít nhất 1 chữ thường`;
  if (!/[0-9]/.test(password)) return `${label} phải có ít nhất 1 số`;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return `${label} phải có ít nhất 1 ký tự đặc biệt`;
  return null;
}

const emptyCreateForm = {
  email: "",
  password: "",
  username: "",
  fullName: "",
  role: "editor" as CmsRole,
};

const emptyOwnPasswordForm = {
  currentPassword: "",
  password: "",
  confirmPassword: "",
};

function roleLabel(role: CmsRole) {
  return role === "admin" ? "Admin" : "Editor";
}

function statusLabel(status: AccountStatus) {
  return status === "active" ? "Hoạt động" : "Đã khóa";
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useCmsListUsers();
  const { data: me } = useGetAdminMe();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showOwnPasswordDialog, setShowOwnPasswordDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const [form, setForm] = useState(emptyCreateForm);
  const [ownPasswordForm, setOwnPasswordForm] = useState(emptyOwnPasswordForm);
  const [editForm, setEditForm] = useState({
    username: "",
    fullName: "",
    role: "editor" as CmsRole,
    status: "active" as AccountStatus,
  });

  const canManageUsers = me?.role === "admin";

  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/v1/cms/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/me"] });
    queryClient.refetchQueries({ queryKey: ["/api/v1/cms/users"] });
    queryClient.refetchQueries({ queryKey: ["/api/v1/admin/me"] });
  };

  const statusMut = useCmsUpdateUserStatus({
    mutation: {
      onSuccess: () => {
        refreshUsers();
        toast({ title: "Đã cập nhật trạng thái tài khoản" });
      },
      onError: (error) => {
        toast({ title: "Không thể cập nhật tài khoản", description: error.message, variant: "destructive" });
      },
    },
  });

  const createMut = useCmsCreateUser({
    mutation: {
      onSuccess: () => {
        setForm(emptyCreateForm);
        setShowCreateForm(false);
        refreshUsers();
        toast({ title: "Đã tạo tài khoản CMS mới" });
      },
      onError: (error) => {
        toast({ title: "Không thể tạo tài khoản mới", description: error.message, variant: "destructive" });
      },
    },
  });

  const updateProfileMut = useCmsUpdateUserProfile({
    mutation: {
      onSuccess: () => {
        setEditingUser(null);
        refreshUsers();
        toast({ title: "Đã cập nhật thông tin tài khoản" });
      },
      onError: (error) => {
        toast({ title: "Không thể sửa tài khoản", description: error.message, variant: "destructive" });
      },
    },
  });

  const changeOwnPasswordMut = useCmsChangeOwnPassword({
    mutation: {
      onSuccess: () => {
        setOwnPasswordForm(emptyOwnPasswordForm);
        setShowOwnPasswordDialog(false);
        toast({ title: "Đã đổi mật khẩu" });
      },
      onError: (error) => {
        toast({ title: "Không thể đổi mật khẩu", description: error.message, variant: "destructive" });
      },
    },
  });

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "locked" : "active";
    statusMut.mutate({ id, data: { status: newStatus as AccountStatus } });
  };

  const resetCreateForm = () => {
    setForm(emptyCreateForm);
  };

  const handleCloseCreateForm = () => {
    if (createMut.isPending) return;
    resetCreateForm();
    setShowCreateForm(false);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const passwordError = getPasswordPolicyError(form.password, "Mật khẩu ban đầu");
    if (passwordError) {
      toast({ title: passwordError, description: PASSWORD_POLICY_TEXT, variant: "destructive" });
      return;
    }
    createMut.mutate({ data: form });
  };

  const openEditDialog = (user: UserRow) => {
    setEditingUser(user);
    setEditForm({
      username: user.username || "",
      fullName: user.fullName || "",
      role: user.role,
      status: user.status,
    });
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateProfileMut.mutate({
      id: editingUser.id,
      data: {
        username: editForm.username.trim(),
        fullName: editForm.fullName.trim(),
        role: editForm.role,
        status: editForm.status,
      },
    });
  };

  const handleChangeOwnPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownPasswordForm.currentPassword) {
      toast({ title: "Vui lòng nhập mật khẩu hiện tại", variant: "destructive" });
      return;
    }
    const passwordError = getPasswordPolicyError(ownPasswordForm.password, "Mật khẩu mới");
    if (passwordError) {
      toast({ title: passwordError, description: PASSWORD_POLICY_TEXT, variant: "destructive" });
      return;
    }
    if (ownPasswordForm.currentPassword === ownPasswordForm.password) {
      toast({ title: "Mật khẩu mới không được trùng mật khẩu hiện tại", variant: "destructive" });
      return;
    }
    if (ownPasswordForm.password !== ownPasswordForm.confirmPassword) {
      toast({ title: "Hai mật khẩu nhập lại không khớp", variant: "destructive" });
      return;
    }
    changeOwnPasswordMut.mutate({ data: { currentPassword: ownPasswordForm.currentPassword, password: ownPasswordForm.password } });
  };

  const userCountLabel = useMemo(() => `${data?.total || 0} tài khoản`, [data?.total]);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quản Lý Tài Khoản CMS</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng số: {userCountLabel}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          
          <Button type="button" variant="outline" className="rounded-none" onClick={() => setShowOwnPasswordDialog(true)}>
            <KeyRound className="w-4 h-4 mr-2" />
            Đổi mật khẩu của tôi
          </Button>
        </div>
      </div>

      {!canManageUsers ? (
        <div className="bg-white border border-gray-200 p-6 text-sm text-gray-700">
          Bạn có thể đổi mật khẩu của chính mình bằng nút phía trên. Chỉ tài khoản <strong>admin</strong> mới được quản lý người dùng CMS.
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
              Admin có thể tạo, sửa thông tin và khóa/mở khóa tài khoản.
            </p>
            {!showCreateForm && (
              <Button
                type="button"
                className="rounded-none"
                onClick={() => setShowCreateForm(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Thêm tài khoản CMS
              </Button>
            )}
          </div>

          {showCreateForm && (
            <div className="bg-white border border-gray-200 p-6 mb-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-primary">Tạo tài khoản CMS mới</h2>
                </div>
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Mật khẩu ban đầu</label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={8}
                    title={PASSWORD_POLICY_TEXT}
                  />
                  <p className="mt-1 text-xs text-gray-500">{PASSWORD_POLICY_TEXT}</p>
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
                <div className="flex items-end gap-3">
                  <Button type="submit" className="rounded-none" disabled={createMut.isPending}>
                    {createMut.isPending ? "Đang tạo..." : "Tạo tài khoản"}
                  </Button>
                  <Button type="button" variant="outline" className="rounded-none" onClick={handleCloseCreateForm} disabled={createMut.isPending}>
                    Hủy
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-gray-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Họ tên</TableHead>
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
                  <TableRow><TableCell colSpan={8} className="text-center py-8">Đang tải...</TableCell></TableRow>
                ) : data?.users?.length ? data.users.map((user: UserRow) => {
                  const isSelf = me?.id === user.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-primary">{user.username}</TableCell>
                      <TableCell className="text-sm text-gray-600">{user.fullName || "-"}</TableCell>
                      <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-primary">{roleLabel(user.role)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-bold ${user.status === "active" ? "text-green-600" : "text-red-500"}`}>
                          {statusLabel(user.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm") : "Chưa đăng nhập"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">{format(new Date(user.createdAt), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => openEditDialog(user)}
                          title="Sửa tài khoản"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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
                }) : (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-gray-500">Chưa có tài khoản CMS.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={showOwnPasswordDialog} onOpenChange={(open) => { if (!changeOwnPasswordMut.isPending) setShowOwnPasswordDialog(open); }}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu của tôi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangeOwnPassword} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Mật khẩu hiện tại</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={ownPasswordForm.currentPassword}
                onChange={(e) => setOwnPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Mật khẩu mới</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={ownPasswordForm.password}
                onChange={(e) => setOwnPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                minLength={8}
                title={PASSWORD_POLICY_TEXT}
                required
              />
              <p className="mt-1 text-xs text-gray-500">{PASSWORD_POLICY_TEXT}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Nhập lại mật khẩu mới</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={ownPasswordForm.confirmPassword}
                onChange={(e) => setOwnPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                minLength={8}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-none" onClick={() => setShowOwnPasswordDialog(false)} disabled={changeOwnPasswordMut.isPending}>Hủy</Button>
              <Button type="submit" className="rounded-none" disabled={changeOwnPasswordMut.isPending}>{changeOwnPasswordMut.isPending ? "Đang đổi..." : "Đổi mật khẩu"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open && !updateProfileMut.isPending) setEditingUser(null); }}>
        <DialogContent className="rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa tài khoản CMS</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Email</label>
                <Input value={editingUser.email} disabled />
                <p className="text-xs text-gray-500 mt-1">Email đăng nhập Auth không sửa trực tiếp ở đây để tránh lệch với Supabase Auth.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Họ tên</label>
                <Input value={editForm.fullName} onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Tên đăng nhập</label>
                <Input value={editForm.username} onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Vai trò</label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value: CmsRole) => setEditForm((prev) => ({ ...prev, role: value }))}
                    disabled={me?.id === editingUser.id}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-primary mb-2">Trạng thái</label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value: AccountStatus) => setEditForm((prev) => ({ ...prev, status: value }))}
                    disabled={me?.id === editingUser.id}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="locked">Đã khóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" className="rounded-none" onClick={() => setEditingUser(null)} disabled={updateProfileMut.isPending}>Hủy</Button>
                <Button type="submit" className="rounded-none" disabled={updateProfileMut.isPending}>{updateProfileMut.isPending ? "Đang lưu..." : "Lưu thay đổi"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
