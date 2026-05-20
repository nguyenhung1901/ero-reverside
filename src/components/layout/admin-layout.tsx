import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building2,
  Image as ImageIcon,
  Users,
  ActivitySquare,
  LogOut,
  Menu,
  UserCog,
  Tag
} from "lucide-react";
import { useGetAdminMe, useAdminLogout, useCmsChangeOwnPassword } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: admin, isLoading, isFetching, isError } = useGetAdminMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastActivityRef = useRef(Date.now());
  const timedOutRef = useRef(false);
  const [forcePasswordForm, setForcePasswordForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [forcePasswordError, setForcePasswordError] = useState("");

  const logoutMutation = useAdminLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(["/api/v1/admin/me"], null);
        queryClient.removeQueries({ queryKey: ["/api/v1/admin/me"] });
        setLocation("/admin/login");
      }
    }
  });

  const changeOwnPasswordMutation = useCmsChangeOwnPassword({
    mutation: {
      onSuccess: async () => {
        setForcePasswordForm({ currentPassword: "", password: "", confirmPassword: "" });
        setForcePasswordError("");
        toast({ title: "Đã đổi mật khẩu", description: "Bạn có thể tiếp tục sử dụng hệ thống quản trị." });
        await queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/me"] });
        await queryClient.refetchQueries({ queryKey: ["/api/v1/admin/me"] });
      },
      onError: (error) => {
        setForcePasswordError(error.message || "Không thể đổi mật khẩu");
      },
    },
  });

  const isCheckingAuth = isLoading || (!admin && isFetching);

  useEffect(() => {
    if (!isCheckingAuth && (isError || !admin)) {
      setLocation("/admin/login");
    }
  }, [isCheckingAuth, isError, admin, setLocation]);

  useEffect(() => {
    if (!admin) return;

    const markActivity = () => {
      lastActivityRef.current = Date.now();
      timedOutRef.current = false;
    };

    const onTimeout = () => {
      if (timedOutRef.current) return;
      timedOutRef.current = true;
      toast({
        title: "Phiên quản trị đã hết hạn",
        description: "Bạn đã không thao tác trong 15 phút. Hệ thống sẽ đăng xuất để bảo vệ phiên làm việc.",
      });
      logoutMutation.mutate();
    };

    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart", "focus"];
    events.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));

    const timer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS) {
        onTimeout();
      }
    }, 30000);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      window.clearInterval(timer);
    };
  }, [admin, logoutMutation, toast]);
  const handleForceChangePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForcePasswordError("");
    if (!forcePasswordForm.currentPassword) {
      setForcePasswordError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (forcePasswordForm.password !== forcePasswordForm.confirmPassword) {
      setForcePasswordError("Hai mật khẩu mới không khớp");
      return;
    }
    changeOwnPasswordMutation.mutate({
      data: {
        currentPassword: forcePasswordForm.currentPassword,
        password: forcePasswordForm.password,
      },
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !admin) {
    return null;
  }

  if (admin.mustChangePassword) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white p-8 shadow-2xl rounded-sm">
          <div className="mb-8 text-center">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.png`}
              alt="ERO Riverside Logo"
              className="h-14 w-14 mx-auto mb-4 object-contain"
            />
            <h1 className="font-display text-2xl font-bold text-primary uppercase tracking-widest">Đổi mật khẩu bắt buộc</h1>
            <p className="mt-2 text-sm text-gray-600">
              Tài khoản của bạn đang sử dụng mật khẩu tạm thời. Vui lòng đổi mật khẩu trước khi tiếp tục sử dụng CMS.
            </p>
          </div>

          <form onSubmit={handleForceChangePassword} className="space-y-5" autoComplete="off">
            {forcePasswordError && (
              <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-600">{forcePasswordError}</div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider">Mật khẩu hiện tại</label>
              <Input
                type="password"
                value={forcePasswordForm.currentPassword}
                onChange={(event) => setForcePasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider">Mật khẩu mới</label>
              <Input
                type="password"
                value={forcePasswordForm.password}
                onChange={(event) => setForcePasswordForm((prev) => ({ ...prev, password: event.target.value }))}
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-gray-500">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary uppercase tracking-wider">Nhập lại mật khẩu mới</label>
              <Input
                type="password"
                value={forcePasswordForm.confirmPassword}
                onChange={(event) => setForcePasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending || changeOwnPasswordMutation.isPending}
              >
                Đăng xuất
              </Button>
              <Button
                type="submit"
                className="rounded-none"
                disabled={changeOwnPasswordMutation.isPending}
              >
                {changeOwnPasswordMutation.isPending ? "Đang đổi mật khẩu..." : "Đổi mật khẩu và tiếp tục"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = admin.role === "admin";

  const navItems = [
    { name: "Tổng quan", path: "/admin", icon: LayoutDashboard },
    { name: "Danh mục", path: "/admin/categories", icon: Tag },
    { name: "Sản phẩm", path: "/admin/products", icon: Building2 },
    { name: "Media", path: "/admin/media", icon: ImageIcon },
    { name: "Khách hàng", path: "/admin/registrations", icon: Users },
    ...(isAdmin ? [
      { name: "Tài khoản", path: "/admin/users", icon: UserCog },
      { name: "Nhật ký", path: "/admin/logs", icon: ActivitySquare },
    ] : []),
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-primary text-primary-foreground">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}images/logo.png`}
            alt="ERO Riverside Logo"
            className="h-8 w-8 object-contain"
          />
          <span className="font-display font-bold text-xl uppercase tracking-widest text-white">
            ERO <span className="text-accent">CMS</span>
          </span>
        </Link>
      </div>
      <div className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path !== '/admin' && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                isActive ? "bg-accent text-primary font-medium" : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}>
                <item.icon className="w-5 h-5" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
            {admin.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{admin.username}</p>
            <p className="text-xs text-gray-400">{admin.role === "admin" ? "Administrator" : "Editor"}</p>
          </div>
        </div>
        <p className="px-4 pb-2 text-[11px] text-gray-400">Tự động đăng xuất sau 15 phút không hoạt động</p>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:block w-64 fixed inset-y-0 left-0 z-20">
        <Sidebar />
      </aside>

      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="h-8 w-8" />
            <span className="font-display font-bold text-lg text-primary">ERO CMS</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-primary border-none">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </header>

        <div className="flex-1 p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
