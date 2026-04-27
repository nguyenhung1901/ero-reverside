import { useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { useListMedia } from "@/lib/api-client";
import { Play, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

const isLikelyVideoFile = (value?: string | null) => !!value && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(value);

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState<"all" | "image" | "video">("all");
  
  const queryParams: any = { publicOnly: true };
  if (activeTab !== "all") queryParams.type = activeTab;

  const { data, isLoading } = useListMedia(queryParams);

  return (
    <PublicLayout>
      <div className="bg-primary text-white py-16 md:py-24 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Thư Viện ERO</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">Khám phá vẻ đẹp thực tế và phối cảnh của khu đô thị sinh thái</p>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          {["all", "image", "video"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 text-sm uppercase tracking-wider font-semibold border-b-2 transition-colors ${
                activeTab === tab 
                  ? "border-accent text-primary" 
                  : "border-transparent text-gray-500 hover:text-primary"
              }`}
            >
              {tab === "all" ? "Tất cả" : tab === "image" ? "Hình ảnh" : "Video"}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-gray-100 animate-pulse"></div>
            ))}
          </div>
        ) : data?.media && data.media.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[250px]">
            {data.media.map((item) => (
              <Dialog key={item.id}>
                <DialogTrigger asChild>
                  <div className={`relative group overflow-hidden cursor-pointer bg-gray-100 ${
                    item.type === 'video' ? 'row-span-2' : ''
                  }`}>
                    {item.type === 'video' && isLikelyVideoFile(item.thumbnailUrl || item.url) ? (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                        <Play className="w-12 h-12" />
                      </div>
                    ) : (
                      <img 
                        src={item.type === 'video' ? (item.thumbnailUrl || item.url) : item.url} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                      {item.type === 'video' ? (
                        <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center text-white mb-4">
                          <Play className="w-8 h-8 ml-1" />
                        </div>
                      ) : null}
                      <h4 className="text-white font-display font-bold text-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        {item.title}
                      </h4>
                      {item.category && (
                        <span className="text-accent text-xs uppercase tracking-wider mt-2 font-semibold">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {!item.isPublic && (
                      <div className="absolute top-4 right-4 bg-primary/80 backdrop-blur-sm p-2 rounded-full text-white">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none">
                  <DialogTitle className="sr-only">{item.title}</DialogTitle>
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.title} className="w-full max-h-[90vh] object-contain" />
                  ) : (
                    <div className="w-full aspect-video bg-black flex items-center justify-center">
                      {/* Using iframe for video assuming url is youtube/vimeo link, or video tag if raw mp4 */}
                      {item.url.includes('youtube') || item.url.includes('vimeo') ? (
                         <iframe src={item.url} className="w-full h-full" allowFullScreen></iframe>
                      ) : (
                         <video src={item.url} controls className="w-full max-h-[90vh]"></video>
                      )}
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                    <h3 className="text-2xl font-display font-bold">{item.title}</h3>
                    {item.description && <p className="text-gray-300 mt-2">{item.description}</p>}
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-500">
            Chưa có hình ảnh/video nào được đăng tải.
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
