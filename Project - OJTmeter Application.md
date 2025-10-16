# **Project: OJTmeter Application**

*Measure What Matters, Helping Every Student Grow, One Hour at a Time.*

### **Hosting Target: Azure App Service (Free Tier)**

### **Pipeline & Repo: Azure DevOps (Free Account)**

### **Database: Azure Cosmos DB (Free Tier)**

### **Purpose: Personal-use application for managing and tracking OJT (On-the-Job Training) hours of students**

---

## **1\. General Overview**

A lightweight, web-based **time tracking system** designed for OJT students and administrators.

The system allows:

* Students to log daily hours, view progress, and export reports.

* Admins to manage users, projects, and generate summaries.

The entire stack will be deployed and maintained on **Azure Free Tier** resources (App Service, Cosmos DB, DevOps).  
 If a feature cannot run under the free plan, it must be implemented using the **lowest-cost alternative (\< $2/month)** and clearly documented.

---

## **2\. Hosting and Platform Setup**

**Environment:**

* **Frontend \+ Backend** hosted together on **Azure App Service (Free F1 Plan)**

* **Public URL:** `https://yourapp.azurewebsites.net`

* **SSL (HTTPS)** enabled automatically

* Supports up to **5–10 concurrent users** (low traffic)

* **Cold start time:** 5–10 seconds (due to free-tier sleep)

**App Service Plan:**

* Plan: Free (F1)

* 1 GB storage

* Shared CPU (no dedicated resources)

* Auto-sleep when idle

**CI/CD Deployment:**

* **Azure DevOps Pipeline** builds and deploys automatically from the main branch

* Uses **up to 1,800 free build minutes/month** (more than enough for personal development)

* **Zero manual deployment** after setup

**Source Control:**

* **Azure Repos (Git)** for both frontend and backend

* Includes `.yml` pipeline configuration and environment variables for deployment

---

## **3\. Data and Storage**

**Primary Database:**

* **Azure Cosmos DB (Free Tier)**

* Used for storing users, logs, projects, and roles

* Includes **25 GB free storage and 1,000 RU/s throughput**

* Suitable for 5–10 users with moderate read/write activity

**Collections:**

| Collection | Purpose |
| ----- | ----- |
| `Users` | Stores credentials, profile info, and role (Admin/User) |
| `TimeLogs` | Stores time entries (date, hours, notes, projectId, userId) |
| `Projects` | Contains project details (name, description, assigned users) |
| `Roles` | Role definitions (Super Admin, Admin, User) |

**Optional File Storage:**

* **Azure Blob Storage (Free Tier)** for temporary CSV/Excel exports

* Free 5 GB/month (for 12 months, minimal cost afterward ≈ $0.10/month for small usage)

* Exports auto-deleted after download to save space

---

## **4\. User Roles and Permissions**

### **Super Admin (1–3 users)**

* Full system access

* Manage users, projects, and all logs

* Tag users to projects

* Export all reports (CSV/Excel)

* Filter logs by user/project/date

* Manage roles and permissions

### **Regular User / Student (5–10 users)**

* Login with secure credentials

* Log working hours daily

* View personal:

  * Total hours worked

  * Graphs (daily, weekly, monthly trends)

  * Calendar view (with color-coded days)

* Edit or delete their own entries

* Export personal data to CSV/Excel

---

## **5\. Application Features**

### **User Features**

* Secure login (JWT or Azure AD B2C)

* Dashboard with:

  * Total hours worked

  * Graphs using **Chart.js or Recharts**

  * Calendar visualization of logged days

* CRUD operations for time logs (create, update, delete)

* Export to CSV/Excel

* Responsive and mobile-friendly interface

### **Admin Features**

* Login through same interface

* Dashboard with global stats:

  * Graphs by user, project, or timeframe

  * Total OJT hours

* User Management:

  * Create, deactivate, edit accounts

  * Assign users to projects

* Project Management:

  * Add/edit/delete projects

* Reporting:

  * Export data by user/project/date range

---

## **6\. Visualization and Reporting**

### **Graphs**

* Built with **Chart.js** (free, lightweight)

* Displays trends, totals, and breakdowns

### **Calendar**

* Built with **FullCalendar.js (open-source)**

* Interactive day-based visualization

### **Exports**

* Generate **CSV/Excel** via frontend JS (client-side) or via backend API

* Store temporarily in Blob Storage (optional)

* Auto-cleanup after export to reduce storage

---

## **7\. Data Management and Performance**

* Auto or manual cleanup for logs older than 6–12 months

* Limit data fields to essential information

* Optimize queries to stay under 1,000 RU/s

* Static caching on frontend for better responsiveness

* Maintain under **1 GB App Service limit**

---

## **8\. Technical Stack (Azure-Compatible)**

| Layer | Technology | Notes |
| ----- | ----- | ----- |
| **Frontend** | React or Vue | Lightweight SPA, hosted in same App Service |
| **Backend** | Node.js (Express) or ASP.NET Core | REST API with CRUD endpoints |
| **Database** | Azure Cosmos DB | NoSQL structure, free-tier |
| **Storage** | Azure Blob Storage (optional) | Exports only |
| **Auth** | JWT-based or Azure AD B2C | B2C free up to 50k MAU |
| **Deployment** | Azure DevOps Pipeline | Automatic CI/CD |
| **Hosting** | Azure App Service (Free F1) | HTTPS, shared resources |
| **Monitoring** | Azure Monitor (optional) | Free 5 GB/month ingestion |

---

## **9\. Authentication & Security**

* All user credentials hashed using bcrypt or similar

* Role-based access control enforced on API routes

* HTTPS enforced via App Service

* Optionally integrate with **Azure AD B2C (Free Tier)** for simplified user auth

* Basic rate limiting to prevent abuse

---

## **10\. Scalability and Limitations**

| Area | Free Tier Behavior | Notes |
| ----- | ----- | ----- |
| **Users** | Up to \~10 | Ideal for demo/personal OJT use |
| **Storage** | 25 GB (Cosmos DB) | Auto-delete old logs |
| **App Hosting** | 1 GB, shared CPU | Sleeps after 20 min idle |
| **Custom Domain** | ❌ Not supported | Uses `azurewebsites.net` |
| **Performance** | Light workloads only | Upgrade to B1 plan (\~$2–3/month) if needed |
| **Traffic** | Low concurrency | Fine for 10 users logging daily |

---

## **11\. Project Management and DevOps**

**Azure DevOps Setup:**

* **Boards:** For feature tracking, sprints, backlog management

* **Repos:** Source code management

* **Pipelines:** CI/CD automation

**Pipeline Flow:**

1. Developer commits → triggers pipeline build

2. Pipeline deploys app to Azure App Service (Free F1)

3. Deployment logs tracked in DevOps dashboard

**Build Optimization:**

* Use cached dependencies to reduce build time

* Avoid heavy npm packages

**Monitoring (Optional):**

* Azure Monitor & Application Insights

  * Free 5 GB/month

  * Track app health and request metrics

---

## **12\. End-to-End System Flow**

1. User/Admin accesses `https://yourapp.azurewebsites.net`

2. Login → Authentication (JWT or Azure AD B2C)

3. Dashboard:

   * Loads logs, projects, summary charts

4. User logs time or edits entries

5. Data stored in Cosmos DB

6. Admin views overall stats

7. Optional export to CSV/Excel (temporary Blob Storage or direct download)

8. CI/CD pipeline auto-deploys new updates from Azure Repos

---

## **13\. Core Goals**

* **100% free** to build, host, and maintain on Azure

* **Simple architecture** that’s easy to manage and scale later

* **Lightweight and responsive** frontend

* **Integrated DevOps** workflow (Boards \+ Repos \+ Pipelines)

* **No external paid services or third-party hosting**

* **Upgrade flexibility:** If usage grows, scale minimally (≤ $2–3/month for B1 tier)

---

## **14\. Cost Summary**

| Component | Tier | Monthly Cost | Notes |
| ----- | ----- | ----- | ----- |
| Azure App Service | Free (F1) | $0 | Public hosting, no custom domain |
| Azure DevOps | Free | $0 | Includes Repos, Boards, Pipelines |
| Azure Cosmos DB | Free | $0 | 25 GB & 1,000 RU/s |
| Azure Blob Storage | Free | $0 (within 5 GB) | Optional export files |
| Azure AD B2C | Free | $0 | Up to 50 k MAU |
| Azure Monitor | Free | $0 (up to 5 GB data) | Optional |
| **Estimated Total** | — | **$0.00 (up to $1.00 max)** | Completely free for personal OJT use |

---

### **Final Notes**

This application is intentionally designed to **stay within Azure’s free resources**, enabling full functionality without incurring charges.If the project needs more performance, reliability, or custom domains in the future, the only necessary paid upgrade is **App Service B1 (\~$1–2/month)**.

