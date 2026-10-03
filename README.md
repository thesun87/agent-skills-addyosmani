# Tuấn Linh Coffee — Website đặt món online

Đặt cà phê, trà và bánh online: giao tận nơi hoặc đặt trước lấy tại quán; thanh toán COD hoặc chuyển khoản VietQR.

- Spec: [SPEC.md](SPEC.md)
- Kế hoạch & tiến độ: [tasks/plan.md](tasks/plan.md), [tasks/todo.md](tasks/todo.md)

## Yêu cầu

- Node.js ≥ 22, pnpm 10
- Docker Desktop (cho Supabase local — từ T2)

## Bắt đầu

```bash
pnpm install
cp .env.example .env
pnpm supabase start      # Postgres + Storage local (cần Docker)
pnpm db:migrate && pnpm db:seed
pnpm dev                 # http://localhost:3000
```

## Kiểm tra chất lượng

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm test -- --coverage
pnpm exec playwright install chromium   # lần đầu
pnpm test:e2e
```
