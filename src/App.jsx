import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/Profile.jsx'
import CheckoutPage from './pages/CheckoutPage'
import MyTicketsPage from './pages/TicketHistoryPage.jsx'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import AdminUsers from './pages/admin/AdminUsers.jsx'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEvents from './pages/admin/AdminEvents'
import AdminTickets from './pages/admin/AdminTickets'
import AdminCheckIn from './pages/admin/AdminCheckIn'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import CheckInPage from './pages/CheckInPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentFail from './pages/PaymentFail'

function App() {
  return (
    <Routes>
      {/* Main layout routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="event/:id" element={<EventDetailPage />} />
        <Route path="checkin" element={<CheckInPage />} />
        <Route path="payment-success" element={<PaymentSuccessPage />} />
        <Route path="payment-fail" element={<PaymentFail />} />

        {/* Protected routes */}
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-tickets"
          element={
            <ProtectedRoute>
              <MyTicketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ticket-history"
          element={
            <ProtectedRoute>
              <MyTicketsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin layout routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="checkin" element={<AdminCheckIn />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App