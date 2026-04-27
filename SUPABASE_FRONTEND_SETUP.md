# Kết nối frontend với Supabase

## 1. Tạo file `.env`
Trong thư mục `frontend`, tạo file `.env` từ `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 2. Cài dependencies
```bash
npm install
```

## 3. Chạy local
```bash
npm run dev
```

## 4. Đăng nhập CMS
- Admin: `nguyenhungyp19012004@gmail.com` / `Admin123!`
- Editor: `nguyenhungvp1901@gmail.com` / `Editor123!`

## 5. Tạo thêm tài khoản CMS ngay trên giao diện admin
Phiên bản này đã có form tạo tài khoản trong trang **Quản lý tài khoản CMS**.
Để nút tạo tài khoản hoạt động, cần triển khai Edge Function `create-cms-user` ở thư mục:

```text
supabase/functions/create-cms-user/index.ts
```

Nếu chưa deploy function, các phần còn lại của CMS vẫn hoạt động bình thường, chỉ riêng nút tạo tài khoản mới sẽ báo lỗi.
