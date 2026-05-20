import { ERO_PROJECT_ID, supabase } from '../lib/supabase';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';

type GetLeadsParams = {
  page?: number;
  pageSize?: number;
  status?: LeadStatus | 'all' | '';
};

const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'closed'];

function mapLead(item: Record<string, any>) {
  return {
    ...item,
    id: item.id,
    createdAt: item.created_at || item.createdAt,
    fullName: item.full_name || item.fullName,
    phone: item.phone,
    email: item.email,
    need: item.need,
    interestCategory: item.need || item.interestCategory,
    sourceChannel: item.source_channel || item.sourceChannel || 'website',
    currentStatus: item.current_status || item.status || item.currentStatus || 'new',
  };
}

export const cmsService = {
  async getLeads(params: GetLeadsParams = {}) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 10);
    const status = params.status && params.status !== 'all' ? params.status : undefined;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('leads')
      .select('id, full_name, phone, email, need, note, source_channel, current_status, created_at', { count: 'exact' })
      .eq('project_id', ERO_PROJECT_ID)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('current_status', status);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      registrations: (data || []).map(mapLead),
      total: count || 0,
      page,
      pageSize,
    };
  },

  async getLeadStatusSummary() {
    const result: Record<LeadStatus | 'total', number> = {
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      closed: 0,
    };

    const { count: totalCount, error: totalError } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', ERO_PROJECT_ID);

    if (totalError) throw totalError;
    result.total = totalCount || 0;

    await Promise.all(
      LEAD_STATUSES.map(async (status) => {
        const { count, error } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', ERO_PROJECT_ID)
          .eq('current_status', status);

        if (error) throw error;
        result[status] = count || 0;
      }),
    );

    return result;
  },
};
