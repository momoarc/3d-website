# Task: Create Porte Prestige Admin Panel

## Summary
Created a comprehensive admin panel for "Porte Prestige" - a premium doors e-commerce site in Algeria. The admin panel has 17 sections with role-based access control (4 roles: super_admin, admin, editeur, lecteur).

## Files Created

### Pages (13 pages)
1. `/src/app/admin/login/page.tsx` - Admin login with Supabase auth
2. `/src/app/admin/layout.tsx` - Admin layout with sidebar navigation, auth check, responsive design
3. `/src/app/admin/page.tsx` - Dashboard with KPI cards, recent orders, urgent actions, status summary
4. `/src/app/admin/orders/page.tsx` - Orders management with search, filters, status change, WhatsApp/phone actions, CSV export
5. `/src/app/admin/products/page.tsx` - Products table with search, edit/delete
6. `/src/app/admin/products/new/page.tsx` - Add/edit product form with image upload, specs, dynamic attributes
7. `/src/app/admin/users/page.tsx` - Role management with 4 role cards, user list, role assignment (super_admin only)
8. `/src/app/admin/showroom/page.tsx` - Showroom 360° config with wall editor, room settings, categories manager
9. `/src/app/admin/projects/page.tsx` - Réalisations management with grid view, add/edit/delete
10. `/src/app/admin/settings/page.tsx` - Business info, pixel IDs, password change
11. 9 placeholder pages: employees, performance, marketing, leads, delivery, shipments, clients, analytics, pipeline

### Components
- `/src/components/admin/RoleGuard.tsx` - Role-based access guard component
- `/src/components/admin/PlaceholderPage.tsx` - Shared placeholder page component

### API Routes (8 routes)
1. `/src/app/api/admin/orders/route.ts` - GET, PATCH
2. `/src/app/api/admin/products/route.ts` - GET, POST, PATCH, DELETE
3. `/src/app/api/admin/projects/route.ts` - GET, POST, PATCH, DELETE
4. `/src/app/api/admin/showroom/route.ts` - GET, PATCH
5. `/src/app/api/admin/categories/route.ts` - GET, POST, PATCH, DELETE
6. `/src/app/api/admin/users/route.ts` - GET, POST, DELETE (super_admin check)
7. `/src/app/api/admin/settings/route.ts` - GET, PATCH
8. `/src/app/api/admin/employees/route.ts` - GET, POST, PATCH, DELETE

## Technical Details
- All pages use 'use client' directive
- Dark premium theme (bg-base: #08080a, bg-card: #111113, gold: #c9a84c)
- Uses shadcn/ui components throughout
- All text in French
- Auth: Supabase auth with middleware protection + client-side checks
- Role checks: app_metadata.role + user_roles table
- Responsive design with mobile sidebar (Sheet component)
- Lint: passes with no errors in admin files
