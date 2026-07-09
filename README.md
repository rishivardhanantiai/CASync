# CASync - Tax & Compliance Management Platform

CASync (TotalTaxHub) is a comprehensive, full-stack web application designed to streamline the workflow between clients, tax consultants (team members), and administrators. It provides a centralized platform for managing tax filings, company registrations, document sharing, and real-time communication.

## 🚀 Key Portals

The application is divided into three distinct portals, each tailored to specific user roles:

### 1. Client Portal
A minimalistic, user-friendly interface for clients to manage their compliance needs.
- **Authentication:** Secure registration and login system.
- **Service Catalog:** Submit applications for GST Registration, GST Returns, Income Tax Returns (ITR), Firm/Company Registrations, and more.
- **Dashboard:** A centralized hub to view active requests, download invoices, check notifications, and manage profile settings.
- **Document Vault:** Upload, view, and download sensitive documents securely.
- **"Fix & Resubmit" Workflow:** If a team member requests corrections, clients can easily click "Fix & Resubmit" to jump back into their pre-filled forms, make edits, and resubmit without starting over.

### 2. Team Portal
A dedicated workspace for tax professionals and consultants to manage their assigned clients.
- **Automated Client Allocation:** New service requests submitted by a client are automatically assigned to the specific team member managing that client, ensuring a seamless workflow.
- **Task Management:** Track service requests through various statuses (`Submitted`, `In Progress`, `Pending Docs`, `Completed`).
- **Client Document Access:** Full visibility into documents uploaded by allocated clients.

### 3. Admin Portal
A global command center for business owners and administrators.
- **Analytics & Insights:** Visual dashboards featuring bar and pie charts to track revenue, request volume, and team workload distribution.
- **User & Team Management:** Create new team accounts, allocate specific services to team members, and manage client access.
- **Global Override:** Ability to view all requests, manually reassign tasks, and intervene in any client-team communication.

---

## 🛠 Core Features & Architecture

### Split-Panel Request Interface
To facilitate collaboration, the platform features a split-panel interface for reviewing service requests:
- **Left Panel:** Displays the submitted form data (read-only or editable based on status) and associated documents.
- **Right Panel (Chat System):** A request-scoped, real-time messaging system allowing clients, team members, and admins to communicate directly about a specific task, ask for missing documents, or provide updates.

### Centralized Document Management
- **Unified Storage:** All files are managed through a central `Document` model, tracking the uploader (Client/Team/Admin), file size, and association to specific clients.
- **Cross-Portal Visibility:** Documents uploaded by a client are instantly visible to their assigned team member and the admin.

### Smart Loading States
- **Global Spinner:** A centralized, full-screen loading spinner ensures a unified user experience during heavy data fetching, replacing fragmented loading texts.
- **Parallel Fetching:** Dashboards utilize `Promise.all` to fetch multiple datasets concurrently, optimizing load times.

### Mobile Responsiveness
- The entire application, including complex data tables, split-panel views, and multi-step forms, is fully responsive and optimized for mobile devices and tablets.

---

## 💻 Technology Stack

- **Frontend:** Next.js (App Router), React, Vanilla CSS (Custom Design System)
- **Backend:** Next.js API Routes (Serverless)
- **Database:** PostgreSQL (hosted on Supabase)
- **ORM:** Prisma
- **State Management:** React Hooks (`useState`, `useEffect`), LocalStorage for session persistence.

---

## 🗄️ Database Schema Highlights

- **`User` / `TeamMember` / `Admin`:** Distinct models for role-based access control.
- **`ServiceRequest`:** A unified tracking model that links to specific form data models (like `GSTRegistration`, `IncomeTaxReturn`) via a `referenceId`.
- **`RequestMessage`:** Powers the real-time chat interface tied to specific Service Requests.
- **`Document`:** Centralized file metadata and base64 storage.

---

## 🏃‍♂️ Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Variables:**
   Create a `.env` file and configure your Prisma `DATABASE_URL` pointing to your PostgreSQL instance.
   ```env
   DATABASE_URL="postgresql://user:password@host:port/dbname"
   ```
3. **Database Migration:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.
