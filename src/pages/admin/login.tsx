import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: () => {
        setLocation("/admin");
      },
      onError: (error) => {
        setError("Thông tin đăng nhập không hợp lệ");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ data: { identifier, password } });
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

          <Button 
            type="submit" 
            className="w-full h-12 bg-accent hover:bg-primary text-white uppercase tracking-widest rounded-none mt-4 transition-colors"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </div>
    </div>
  );
}
