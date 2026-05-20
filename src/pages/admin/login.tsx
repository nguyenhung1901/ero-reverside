import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Turnstile } from "@marsidev/react-turnstile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const turnstileRef = useRef<any>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  const resetCaptcha = () => {
    setCaptchaToken(null);
    turnstileRef.current?.reset?.();
  };

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: (profile) => {
        queryClient.clear();
        queryClient.setQueryData(["/api/v1/admin/me"], profile);
        queryClient.invalidateQueries({ queryKey: ["/api/v1/admin/me"] });
        setLocation("/admin");
      },
      onError: (error) => {
        setError(error.message || "Thông tin đăng nhập không hợp lệ");
        resetCaptcha();
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!turnstileSiteKey) {
      setError("Thiếu VITE_TURNSTILE_SITE_KEY trong file .env của frontend.");
      return;
    }

    if (!captchaToken) {
      setError("Vui lòng xác minh CAPTCHA trước khi đăng nhập.");
      return;
    }

    loginMutation.mutate({ data: { identifier, password, captchaToken } as any });
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 shadow-2xl rounded-sm">
        <div className="text-center mb-10">
          <img
            src={`${import.meta.env.BASE_URL}images/logo.png`}
            alt="Logo"
            className="h-16 w-16 mx-auto mb-4"
          />
          <h1 className="font-display text-3xl font-bold text-primary tracking-widest uppercase">ERO CMS</h1>
          <p className="text-gray-500 mt-2 text-sm">Hệ thống quản trị nội dung</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm border border-red-200">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider">Email hoặc tên đăng nhập</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-10 h-12 rounded-none focus-visible:ring-accent"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 rounded-none focus-visible:ring-accent"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider">Xác minh bảo mật</label>
            <div className="min-h-[65px] flex items-center justify-center border border-gray-200 bg-gray-50 p-2">
              {turnstileSiteKey ? (
                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                />
              ) : (
                <p className="text-sm text-red-600 text-center">
                  Chưa cấu hình VITE_TURNSTILE_SITE_KEY trong frontend.
                </p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-accent hover:bg-primary text-white uppercase tracking-widest rounded-none mt-4 transition-colors"
            disabled={loginMutation.isPending || !captchaToken}
          >
            {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </div>
    </div>
  );
}
