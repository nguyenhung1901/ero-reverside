import { useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { useListProducts, useListProjectCategories } from "@/lib/api-client";
import { Link } from "wouter";
import { Maximize, Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsPage() {
  const [filters, setFilters] = useState({
    categorySlug: "",
    status: "",
    search: "",
    minPrice: "",
    maxPrice: ""
  });

  const { data: categoriesData } = useListProjectCategories("ero-riverside");

  const queryParams: any = {};
  if (filters.categorySlug && filters.categorySlug !== "all") queryParams.categorySlug = filters.categorySlug;
  if (filters.status && filters.status !== "all") queryParams.status = filters.status as any;
  if (filters.search) queryParams.search = filters.search;
  if (filters.minPrice) queryParams.minPrice = Number(filters.minPrice);
  if (filters.maxPrice) queryParams.maxPrice = Number(filters.maxPrice);

  const { data, isLoading } = useListProducts(queryParams);

  const handleReset = () => {
    setFilters({ categorySlug: "", status: "", search: "", minPrice: "", maxPrice: "" });
  };

  const getStatusLabel = (status: string) => {
    if (status === "available") return "Còn hàng";
    if (status === "sold") return "Đã bán";
    return "Giữ chỗ";
  };

  const getStatusClass = (status: string) => {
    if (status === "available") return "bg-green-500 text-white";
    if (status === "sold") return "bg-red-500 text-white";
    return "bg-yellow-500 text-white";
  };

  const formatPrice = (price: string | number) => {
    const num = parseFloat(String(price));
    if (num >= 1) return `${num} tỷ`;
    return `${(num * 1000).toFixed(0)} triệu`;
  };

  return (
    <PublicLayout>
      <div className="bg-primary text-white py-16 md:py-24 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Sản Phẩm ERO Riverside</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">Lựa chọn không gian sống lý tưởng phù hợp với phong cách của bạn</p>
        {categoriesData?.categories && (
          <div className="flex gap-3 justify-center mt-8 flex-wrap">
            <button
              onClick={() => setFilters(f => ({ ...f, categorySlug: "" }))}
              className={`px-5 py-2 text-sm font-semibold uppercase tracking-wider border transition-colors ${!filters.categorySlug ? "bg-accent border-accent text-white" : "border-white/40 text-white/70 hover:border-white hover:text-white"}`}
            >
              Tất Cả
            </button>
            {categoriesData.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilters(f => ({ ...f, categorySlug: cat.slug }))}
                className={`px-5 py-2 text-sm font-semibold uppercase tracking-wider border transition-colors ${filters.categorySlug === cat.slug ? "bg-accent border-accent text-white" : "border-white/40 text-white/70 hover:border-white hover:text-white"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-1/4">
          <div className="bg-white p-6 border border-gray-100 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-xl text-primary">Bộ lọc</h3>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-gray-500 hover:text-primary">
                <FilterX className="w-4 h-4 mr-2" /> Xóa lọc
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 block">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tên sản phẩm..."
                    className="pl-9 rounded-none border-gray-200 focus-visible:ring-accent"
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 block">Loại sản phẩm</label>
                <Select value={filters.categorySlug} onValueChange={(val) => setFilters(f => ({ ...f, categorySlug: val }))}>
                  <SelectTrigger className="rounded-none border-gray-200">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {categoriesData?.categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 block">Trạng thái</label>
                <Select value={filters.status} onValueChange={(val) => setFilters(f => ({ ...f, status: val }))}>
                  <SelectTrigger className="rounded-none border-gray-200">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="available">Còn hàng</SelectItem>
                    <SelectItem value="reserved">Đang giữ chỗ</SelectItem>
                    <SelectItem value="sold">Đã bán</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 block">Khoảng giá (Tỷ VND)</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Từ"
                    className="rounded-none border-gray-200"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    placeholder="Đến"
                    className="rounded-none border-gray-200"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="w-full lg:w-3/4">
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-500 font-medium">
              Tìm thấy <span className="text-primary font-bold">{data?.total || 0}</span> sản phẩm
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="border border-gray-100">
                  <Skeleton className="h-64 w-full rounded-none" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between pt-4">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-6 w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : data?.products && data.products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.products.map((product) => (
                <div key={product.id} className="group border border-gray-100 bg-white hover:luxury-shadow transition-all duration-300 flex flex-col h-full">
                  <div className="relative h-64 overflow-hidden bg-gray-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 bg-gray-50 border-b border-gray-100">
                        Chưa có ảnh sản phẩm
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 shadow-md">
                        {product.categoryName}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 shadow-md ${getStatusClass(product.status)}`}>
                        {getStatusLabel(product.status)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="font-display text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Maximize className="w-4 h-4 text-accent" />
                        <span className="font-medium">{product.area} m²</span>
                      </div>
                      <div className="font-display font-bold text-xl text-primary">
                        {formatPrice(product.price)} <span className="text-sm font-sans text-gray-500">VND</span>
                      </div>
                    </div>

                    <Link href={`/products/${product.id}`}>
                      <Button variant="outline" className="w-full rounded-none border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-wider text-xs py-5 transition-all">
                        Chi tiết sản phẩm
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-gray-50 border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium text-lg">Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
              <Button variant="link" onClick={handleReset} className="text-accent mt-2">
                Xóa tất cả bộ lọc
              </Button>
            </div>
          )}
        </main>
      </div>
    </PublicLayout>
  );
}
