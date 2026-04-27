import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const seedUsers = [
  {
    email: 'nguyenhungyp19012004@gmail.com',
    password: 'Admin123!',
    email_confirm: true,
    user_metadata: {
      username: 'admin',
      full_name: 'Nguyễn Văn Hùng',
    },
    app_metadata: {
      role: 'admin',
    },
  },
  {
    email: 'nguyenhungvp1901@gmail.com',
    password: 'Editor123!',
    email_confirm: true,
    user_metadata: {
      username: 'editor',
      full_name: 'Nguyễn Hùng VP',
    },
    app_metadata: {
      role: 'editor',
    },
  },
];

for (const user of seedUsers) {
  const { data, error } = await supabase.auth.admin.createUser(user);

  if (error) {
    console.error(`Failed to create ${user.email}:`, error.message);
    continue;
  }

  console.log(`Created: ${user.email} -> ${data.user?.id}`);
}

console.log('Done. The auth trigger should have created matching rows in public.profiles.');
