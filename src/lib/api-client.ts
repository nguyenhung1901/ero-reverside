import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query';
import { supabase, ERO_PROJECT_ID, ERO_PROJECT_SLUG } from '@/lib/supabase';

type MutationWrapper<TData, TVariables> = {
  mutation?: Omit<UseMutationOptions<TData, Error, TVariables, unknown>, 'mutationFn'>;
};

type CmsRole = 'admin' | 'editor';
type AccountStatus = 'active' | 'locked';
type ProductStatus = 'available' | 'reserved' | 'sold';
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
type MediaType = 'image' | 'video' | 'document';
type MediaVisibility = 'public' | 'private';

type Profile = {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  role: CmsRole;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt?: string | null;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Product = {
  id: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  area: string;
  price: string;
  floor?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  features: string[];
  imageUrl?: string | null;
  coverMediaId?: number | null;
  galleryMediaIds?: number[];
  gallery?: MediaItem[];
  status: ProductStatus;
  isFeatured?: boolean;
  createdAt?: string;
};

type MediaItem = {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  type: MediaType;
  visibility: MediaVisibility;
  url: string;
  rawUrl?: string | null;
  thumbnailUrl?: string | null;
  isPublic: boolean;
  storageBucket?: string | null;
  storageObjectPath?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  createdAt?: string;
};

type Registration = {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  need: string;
  interestCategory: string;
  note?: string | null;
  sourceChannel: string;
  currentStatus: LeadStatus;
  createdAt: string;
};

type AuditLog = {
  id: number;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  ipAddress?: string | null;
  actorId?: string | null;
  actorRole?: CmsRole | null;
  actorName?: string | null;
  actorEmail?: string | null;
  createdAt: string;
};

type DataExport = {
  id: number;
  exportType: string;
  filtersJson: string;
  filtersLabel: string;
  exportedBy?: string | null;
  exportedByName?: string | null;
  createdAt: string;
};

type ProjectMilestone = {
  id: number;
  milestoneDate: string;
  title: string;
  description?: string | null;
  documentRef?: string | null;
  sortOrder: number;
};

type ProjectOverview = {
  id: number;
  name: string;
  slug: string;
  code?: string | null;
  investorName?: string | null;
  location?: string | null;
  province?: string | null;
  totalAreaM2?: number | null;
  totalAreaHa?: number | null;
  densityPercent?: number | null;
  totalLowriseUnits?: number | null;
  legalStatus?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  mapEmbedUrl?: string | null;
  masterPlanImageUrl?: string | null;
  heroImageUrl?: string | null;
  overviewStats: any[];
  identityItems: any[];
  boundaries: any[];
  landUse: any[];
  amenities: any[];
  roads: any[];
  housingModels: any[];
  mapConnections: any[];
  infrastructure: any[];
  legalSummary: Record<string, any>;
};

const qk = {
  me: ['/api/v1/admin/me'] as const,
  categories: ['/api/v1/cms/categories'] as const,
  publicCategories: (slug: string) => ['/api/v1/project-categories', slug] as const,
  products: (params?: Record<string, unknown>) => ['/api/v1/products', params ?? {}] as const,
  media: (params?: Record<string, unknown>) => ['/api/v1/media', params ?? {}] as const,
  leads: (params?: Record<string, unknown>) => ['/api/v1/cms/leads', params ?? {}] as const,
  users: ['/api/v1/cms/users'] as const,
  auditLogs: ['/api/v1/cms/audit-logs'] as const,
  dataExports: ['/api/v1/cms/data-exports'] as const,
  milestones: (slug: string) => ['/api/v1/projects/milestones', slug] as const,
  project: (slug: string) => ['/api/v1/projects/overview', slug] as const,
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null || data === undefined) throw new Error('Không có dữ liệu');
  return data;
}

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  qualified: 'Tiềm năng',
  converted: 'Đã chốt',
  closed: 'Đã đóng',
};

function normalizeLoginIdentifier(value: string) {
  return value.trim().toLowerCase();
}

async function resolveLoginEmail(identifier: string) {
  const normalized = normalizeLoginIdentifier(identifier);
  if (!normalized) throw new Error('Vui lòng nhập email hoặc tên đăng nhập');
  if (normalized.includes('@')) return normalized;

  const { data, error } = await supabase.rpc('resolve_cms_login_identifier', {
    p_identifier: normalized,
  });

  if (error) {
    throw new Error('Chưa bật đăng nhập bằng tên đăng nhập. Hãy chạy file supabase/sql-patches/enable-username-login.sql trên Supabase SQL Editor.');
  }
  if (!data) throw new Error('Tên đăng nhập không tồn tại hoặc tài khoản đã bị khóa');
  return String(data);
}

function formatExportFilters(filters: any) {
  const f = filters || {};
  const parts: string[] = [];
  if (f.status) {
    parts.push(`Trạng thái: ${f.status === 'all' ? 'Tất cả' : (LEAD_STATUS_LABELS[f.status] || f.status)}`);
  }
  if (f.sourceChannel) {
    parts.push(`Kênh: ${f.sourceChannel}`);
  }
  return parts.length ? parts.join('; ') : 'Không áp dụng';
}

function asJsonArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function asJsonObject(value: any): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function mapProjectOverview(row: any): ProjectOverview {
  const content = Array.isArray(row.project_contents) ? row.project_contents[0] : row.project_contents;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    code: row.code,
    investorName: row.investor_name,
    location: row.location,
    province: row.province,
    totalAreaM2: row.total_area_m2,
    totalAreaHa: row.total_area_ha,
    densityPercent: row.density_percent,
    totalLowriseUnits: row.total_lowrise_units,
    legalStatus: row.legal_status,
    shortDescription: row.short_description,
    description: row.description,
    mapEmbedUrl: row.map_embed_url,
    masterPlanImageUrl: row.master_plan_image_url,
    heroImageUrl: row.hero_image_url,
    overviewStats: asJsonArray(content?.overview_stats),
    identityItems: asJsonArray(content?.identity_items),
    boundaries: asJsonArray(content?.boundaries),
    landUse: asJsonArray(content?.land_use),
    amenities: asJsonArray(content?.amenities),
    roads: asJsonArray(content?.roads),
    housingModels: asJsonArray(content?.housing_models),
    mapConnections: asJsonArray(content?.map_connections),
    infrastructure: asJsonArray(content?.infrastructure),
    legalSummary: asJsonObject(content?.legal_summary),
  };
}

function sanitizeStorageFileName(input: string) {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function buildStorageObjectPath(kind: string, fileName: string) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${ERO_PROJECT_SLUG}/${kind}/${yyyy}/${mm}/${Date.now()}-${sanitizeStorageFileName(fileName)}`;
}

async function resolveStorageUrl(bucket: string | null | undefined, objectPath: string | null | undefined, visibility: MediaVisibility) {
  if (!bucket || !objectPath) return null;
  if (visibility === 'public') {
    return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
  }
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

async function resolveMediaRow(row: any): Promise<MediaItem> {
  const resolvedUrl = row.storage_bucket && row.storage_object_path
    ? await resolveStorageUrl(row.storage_bucket, row.storage_object_path, row.visibility)
    : row.url;
  const resolvedThumb = row.thumbnail_url || resolvedUrl;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    type: row.media_type,
    visibility: row.visibility,
    url: resolvedUrl || row.url || '',
    rawUrl: row.url,
    thumbnailUrl: resolvedThumb || undefined,
    isPublic: row.visibility === 'public',
    storageBucket: row.storage_bucket,
    storageObjectPath: row.storage_object_path,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    createdAt: row.created_at,
  };
}

async function fetchMediaMapByIds(ids: number[]) {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (!uniqueIds.length) return new Map<number, MediaItem>();
  const { data, error } = await supabase
    .from('media_assets')
    .select('id, title, description, category, media_type, visibility, url, thumbnail_url, storage_bucket, storage_object_path, mime_type, file_size_bytes, created_at')
    .in('id', uniqueIds)
    .is('deleted_at', null);
  if (error) throw new Error(error.message);
  const resolved = await Promise.all((data || []).map(resolveMediaRow));
  return new Map<number, MediaItem>(resolved.map((item) => [item.id, item]));
}

async function fetchProductGallery(productId: number) {
  const { data, error } = await supabase
    .from('product_media')
    .select('media_id, sort_order')
    .eq('product_id', productId)
    .eq('relation_type', 'gallery')
    .order('sort_order', { ascending: true })
    .order('media_id', { ascending: true });

  if (error) {
    if (/product_media/i.test(error.message) || /relation .* does not exist/i.test(error.message)) {
      return [] as MediaItem[];
    }
    throw new Error(error.message);
  }

  const rows = data || [];
  const mediaMap = await fetchMediaMapByIds(rows.map((row: any) => row.media_id).filter(Boolean));
  return rows
    .map((row: any) => mediaMap.get(row.media_id))
    .filter(Boolean) as MediaItem[];
}

async function syncProductGallery(productId: number, galleryMediaIds?: number[]) {
  const normalizedIds = [...new Set((galleryMediaIds || []).map((item) => Number(item)).filter(Boolean))];

  const { error: deleteError } = await supabase
    .from('product_media')
    .delete()
    .eq('product_id', productId)
    .eq('relation_type', 'gallery');

  if (deleteError) throw new Error(deleteError.message);

  if (!normalizedIds.length) return;

  const payload = normalizedIds.map((mediaId, index) => ({
    product_id: productId,
    media_id: mediaId,
    relation_type: 'gallery',
    sort_order: index,
  }));

  const { error: insertError } = await supabase.from('product_media').insert(payload);
  if (insertError) throw new Error(insertError.message);
}

function mapProfile(row: any): Profile {
  return {
    id: row.id,
    username: row.username || row.email?.split('@')[0] || 'user',
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active ?? true,
  };
}

function mapProduct(row: any, mediaMap?: Map<number, MediaItem>, gallery: MediaItem[] = []): Product {
  const category = Array.isArray(row.product_categories) ? row.product_categories[0] : row.product_categories;
  const coverMedia = row.cover_media_id ? mediaMap?.get(row.cover_media_id) : undefined;
  const normalizedGallery = gallery.filter(Boolean);
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: category?.name || '',
    categorySlug: category?.slug || '',
    name: row.name,
    slug: row.slug,
    description: row.description || row.short_description || '',
    shortDescription: row.short_description,
    area: String(row.area),
    price: String(row.price),
    floor: row.floor,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    features: row.features || [],
    imageUrl: coverMedia?.url || row.image_url,
    coverMediaId: row.cover_media_id,
    galleryMediaIds: normalizedGallery.map((item) => item.id),
    gallery: normalizedGallery,
    status: row.sale_status,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}

function mapMedia(row: any): MediaItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    type: row.media_type,
    visibility: row.visibility,
    url: row.url,
    rawUrl: row.url,
    thumbnailUrl: row.thumbnail_url,
    isPublic: row.visibility === 'public',
    storageBucket: row.storage_bucket,
    storageObjectPath: row.storage_object_path,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    createdAt: row.created_at,
  };
}

function mapLead(row: any): Registration {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    need: row.need,
    interestCategory: row.need,
    note: row.note,
    sourceChannel: row.source_channel,
    currentStatus: row.current_status,
    createdAt: row.created_at,
  };
}

function mapAuditLog(row: any): AuditLog {
  const actorProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    description: row.description,
    ipAddress: row.ip_address,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    actorName: actorProfile?.full_name || actorProfile?.username || actorProfile?.email || null,
    actorEmail: actorProfile?.email || null,
    createdAt: row.created_at,
  };
}

function mapDataExport(row: any): DataExport {
  const exportedProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const filters = row.filters_json || {};
  return {
    id: row.id,
    exportType: row.export_type,
    filtersJson: JSON.stringify(filters),
    filtersLabel: formatExportFilters(filters),
    exportedBy: row.exported_by,
    exportedByName: exportedProfile?.full_name || exportedProfile?.username || exportedProfile?.email || null,
    createdAt: row.created_at,
  };
}

async function getCurrentProfile(): Promise<Profile | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  const session = sessionData.session;
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email, full_name, role, status, created_at, last_login_at')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const profile = mapProfile(data);
  if (profile.status !== 'active') {
    await supabase.auth.signOut();
    throw new Error('Tài khoản đã bị khóa');
  }
  return profile;
}

async function fetchProjectOverview(projectSlug = ERO_PROJECT_SLUG) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id, name, slug, code, investor_name, location, province,
      total_area_m2, total_area_ha, density_percent, total_lowrise_units,
      legal_status, short_description, description, map_embed_url,
      master_plan_image_url, hero_image_url,
      project_contents (
        overview_stats, identity_items, boundaries, land_use, amenities,
        roads, housing_models, map_connections, infrastructure, legal_summary
      )
    `)
    .eq('slug', projectSlug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapProjectOverview(data);
}

async function fetchCategories(includeInactive = false) {
  let query = supabase
    .from('product_categories')
    .select('id, name, slug, description, sort_order, is_active', { count: 'exact' })
    .eq('project_id', ERO_PROJECT_ID)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (!includeInactive) query = query.eq('is_active', true);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return {
    categories: (data || []).map(mapCategory),
    total: count || 0,
  };
}

async function fetchProducts(params?: any) {
  let query = supabase
    .from('products')
    .select(`
      id, project_id, category_id, name, slug, short_description, description,
      area, price, floor, bedrooms, bathrooms, features, image_url, cover_media_id,
      sale_status, publish_status, is_featured, created_at,
      product_categories ( id, name, slug )
    `, { count: 'exact' })
    .eq('project_id', ERO_PROJECT_ID)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (params?.status) query = query.eq('sale_status', params.status);
  if (params?.search) query = query.ilike('name', `%${params.search}%`);
  if (params?.minPrice !== undefined) query = query.gte('price', params.minPrice);
  if (params?.maxPrice !== undefined) query = query.lte('price', params.maxPrice);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const mediaMap = await fetchMediaMapByIds((data || []).map((row: any) => row.cover_media_id).filter(Boolean));
  let products = (data || []).map((row: any) => mapProduct(row, mediaMap));
  if (params?.categorySlug) products = products.filter((item) => item.categorySlug === params.categorySlug);
  if (params?.limit) products = products.slice(0, params.limit);
  return {
    products,
    total: params?.categorySlug ? products.length : (count || products.length),
  };
}

async function fetchProduct(id: number) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, project_id, category_id, name, slug, short_description, description,
      area, price, floor, bedrooms, bathrooms, features, image_url, cover_media_id,
      sale_status, publish_status, is_featured, created_at,
      product_categories ( id, name, slug )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const mediaMap = await fetchMediaMapByIds(data.cover_media_id ? [data.cover_media_id] : []);
  const gallery = await fetchProductGallery(id);
  return mapProduct(data, mediaMap, gallery);
}

async function fetchMedia(params?: any) {
  let query = supabase
    .from('media_assets')
    .select('id, title, description, category, media_type, visibility, url, thumbnail_url, storage_bucket, storage_object_path, mime_type, file_size_bytes, created_at', { count: 'exact' })
    .eq('project_id', ERO_PROJECT_ID)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (params?.publicOnly) query = query.eq('visibility', 'public');
  if (params?.type) query = query.eq('media_type', params.type);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  const media = await Promise.all((data || []).map(resolveMediaRow));
  return {
    media,
    total: count || 0,
  };
}

async function fetchLeads(params?: any) {
  let query = supabase
    .from('leads')
    .select('id, full_name, phone, email, need, note, source_channel, current_status, created_at', { count: 'exact' })
    .eq('project_id', ERO_PROJECT_ID)
    .order('created_at', { ascending: false });

  if (params?.status) query = query.eq('current_status', params.status);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return {
    registrations: (data || []).map(mapLead),
    total: count || 0,
  };
}

async function fetchUsers() {
  const { data, error, count } = await supabase
    .from('profiles')
    .select('id, username, email, full_name, role, status, created_at, last_login_at', { count: 'exact' })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return {
    users: (data || []).map(mapProfile),
    total: count || 0,
  };
}

async function fetchAuditLogs() {
  const { data, error, count } = await supabase
    .from('audit_logs')
    .select('id, actor_id, actor_role, action_type, entity_type, entity_id, description, ip_address, created_at, profiles!audit_logs_actor_id_fkey(username, email, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    if (/permission|row-level|not allowed/i.test(error.message)) {
      return { logs: [], total: 0 };
    }
    throw new Error(error.message);
  }
  return {
    logs: (data || []).map(mapAuditLog),
    total: count || 0,
  };
}

async function fetchDataExports() {
  const { data, error, count } = await supabase
    .from('data_exports')
    .select('id, export_type, filters_json, exported_by, created_at, profiles!data_exports_exported_by_fkey(username, email, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (error) {
    if (/permission|row-level|not allowed/i.test(error.message)) {
      return { exports: [], total: 0 };
    }
    throw new Error(error.message);
  }
  return {
    exports: (data || []).map(mapDataExport),
    total: count || 0,
  };
}

async function fetchMilestones(projectSlug = ERO_PROJECT_SLUG) {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', projectSlug)
    .maybeSingle();
  if (projectError) throw new Error(projectError.message);
  if (!project) return { milestones: [] as ProjectMilestone[] };

  const { data, error } = await supabase
    .from('project_milestones')
    .select('id, milestone_date, title, description, document_ref, sort_order')
    .eq('project_id', project.id)
    .order('sort_order', { ascending: true })
    .order('milestone_date', { ascending: true });

  if (error) throw new Error(error.message);
  return {
    milestones: (data || []).map((row) => ({
      id: row.id,
      milestoneDate: row.milestone_date,
      title: row.title,
      description: row.description,
      documentRef: row.document_ref,
      sortOrder: row.sort_order,
    })),
  };
}

export function useProjectOverview(projectSlug = ERO_PROJECT_SLUG) {
  return useQuery({
    queryKey: qk.project(projectSlug),
    queryFn: () => fetchProjectOverview(projectSlug),
  });
}

export function useGetAdminMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: getCurrentProfile,
  });
}

export function useAdminLogin(options?: MutationWrapper<any, { data: { identifier: string; password: string } }>) {
  return useMutation({
    mutationFn: async ({ data }: { data: { identifier: string; password: string } }) => {
      const email = await resolveLoginEmail(data.identifier);
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });
      if (error) throw new Error(error.message);
      const profile = await getCurrentProfile();
      if (!profile) throw new Error('Không thể tải hồ sơ quản trị');
      if (profile.role !== 'admin' && profile.role !== 'editor') {
        await supabase.auth.signOut();
        throw new Error('Tài khoản không có quyền truy cập CMS');
      }
      try {
        await supabase.rpc('log_auth_event', {
          p_action: 'login',
          p_description: `Đăng nhập CMS: ${profile.email}`,
          p_entity_type: 'auth',
          p_entity_id: signInData.user?.id ?? null,
          p_details: { source: 'frontend' },
        });
      } catch {
        // Không chặn đăng nhập nếu ghi nhật ký lỗi
      }
      return profile;
    },
    ...(options?.mutation || {}),
  });
}

export function useAdminLogout(options?: MutationWrapper<void, void>) {
  return useMutation({
    mutationFn: async () => {
      try {
        await supabase.rpc('log_auth_event', {
          p_action: 'logout',
          p_description: 'Đăng xuất CMS',
          p_entity_type: 'auth',
          p_details: { source: 'frontend' },
        });
      } catch {
        // Không chặn đăng xuất nếu ghi nhật ký lỗi
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },
    ...(options?.mutation || {}),
  });
}

export function useListProjectCategories(projectSlug = ERO_PROJECT_SLUG) {
  return useQuery({
    queryKey: qk.publicCategories(projectSlug),
    queryFn: () => fetchCategories(false),
  });
}

export function useCmsListCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: () => fetchCategories(true),
  });
}

export function useCmsCreateCategory(options?: MutationWrapper<any, { data: { projectId: number; name: string; slug: string; description?: string; sortOrder?: number } }>) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const payload = {
        project_id: data.projectId || ERO_PROJECT_ID,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        sort_order: data.sortOrder ?? 0,
        is_active: true,
      };
      const result = await supabase.from('product_categories').insert(payload).select('*').single();
      return requireData(result.data, result.error);
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsUpdateCategory(options?: MutationWrapper<any, { id: number; data: { name?: string; description?: string; sortOrder?: number; isActive?: boolean } }>) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description || null;
      if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;
      if (data.isActive !== undefined) payload.is_active = data.isActive;
      const result = await supabase.from('product_categories').update(payload).eq('id', id).select('*').single();
      return requireData(result.data, result.error);
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsDeleteCategory(options?: MutationWrapper<any, { id: number }>) {
  return useMutation({
    mutationFn: async ({ id }) => {
      const result = await supabase.from('product_categories').delete().eq('id', id).select('id').single();
      return requireData(result.data, result.error);
    },
    ...(options?.mutation || {}),
  });
}

export function useListProducts(params?: any) {
  return useQuery({
    queryKey: qk.products(params),
    queryFn: () => fetchProducts(params),
  });
}

export function useGetProduct(id: number) {
  return useQuery({
    queryKey: ['/api/v1/products', id],
    queryFn: () => fetchProduct(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export async function getProductDetail(id: number) {
  return fetchProduct(id);
}

export function useCmsCreateProduct(options?: MutationWrapper<any, { data: any }>) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const slugBase = slugify(data.name);
      const payload = {
        project_id: data.projectId || ERO_PROJECT_ID,
        category_id: data.categoryId,
        name: data.name,
        slug: `${slugBase}-${Date.now()}`,
        short_description: data.description,
        description: data.description,
        area: data.area,
        price: data.price,
        floor: data.floor,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        features: data.features || [],
        cover_media_id: data.coverMediaId || null,
        image_url: data.imageUrl || null,
        publish_status: 'published',
        sale_status: data.status || 'available',
        is_featured: false,
      };
      const result = await supabase.from('products').insert(payload).select('*').single();
      const created = requireData(result.data, result.error);
      await syncProductGallery(created.id, (data.galleryMediaIds || []).filter((mediaId: number) => mediaId !== (data.coverMediaId || null)));
      return created;
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsUpdateProduct(options?: MutationWrapper<any, { id: number; data: any }>) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const payload: any = {
        category_id: data.categoryId,
        name: data.name,
        short_description: data.description,
        description: data.description,
        area: data.area,
        price: data.price,
        floor: data.floor,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        features: data.features || [],
        cover_media_id: data.coverMediaId || null,
        image_url: data.imageUrl || null,
        sale_status: data.status,
      };
      if (data.name) payload.slug = slugify(data.name);
      const result = await supabase.from('products').update(payload).eq('id', id).select('*').single();
      const updated = requireData(result.data, result.error);
      await syncProductGallery(id, (data.galleryMediaIds || []).filter((mediaId: number) => mediaId !== (data.coverMediaId || null)));
      return updated;
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsDeleteProduct(options?: MutationWrapper<any, { id: number }>) {
  return useMutation({
    mutationFn: async ({ id }) => {
      const result = await supabase.from('products').delete().eq('id', id).select('id').single();
      return requireData(result.data, result.error);
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsUpdateProductStatus(options?: MutationWrapper<any, { id: number; data: { status: ProductStatus } }>) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await supabase.from('products').update({ sale_status: data.status }).eq('id', id).select('id').single();
      return requireData(result.data, result.error);
    },
    ...(options?.mutation || {}),
  });
}

export function useListMedia(params?: any) {
  return useQuery({
    queryKey: qk.media(params),
    queryFn: () => fetchMedia(params),
  });
}

export function useCmsCreateMedia(options?: MutationWrapper<any, { data: any }>) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const visibility = data.visibility === 'public' ? 'public' : 'private';
      const bucket = visibility === 'public' ? 'ero-public' : 'ero-private';
      let publicUrl: string | null = null;
      let storageObjectPath: string | null = null;
      let mimeType: string | null = null;
      let fileSizeBytes: number | null = null;
      let uploadedToStorage = false;

      try {
        if (data.file instanceof File) {
          storageObjectPath = buildStorageObjectPath(data.type, data.file.name);
          mimeType = data.file.type || null;
          fileSizeBytes = data.file.size || null;
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(storageObjectPath, data.file, { contentType: data.file.type || undefined, upsert: false });
          if (uploadError) throw new Error(uploadError.message);
          uploadedToStorage = true;
          if (visibility === 'public') {
            publicUrl = supabase.storage.from(bucket).getPublicUrl(storageObjectPath).data.publicUrl;
          }
        } else if (data.externalUrl) {
          publicUrl = data.externalUrl;
        } else {
          throw new Error('Vui lòng chọn file hoặc nhập link media');
        }

        const payload = {
          project_id: ERO_PROJECT_ID,
          title: data.title,
          description: data.description || null,
          category: data.category || null,
          media_type: data.type,
          visibility,
          url: publicUrl || data.externalUrl || storageObjectPath,
          thumbnail_url: data.type === 'video' ? (data.thumbnailUrl || publicUrl) : publicUrl,
          storage_bucket: storageObjectPath ? bucket : null,
          storage_object_path: storageObjectPath,
          mime_type: mimeType,
          file_size_bytes: fileSizeBytes,
          is_featured: false,
        };
        const result = await supabase.from('media_assets').insert(payload).select('*').single();
        return requireData(result.data, result.error);
      } catch (err) {
        if (uploadedToStorage && storageObjectPath) {
          try {
            await supabase.storage.from(bucket).remove([storageObjectPath]);
          } catch {
            // Nếu rollback Storage lỗi thì vẫn trả lỗi chính để admin biết thao tác chưa hoàn tất.
          }
        }
        throw err;
      }
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsDeleteMedia(options?: MutationWrapper<any, { id: number }>) {
  return useMutation({
    mutationFn: async ({ id }) => {
      const { data: existing, error: fetchError } = await supabase
        .from('media_assets')
        .select('id, storage_bucket, storage_object_path')
        .eq('id', id)
        .single();
      if (fetchError) throw new Error(fetchError.message);
      if (existing?.storage_bucket && existing?.storage_object_path) {
        await supabase.storage.from(existing.storage_bucket).remove([existing.storage_object_path]);
      }
      const result = await supabase.from('media_assets').delete().eq('id', id).select('id').single();
      return requireData(result.data, result.error);
    },
    ...(options?.mutation || {}),
  });
}


export function useCreateRegistration(options?: MutationWrapper<any, { data: { fullName: string; phone: string; email: string; need: string; note?: string } }>) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const payload = {
        project_id: ERO_PROJECT_ID,
        full_name: data.fullName,
        phone: data.phone,
        email: data.email,
        need: data.need,
        note: data.note || null,
        source_channel: 'website',
      };
      const { error } = await supabase.from('leads').insert(payload);
      if (error) throw new Error(error.message);
      return { success: true };
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsListLeads(params?: any) {
  return useQuery({
    queryKey: qk.leads(params),
    queryFn: () => fetchLeads(params),
  });
}

export function useCmsUpdateLeadStatus(options?: MutationWrapper<any, { id: number; data: { status: LeadStatus } }>) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await supabase.from('leads').update({ current_status: data.status }).eq('id', id).select('id').single();
      return requireData(result.data, result.error);
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsDeleteLead(options?: MutationWrapper<any, { id: number }>) {
  return useMutation({
    mutationFn: async ({ id }) => {
      const result = await supabase.from('leads').delete().eq('id', id).select('id').single();
      return requireData(result.data, result.error);
    },
    ...(options?.mutation || {}),
  });
}

export async function cmsExportLeads(filters?: { status?: string }) {
  const normalizedStatus = filters?.status && filters.status !== 'all' ? filters.status : undefined;
  const exportFilters = { status: normalizedStatus || 'all' };
  const leads = await fetchLeads(normalizedStatus ? { status: normalizedStatus } : undefined);

  const header = ['Ngày đăng ký', 'Họ tên', 'Số điện thoại', 'Email', 'Nhu cầu', 'Kênh', 'Trạng thái'];
  const rows = leads.registrations.map((lead) => [
    lead.createdAt,
    lead.fullName,
    lead.phone,
    lead.email,
    lead.need,
    lead.sourceChannel,
    LEAD_STATUS_LABELS[lead.currentStatus] || lead.currentStatus,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const statusSuffix = normalizedStatus ? `-${normalizedStatus}` : '';
  const { error } = await supabase.rpc('record_data_export', {
    p_export_type: 'lead_list',
    p_file_name: `khach-hang${statusSuffix}-${new Date().toISOString().slice(0, 10)}.csv`,
    p_filters_json: exportFilters,
  });
  if (error) throw new Error(error.message);

  return csv;
}

export function useCmsListUsers() {
  return useQuery({
    queryKey: qk.users,
    queryFn: fetchUsers,
  });
}

export function useCmsUpdateUserStatus(options?: MutationWrapper<any, { id: string; data: { status: AccountStatus } }>) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await supabase.from('profiles').update({ status: data.status }).eq('id', id).select('id').single();
      return requireData(result.data, result.error);
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsCreateUser(options?: MutationWrapper<any, { data: { email: string; password: string; username: string; fullName: string; role: CmsRole } }>) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const { data: result, error } = await supabase.functions.invoke('create-cms-user', {
        body: {
          email: data.email,
          password: data.password,
          username: data.username,
          fullName: data.fullName,
          role: data.role,
        },
      });
      if (error) throw new Error(error.message || 'Không thể tạo tài khoản CMS');
      if ((result as any)?.error) throw new Error((result as any).error);
      return result;
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsUpdateUserRole(options?: MutationWrapper<any, { id: string; data: { role: CmsRole } }>) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await supabase.from('profiles').update({ role: data.role }).eq('id', id).select('id').single();
      return requireData(result.data, result.error);
    },
    ...(options?.mutation || {}),
  });
}

export function useCmsListAuditLogs() {
  return useQuery({
    queryKey: qk.auditLogs,
    queryFn: fetchAuditLogs,
  });
}

export function useCmsListDataExports() {
  return useQuery({
    queryKey: qk.dataExports,
    queryFn: fetchDataExports,
  });
}

export function useProjectMilestones(projectSlug = ERO_PROJECT_SLUG) {
  return useQuery({
    queryKey: qk.milestones(projectSlug),
    queryFn: () => fetchMilestones(projectSlug),
  });
}
