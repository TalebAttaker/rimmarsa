import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import VendorRequests from './pages/VendorRequests'

// Placeholder components for other pages
function Vendors() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">البائعون</h3>
      <p className="text-gray-600">قريباً...</p>
    </div>
  )
}

function Products() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">المنتجات</h3>
      <p className="text-gray-600">قريباً...</p>
    </div>
  )
}

function Settings() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">الإعدادات</h3>
      <p className="text-gray-600">قريباً...</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vendor-requests" element={<VendorRequests />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/products" element={<Products />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
