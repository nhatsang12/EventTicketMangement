> Leading online event ticketing platform in Vietnam. Discover and own tickets for unforgettable moments.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## DEMO Event Ticket https://event-ticket-mangement-8s3y.vercel.app/
The first time the page loads may be a bit slow. Thank you for your understanding.

## Repositories

| Repo | Description | Link |
|---|---|---|
| **event-ticketing-ui** | React frontend (this repo) | ← you are here |
| **event-ticketing-server** | Node.js REST API + Database | [View Server Repo](https://github.com/nhatsang12/BEserverEventTicketingPlatform) |

---

## Features

### Home Page
- Hero banner with prominent CTA
- Featured events & recommended events list
- Filter by category (Music, Sports, Arts...)
- List of popular organizers
- Customer testimonials
- Popular venues by city

### Authentication
- Login / Register account
- Quick login with Google, Facebook, Apple
- JWT token security

### Events
- Search by name, artist, venue
- Filter by city (Ho Chi Minh City, Hanoi...)
- Detail page: banner, description, date/time, location
- Select ticket type (VIP, Early Bird...) and quantity

### Ticket Booking & Payment (3 Steps)
- **Step 1 — Information:** View cart, enter booker details
- **Step 2 — Payment:** Choose payment method:
  - 💳 Credit Card — Visa, Mastercard via **Stripe**
  - 🏦 Bank Transfer / VietQR via **PayOS**
  - 📱 MoMo Wallet via **PayOS**
- **Step 3 — Completion:** Order confirmation, receive E-Ticket

### User Profile
- Statistics: Orders, Tickets Purchased, Total Spending
- Membership tier system: Member → Silver → Gold (points earned per ticket)
- Edit personal information
- **Ticket History:** View E-Ticket with ID and status (Active / Expired)
- **QR Check-in:** Display QR code to scan at event gate
- Recent Tickets tab & Account Security

### API Integration (Server Repo)
- Authentication with JWT (login / register / logout)
- Fetch event list and details from REST API
- Create and manage orders via API
- Payment flow connected to Stripe & PayOS
- Admin dashboard fetches KPI data from server

---

## Admin Panel

### Dashboard
- KPI cards: Total Revenue, Orders, Tickets Sold, Revenue-Generating Events
- Revenue chart by event
- Recent orders list

### Statistics & Analytics
- Filter data by: 7 days / 30 days / 90 days / All time
- Daily revenue chart
- Event performance: revenue, tickets sold, attendance rate
- Export **CSV** reports

### Event Management
- Create / Edit / Delete events
- Details: name, description, date, venue, banner

### Ticket Type Management
- Create multiple ticket types per event (VIP, Early Bird, Standard...)
- Track: quantity, sold, remaining, Enable/Disable status
- Filter by event, status, sort by price

### Check-in
- Scan QR code or manually enter ticket ID to verify
- Real-time statistics: Total Tickets / Checked In / Waiting / Expired Tickets
- Attendance progress in %
- Gate entry history & exportable attendance list

### User Management
- List of all users with roles (Admin / User)
- Search by name, email, username
- Create new user / Edit / Delete
- Statistics: Total Users, Admins, Regular Users, New in 7 days

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React.js** | UI framework |
| **React Router** | Client-side routing & Protected Routes |
| **Tailwind CSS** | Styling & responsive layout |
| **Lucide React** | Icon library |
| **Stripe** | Credit card payments |
| **PayOS** | VietQR & MoMo payments |

---

## Role-Based Access

| Role | Access |
|---|---|
| **User** | Book tickets, payment, view history, personal QR check-in |
| **Admin / Staff** | Manage events, ticket types, users, dashboard, check-in |

Protected Routes automatically redirect unauthenticated users to the login page.

---

## Environment Variables

Create a `.env` file at the project root:
```env
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

For deployment environments (Vercel), you must set `VITE_API_URL` pointing to the correct production backend in `Project Settings -> Environment Variables`, then redeploy the frontend.

---

## Author

**Tieu Nhat Sang**
- nhatsang58@gmail.com
- GitHub: [@nhatsang12](https://github.com/nhatsang12)
