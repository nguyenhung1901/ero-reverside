import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone, Mail, MapPin, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Trang chủ", path: "/" },
    { name: "Tổng quan", path: "/about" },
    { name: "Sản phẩm", path: "/products" },
    { name: "Bản đồ & Sơ đồ", path: "/map" },
    { name: "Thư viện", path: "/gallery" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Main Navbar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-md py-3" : "bg-white/95 backdrop-blur-md py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={`${import.meta.env.BASE_URL}images/logo.png`}
              alt="ERO Riverside Logo"
              className="h-10 w-10 md:h-12 md:w-12 object-contain group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl md:text-2xl text-primary leading-none uppercase tracking-widest">
                ERO
              </span>
              <span className="text-[10px] md:text-xs text-accent tracking-[0.3em] uppercase font-semibold">
                Riverside
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm uppercase tracking-wider font-semibold hover:text-accent transition-colors ${
                  location === link.path ? "text-accent" : "text-primary"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-none px-8 py-6 text-sm uppercase tracking-wider group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Đăng ký tư vấn
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-primary p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 pb-6 flex flex-col lg:hidden"
          >
            <nav className="flex flex-col gap-6 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`text-2xl font-display font-semibold border-b border-gray-100 pb-4 ${
                    location === link.path ? "text-accent" : "text-primary"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link href="/register" className="mt-4">
                <Button className="w-full bg-accent hover:bg-accent/90 text-white py-6 text-lg uppercase tracking-wider">
                  Đăng ký tư vấn ngay
                </Button>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground pt-16 pb-8 border-t-4 border-accent">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <img
                  src={`${import.meta.env.BASE_URL}images/logo.png`}
                  alt="ERO Riverside Logo"
                  className="h-12 w-12 object-contain"
                />
                <div className="flex flex-col">
                  <span className="font-display font-bold text-2xl text-white leading-none uppercase tracking-widest">
                    ERO
                  </span>
                  <span className="text-xs text-accent tracking-[0.3em] uppercase font-semibold">
                    Riverside
                  </span>
                </div>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Khu đô thị sinh thái thông minh ven sông, mang đến không gian sống đẳng cấp,
                hòa mình cùng thiên nhiên với hệ thống tiện ích chuẩn 5 sao.
              </p>
            </div>

            <div>
              <h4 className="font-display font-bold text-lg text-white mb-6 uppercase tracking-wider relative inline-block">
                Liên hệ
                <span className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-accent"></span>
              </h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <span>Phường Phù Chẩn, TP. Từ Sơn, tỉnh Bắc Ninh</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-accent shrink-0" />
                  <span>090 123 4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-accent shrink-0" />
                  <span>contact@eroriverside.com</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-lg text-white mb-6 uppercase tracking-wider relative inline-block">
                Sản phẩm
                <span className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-accent"></span>
              </h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <Link href="/products?type=biet-thu" className="hover:text-accent transition-colors">Biệt thự ven sông</Link>
                </li>
                <li>
                  <Link href="/products?type=shophouse" className="hover:text-accent transition-colors">Shophouse thương mại</Link>
                </li>
                <li>
                  <Link href="/products?type=lien-ke" className="hover:text-accent transition-colors">Nhà phố liền kề</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-lg text-white mb-6 uppercase tracking-wider relative inline-block">
                Đăng ký nhận tin
                <span className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-accent"></span>
              </h4>
              <p className="text-gray-400 text-sm mb-4">Để lại email để nhận thông tin mới nhất về dự án và các chính sách ưu đãi.</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Email của bạn" 
                  className="bg-white/10 border border-white/20 text-white px-4 py-2 w-full focus:outline-none focus:border-accent text-sm"
                />
                <button className="bg-accent hover:bg-accent/90 text-primary px-4 py-2 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} ERO Riverside. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/admin/login" className="hover:text-white transition-colors">Admin Portal</Link>
              <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
              <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
