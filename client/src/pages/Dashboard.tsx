import { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  DollarSign, 
  MapPin,
  CheckCircle,
  Clock,
  TrendingUp,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const stats = [
    { label: 'Total Deliveries', value: '248', icon: Package, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: 'Completed Today', value: '42', icon: CheckCircle, color: 'text-accent-600', bg: 'bg-accent-100' },
    { label: 'Active Drivers', value: '8', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Pending Petty Cash', value: '₹12,450', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const recentDeliveries = [
    { id: 'INV-001', driver: 'Rajesh Kumar', status: 'Delivered', time: '10:30 AM', location: 'Andheri East' },
    { id: 'INV-002', driver: 'Amit Sharma', status: 'In Transit', time: '11:15 AM', location: 'Bandra West' },
    { id: 'INV-003', driver: 'Suresh Patil', status: 'Delivered', time: '09:45 AM', location: 'Powai' },
    { id: 'INV-004', driver: 'Vikram Singh', status: 'Pending', time: '12:00 PM', location: 'Goregaon' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-white to-primary-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-gray-900">Cure & Care</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary-100 to-accent-50 text-primary-700 rounded-lg font-semibold shadow-sm">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <Package className="w-5 h-5" />
            Deliveries
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <Users className="w-5 h-5" />
            Drivers
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <DollarSign className="w-5 h-5" />
            Petty Cash
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5" />
            Live Tracking
          </a>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">admin@cure.com</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-primary-200">
              A
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Recent Deliveries */}
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-white to-primary-50">
              <h2 className="text-lg font-semibold text-gray-900">Recent Deliveries</h2>
              <button className="bg-gradient-to-r from-primary-600 to-accent-600 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-accent-700 font-semibold text-sm shadow-md hover:shadow-lg transition-all">
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{delivery.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{delivery.driver}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          delivery.status === 'Delivered' 
                            ? 'bg-accent-100 text-accent-700'
                            : delivery.status === 'In Transit'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {delivery.status === 'Delivered' && <CheckCircle className="w-3 h-3" />}
                          {delivery.status === 'In Transit' && <MapPin className="w-3 h-3" />}
                          {delivery.status === 'Pending' && <Clock className="w-3 h-3" />}
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{delivery.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{delivery.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
