# POS CRM System

An enterprise-grade, frontend-only Point of Sale (POS) and Customer Relationship Management (CRM) system built with Next.js. Supports multi-tenant operation, role-based access control, offline capability via IndexedDB, and cookie-based authentication.

---

## Prerequisites

- **Node.js** 18 or higher
- **npm** 9 or higher

---

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)
```

---

## Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Testing

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Build

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL for the backend API (e.g. `https://api.example.com`) |
| `NEXT_PUBLIC_API_BASE_URL` | No | Overrides the Axios base URL (defaults to `/api`) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | No | Razorpay public key for payment processing |
| `NEXT_PUBLIC_TENANT_ID` | No | Default tenant ID when subdomain detection is unavailable |

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
NEXT_PUBLIC_TENANT_ID=demo
```

---

## API Endpoint Structure

All API requests are formatted as:

```
/api/{tenantId}/{resource}
```

Examples:

| Endpoint | Description |
|---|---|
| `POST /api/{tenantId}/auth/login` | User login |
| `POST /api/{tenantId}/auth/logout` | User logout |
| `GET  /api/{tenantId}/auth/me` | Verify current session |
| `POST /api/{tenantId}/auth/refresh` | Refresh session token |
| `GET  /api/{tenantId}/products` | List products |
| `GET  /api/{tenantId}/customers` | List customers |
| `GET  /api/{tenantId}/orders` | List orders |
| `GET  /api/{tenantId}/leads` | List leads |
| `GET  /api/{tenantId}/reports/sales` | Sales report |
| `GET  /api/{tenantId}/users` | List users (admin only) |

The tenant ID is resolved from (in order): subdomain → `?tenantId=` query param → `NEXT_PUBLIC_TENANT_ID` env var.

---

## Module Overview

| Module | Route | Roles |
|---|---|---|
| Dashboard | `/dashboard` | Admin, Manager, Staff |
| POS Billing | `/pos` | Admin, Manager, Staff |
| Customers | `/customers` | Admin, Manager, Staff |
| Leads & CRM | `/leads` | Admin, Manager |
| Orders | `/orders` | Admin, Manager |
| Products / Inventory | `/products` | Admin, Manager |
| Reports | `/reports` | Admin, Manager |
| Settings | `/settings` | Admin, Manager |
| User Management | `/users` | Admin |
| Activity Logs | `/activity-logs` | Admin |

### Key Technical Details

- **Authentication**: Cookie-based (HTTP-only cookies). No tokens stored in `localStorage` or `sessionStorage`.
- **Offline support**: IndexedDB caches products and customers. Transactions are queued in `sync_queue` and synced on reconnect using last-write-wins conflict resolution.
- **State management**: Zustand for UI/tenant state; TanStack Query for server state.
- **Forms**: React Hook Form + Zod validation schemas.
- **Tables**: TanStack Table with sorting, filtering, and pagination.
- **Charts**: Recharts for all data visualizations.
- **Notifications**: Sonner toast library.
- **Roles**: `admin` > `manager` > `staff` with route-level and component-level permission checks.
