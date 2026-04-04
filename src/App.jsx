import { Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop.jsx'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout.jsx'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/Profile.jsx'
import CheckoutPage from './pages/CheckoutPage'
import MyTicketsPage from './pages/TicketHistoryPage.jsx'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import SocialAuthCallbackPage from './pages/auth/SocialAuthCallbackPage'
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
import FavoriteEventsPage from './pages/FavoriteEventsPage.jsx'

function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        gutter={8}
        containerStyle={{
          top: 'auto',
          bottom: 20,
          right: 20,
          left: 'auto',
        }}
        toastOptions={{
          duration: 3500,
          style: {
            fontSize: '13px',
            borderRadius: '12px',
            background: '#111827',
            color: '#f9fafb',
            minWidth: '200px',
            maxWidth: '380px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            lineHeight: 1.5,
            boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
            fontFamily: "'Be Vietnam Pro',sans-serif",
          },
          success: {
            icon: '',
            style: {
              borderLeft: '3px solid #10b981',
            },
          },
          error: {
            icon: '',
            style: {
              borderLeft: '3px solid #ef4444',
            },
          },
          loading: {
            icon: '',
            style: {
              borderLeft: '3px solid #f97316',
            },
          },
          blank: {
            icon: '',
          },
        }}
      />

      <ScrollToTop />
      <Routes>
        {/* Main layout routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="auth/callback" element={<SocialAuthCallbackPage />} />
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
          <Route
            path="favorites"
            element={
              <ProtectedRoute>
                <FavoriteEventsPage />
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
    </>
  )
}

export default App
