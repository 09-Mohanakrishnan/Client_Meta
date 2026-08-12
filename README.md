# AdFlow Manager - Full-Stack Ad Dashboard & Console

AdFlow Manager is a production-ready, full-stack web application designed for enterprise campaigns management, inspired by the visual density and hierarchical relationship structure of Meta Ads Manager. 

It provides an end-to-end data flow (React ➔ TanStack Query ➔ Express REST API ➔ MongoDB) with dynamic column configuration, in-place inline cell editing, role-based authorization levels, audit logging, and bulk CSV operations.

---

## 1. Quick Start & Execution

### Prerequisites
* **Node.js**: v18+ recommended.
* **MongoDB**: A running local MongoDB instance on port 27017, or a MongoDB Atlas URI string.

---

### Step 1: Install Dependencies
Run the installation step in both directories:

```bash
# Install backend packages
cd server
npm install

# Install frontend packages
cd ../client
npm install
```

---

### Step 2: Configure Environment Settings
By default, the application comes configured with standard local defaults, but you can customize them.

Create a `.env` file in the `server/` directory:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/adflow
JWT_SECRET=supersecretjwtkeychangeinproduction12345
CLIENT_URL=http://localhost:5173
```

Create a `.env` file at the root workspace folder for global reference:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/adflow
JWT_SECRET=supersecretjwtkeychangeinproduction12345
CLIENT_URL=http://localhost:5173
```

---

### Step 3: Seed the Database
To populate users, columns configuration metadata, and mock campaigns, adsets, and ads:

```bash
cd server
npm run seed
```

This will automatically create four default users:
* **SUPER_ADMIN**: `superadmin@adflow.com` / `Password123`
* **ADMIN**: `admin@adflow.com` / `Password123`
* **EDITOR**: `editor@adflow.com` / `Password123`
* **VIEWER**: `viewer@adflow.com` / `Password123`

---

### Step 4: Run the Application
Start both the backend and frontend dev servers:

```bash
# In the server directory:
npm run dev  # Starts Express server on port 5001 with nodemon

# In the client directory:
npm run dev  # Starts Vite React application on port 5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the login portal.

---

## 2. Console Authorization & Role Permissions

Authorization is enforced at both the UI layer (conditional button rendering) and the backend Express route layer using role validation middleware:

* **SUPER_ADMIN**: Full access (CRUD campaign entities, Column configuration management, User creation/deletion, and viewing Audit logs).
* **ADMIN**: CRUD campaigns, adsets, ads, and column configuration. No User Management or Audit Log viewing.
* **EDITOR**: View and modify campaigns, adsets, and ads (including inline edits). No delete actions, and no column configuration.
* **VIEWER**: Read-only access. Column configuration is visible but cannot be modified. Inline cell modifications and CRUD buttons are disabled.

---

## 3. Database Schema Overview

### User
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // BCrypt hashed
  role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER'], default: 'VIEWER' }
}
```

### ColumnConfig
```javascript
{
  entityType: { type: String, enum: ['campaign', 'adset', 'ad'], required: true },
  key: { type: String, required: true }, // Field property identifier
  label: { type: String, required: true }, // Display header
  type: { type: String, enum: ['text', 'number', 'currency', 'percentage', 'date', 'datetime', 'boolean', 'status', 'select', 'image', 'link'] },
  visible: { type: Boolean, default: true },
  editable: { type: Boolean, default: true },
  sortable: { type: Boolean, default: true },
  filterable: { type: Boolean, default: true },
  order: { type: Number, required: true } // Drag position order
}
```

### Campaign / AdSet / Ad
Mongoose schemas are created with `{ strict: false }`. Core metrics (Impressions, Reach, Results, Cost, Budget) are declared, but any dynamic user-created fields are saved directly at the root of the document.

### AuditLog
Logs all modifications made by console users:
```javascript
{
  userId: { type: ObjectId, ref: 'User' },
  userEmail: { type: String },
  action: { type: String },
  entityType: { type: String },
  entityId: { type: String },
  field: { type: String },
  oldValue: { type: Mixed },
  newValue: { type: Mixed },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String }
}
```

---

## 4. API Documentation

### Authentication (`/api/auth`)
* `POST /login`: Logs in user and returns JWT payload.
* `POST /register`: Registers a new user.
* `GET /me`: Returns logged-in user profile details.

### Campaigns (`/api/campaigns`)
* `GET /`: Returns paginated, filtered, and sorted campaigns.
* `GET /:id`: Returns a specific campaign.
* `POST /`: Creates a new campaign.
* `PATCH /:id`: Updates campaign details (supports inline edits).
* `DELETE /:id`: Deletes campaign, associated adsets, and ads.
* `POST /:id/duplicate`: Clones campaign, generating a unique `campaignId`.
* `POST /import`: Bulk inserts verified campaign rows.

### Ad Sets (`/api/adsets`)
* `GET /`: Returns adsets (supports `?campaignId=` filtering).
* `GET /:id`: Returns specific adset.
* `POST /`: Creates a new adset.
* `PATCH /:id`: Updates adset.
* `DELETE /:id`: Deletes adset and associated ads.
* `POST /:id/duplicate`: Clones adset.
* `POST /import`: Bulk inserts adsets.

### Ads (`/api/ads`)
* `GET /`: Returns ads (supports `?campaignId=` or `?adSetId=` filtering).
* `GET /:id`: Returns specific ad.
* `POST /`: Creates a new ad.
* `PATCH /:id`: Updates ad.
* `DELETE /:id`: Deletes ad.
* `POST /:id/duplicate`: Clones ad.
* `POST /import`: Bulk inserts ads.

### Columns (`/api/columns`)
* `GET /:entityType`: Returns visibility and sorting configuration for an entity.
* `POST /`: Creates a new dynamic column header.
* `PATCH /:id`: Updates column properties.
* `DELETE /:id`: Deletes column definition.
* `PATCH /reorder`: Updates sorting orders in bulk.

### Users & Audit Logs
* `GET /api/users`: Returns console operator list (SUPER_ADMIN).
* `GET /api/audit-logs`: Returns searchable console actions log (SUPER_ADMIN).

---

## 5. Architectural Detail: Dynamic Columns

1. **DB ColumnConfig Collection**: The layout of the dashboard tables is entirely dictated by documents inside the `ColumnConfigs` collection.
2. **Schema strict: false**: In Mongoose, schemas have `{ strict: false }`. If an administrator defines a new column in Column configuration (e.g. `key: ctr`, `type: percentage`), the client can instantly edit and save values like `ctr: 4.8` via the inline edit cell. The value is stored directly at the document root level in MongoDB.
3. **Table Resolution**: The React frontend fetches columns configs from `/api/columns/campaign` (for example), and automatically inserts column definitions into the TanStack Table instance, rendering the new headers and cells without requiring code edits or redeploying.

---

## 6. Future Meta Marketing API Integration

The architecture is explicitly decoupled to facilitate future Meta Marketing API integration:

### decoupler diagram
```
                  ┌───────────────────────────────┐
                  │      Meta Marketing API       │
                  └──────────────┬────────────────┘
                                 │ Sync (Webhook/Poll)
                                 ▼
                  ┌───────────────────────────────┐
                  │      Background Sync Sync     │
                  └──────────────┬────────────────┘
                                 │ Write/Merge
                                 ▼
┌──────────────┐  Read/Write  ┌───────────────────────────────┐
│ React Client ├─────────────►│        MongoDB database       │
└──────────────┘              └───────────────────────────────┘
```

1. **Meta API Sync Engine**: A background worker (using BullMQ or a Cron service) can pull campaign details, adset sets, and creative listings from the Meta Marketing API, and upsert them directly into the Mongoose models using the custom alphanumeric identifiers (`campaignId`, `adSetId`, `adId`) as query keys.
2. **Read Source-of-Truth**: The React Dashboard and Express REST APIs will continue reading directly from MongoDB, rendering the updated synced stats automatically.
3. **Action Sync Hook**: Write endpoints (like PATCH updates and POST duplicates) can trigger a webhook or async event that queues changes to push back to the Meta Marketing API, keeping both systems perfectly in sync.
