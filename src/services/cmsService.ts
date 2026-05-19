import { supabase } from '../lib/supabase';

export const cmsService = {
  async getLeads(page: number = 1, pageSize: number = 10) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase.from('audit_logs').insert({
        actor_id: userData.user.id,
        action_type: 'read',         
        entity_type: 'leads',        
        description: `Xem danh sách khách hàng (Trang ${page})`,
        details: { page, pageSize }
      });
    }

    return { data, count };
  },

  async updateProduct(productId: string, updates: any) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId) 
      .select();

    if (error) throw error;

    return data;
  }
};