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
  X,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Navigation,
  Camera,
  FileText,
  AlertCircle,
  Eye
} from 'lucide-react';

type Tab = 'dashboard' | 'deliveries' | 'drivers' | 'petty-cash' | 'tracking';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Mock Data
  const stats = [
    { label: 'Total Deliveries', value: '248', icon: Package, color: 'text-primary-600', bg: 'bg-primary-100', trend: '+12%' },
    { label: 'Completed Today', value: '42', icon: CheckCircle, color: 'text-accent-600', bg: 'bg-accent-100', trend: '+8%' },
    { label: 'Active Drivers', value: '8', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', trend: '100%' },
    { label: 'Pending Petty Cash', value: '₹12,450', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100', trend: '-5%' },
  ];

  const deliveries = [
    { 
      id: 'INV-001', 
      customer: 'Apollo Pharmacy', 
      phone: '+91 98765 43210',
      address: 'Shop 12, Andheri East, Mumbai - 400069',
      driver: 'Rajesh Kumar', 
      status: 'Delivered', 
      time: '10:30 AM',
      amount: '₹2,450',
      items: '15 items',
      proof: true
    },
    { 
      id: 'INV-002', 
      customer: 'Care Pharmacy', 
      phone: '+91 98765 43211',
      address: 'Main Road, Bandra West, Mumbai - 400050',
      driver: 'Amit Sharma', 
      status: 'In Transit', 
      time: '11:15 AM',
      amount: '₹1,850',
      items: '8 items',
      proof: false
    },
    { 
      id: 'INV-003', 
      customer: 'Health Plus', 
      phone: '+91 98765 43212',
      address: 'Station Road, Powai, Mumbai - 400076',
      driver: 'Suresh Patil', 
      status: 'Delivered', 
      time: '09:45 AM',
      amount: '₹3,200',
      items: '22 items',
      proof: true
    },
    { 
      id: 'INV-004', 
      customer: 'MedPlus Pharmacy', 
      phone: '+91 98765 43213',
      address: 'Market Street, Goregaon, Mumbai - 400063',
      driver: 'Vikram Singh', 
      status: 'Pending', 
      time: '12:00 PM',
      amount: '₹980',
      items: '5 items',
      proof: false
    },
    { 
      id: 'INV-005', 
      customer: 'Wellness Chemist', 
      phone: '+91 98765 43214',
      address: 'Link Road, Malad, Mumbai - 400064',
      driver: 'Pradeep Yadav', 
      status: 'In Transit', 
      time: '12:30 PM',
      amount: '₹4,120',
      items: '18 items',
      proof: false
    },
  ];

  const drivers = [
    { 
      id: 'DRV-001', 
      name: 'Rajesh Kumar', 
      phone: '+91 98765 11111',
      email: 'rajesh@cure.com',
      status: 'Active', 
      deliveries: 42, 
      rating: 4.8,
      vehicle: 'MH 02 AB 1234',
      location: 'Andheri East'
    },
    { 
      id: 'DRV-002', 
      name: 'Amit Sharma', 
      phone: '+91 98765 22222',
      email: 'amit@cure.com',
      status: 'Active', 
      deliveries: 38, 
      rating: 4.9,
      vehicle: 'MH 02 CD 5678',
      location: 'Bandra West'
    },
    { 
      id: 'DRV-003', 
      name: 'Suresh Patil', 
      phone: '+91 98765 33333',
      email: 'suresh@cure.com',
      status: 'Active', 
      deliveries: 45, 
      rating: 4.7,
      vehicle: 'MH 02 EF 9012',
      location: 'Powai'
    },
    { 
      id: 'DRV-004', 
      name: 'Vikram Singh', 
      phone: '+91 98765 44444',
      email: 'vikram@cure.com',
      status: 'Active', 
      deliveries: 35, 
      rating: 4.6,
      vehicle: 'MH 02 GH 3456',
      location: 'Goregaon'
    },
  ];

  const pettyCashRequests = [
    {
      id: 'PC-001',
      driver: 'Rajesh Kumar',
      amount: '₹500',
      category: 'Fuel',
      description: 'Petrol for deliveries',
      date: '15 Dec 2025',
      status: 'Pending',
      receipt: true
    },
    {
      id: 'PC-002',
      driver: 'Amit Sharma',
      amount: '₹200',
      category: 'Parking',
      description: 'Parking charges at mall',
      date: '15 Dec 2025',
      status: 'Approved',
      receipt: true
    },
    {
      id: 'PC-003',
      driver: 'Suresh Patil',
      amount: '₹150',
      category: 'Toll',
      description: 'Highway toll charges',
      date: '14 Dec 2025',
      status: 'Approved',
      receipt: true
    },
    {
      id: 'PC-004',
      driver: 'Vikram Singh',
      amount: '₹300',
      category: 'Maintenance',
      description: 'Vehicle minor repair',
      date: '14 Dec 2025',
      status: 'Rejected',
      receipt: false
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-all hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      {stat.trend}
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Delivery Trend */}
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Trend (Last 7 Days)</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {[45, 52, 48, 61, 55, 67, 72].map((height, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-gradient-to-t from-primary-500 to-accent-400 rounded-t-lg transition-all hover:from-primary-600 hover:to-accent-500"
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs text-gray-600">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Delivered</span>
                      <span className="font-semibold text-accent-600">65%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">In Transit</span>
                      <span className="font-semibold text-blue-600">25%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-semibold text-amber-600">10%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-white to-primary-50">
                <h2 className="text-lg font-semibold text-gray-900">Recent Deliveries</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {deliveries.slice(0, 5).map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{delivery.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{delivery.customer}</td>
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
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{delivery.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{delivery.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'deliveries':
        return (
          <div className="space-y-6">
            {/* Search and Actions Bar */}
            <div className="bg-white rounded-xl shadow-soft p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by invoice, customer, or driver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 shadow-md">
                    <Plus className="w-4 h-4" />
                    New Delivery
                  </button>
                </div>
              </div>
            </div>

            {/* Deliveries List */}
            <div className="grid grid-cols-1 gap-4">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{delivery.id}</h3>
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
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{delivery.customer}</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {delivery.address}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {delivery.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 mb-1">{delivery.amount}</p>
                      <p className="text-sm text-gray-600">{delivery.items}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {delivery.driver.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{delivery.driver}</p>
                          <p className="text-xs text-gray-500">{delivery.time}</p>
                        </div>
                      </div>
                      {delivery.proof && (
                        <span className="flex items-center gap-1 text-xs text-accent-600 bg-accent-50 px-2 py-1 rounded">
                          <Camera className="w-3 h-3" />
                          Proof Available
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Navigation className="w-4 h-4" />
                        Track
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'drivers':
        return (
          <div className="space-y-6">
            {/* Drivers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.map((driver) => (
                <div key={driver.id} className="bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                        <p className="text-xs text-gray-500">{driver.id}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      driver.status === 'Active' 
                        ? 'bg-accent-100 text-accent-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {driver.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {driver.phone}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {driver.email}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="w-4 h-4" />
                      {driver.vehicle}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {driver.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{driver.deliveries}</p>
                      <p className="text-xs text-gray-600">Deliveries</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">⭐ {driver.rating}</p>
                      <p className="text-xs text-gray-600">Rating</p>
                    </div>
                  </div>

                  <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 font-medium text-sm">
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Add Driver Button */}
            <div className="bg-white rounded-xl shadow-soft p-6 text-center">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 font-semibold shadow-lg">
                <Plus className="w-5 h-5" />
                Add New Driver
              </button>
            </div>
          </div>
        );

      case 'petty-cash':
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Pending</h3>
                </div>
                <p className="text-3xl font-bold text-amber-600">₹12,450</p>
                <p className="text-sm text-gray-600 mt-1">15 requests</p>
              </div>
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-accent-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Approved</h3>
                </div>
                <p className="text-3xl font-bold text-accent-600">₹48,200</p>
                <p className="text-sm text-gray-600 mt-1">This month</p>
              </div>
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Rejected</h3>
                </div>
                <p className="text-3xl font-bold text-red-600">₹2,800</p>
                <p className="text-sm text-gray-600 mt-1">8 requests</p>
              </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-white to-primary-50">
                <h2 className="text-lg font-semibold text-gray-900">Petty Cash Requests</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {pettyCashRequests.map((request) => (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{request.id}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === 'Approved'
                              ? 'bg-accent-100 text-accent-700'
                              : request.status === 'Pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{request.driver}</p>
                        <p className="text-sm text-gray-900 mb-1">
                          <span className="font-medium">{request.category}:</span> {request.description}
                        </p>
                        <p className="text-xs text-gray-500">{request.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 mb-2">{request.amount}</p>
                        {request.receipt && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary-600">
                            <FileText className="w-3 h-3" />
                            Receipt
                          </span>
                        )}
                      </div>
                    </div>
                    {request.status === 'Pending' && (
                      <div className="flex gap-3 pt-4 border-t">
                        <button className="flex-1 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium">
                          Approve
                        </button>
                        <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                          Reject
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                          <Eye className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'tracking':
        return (
          <div className="space-y-6">
            {/* Live Tracking Map Placeholder */}
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-white to-primary-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Live Driver Tracking</h2>
                  {trackingEnabled && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Live</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                {!trackingEnabled ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Map</h3>
                      <p className="text-gray-600 mb-4">Click below to start live tracking</p>
                      <button 
                        onClick={() => setTrackingEnabled(true)}
                        className="px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 font-semibold transition-all hover:scale-105 shadow-lg"
                      >
                        Enable Live Tracking
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                      <div className="relative mb-4">
                        <MapPin className="w-16 h-16 text-accent-500 mx-auto animate-bounce" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Tracking Activated! 🎯</h3>
                      <p className="text-gray-600 mb-4 max-w-md">
                        {selectedDriver 
                          ? `Now tracking ${drivers.find(d => d.id === selectedDriver)?.name || 'driver'}`
                          : `Monitoring ${drivers.filter(d => d.status === 'Active').length} active drivers`
                        }
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button 
                          onClick={() => {
                            setTrackingEnabled(false);
                            setSelectedDriver(null);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          Stop Tracking
                        </button>
                        <button 
                          onClick={() => window.open('LIVE_TRACKING_GUIDE.md')}
                          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 font-medium"
                        >
                          📖 Setup Guide
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        💡 Add Google Maps API key to see real map (see LIVE_TRACKING_GUIDE.md)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Drivers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {drivers.filter(d => d.status === 'Active').map((driver) => (
                <div 
                  key={driver.id} 
                  className={`bg-white rounded-xl shadow-soft p-6 transition-all ${
                    selectedDriver === driver.id ? 'ring-2 ring-primary-500 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                          {driver.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-500 rounded-full border-2 border-white animate-pulse"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                        <p className="text-xs text-gray-500">{driver.vehicle}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setTrackingEnabled(true);
                        setSelectedDriver(driver.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedDriver === driver.id
                          ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md'
                          : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                      }`}
                    >
                      {selectedDriver === driver.id ? '📍 Tracking' : 'Track'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Current Location</span>
                      <span className="font-medium text-gray-900">{driver.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Active Deliveries</span>
                      <span className="font-medium text-gray-900">3 pending</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Update</span>
                      <span className="font-medium text-gray-900">2 min ago</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-primary-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-2xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-br from-primary-500 via-teal-500 to-accent-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <span className="font-bold text-white text-lg">Cure & Care</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:bg-white/20 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto bg-white" style={{ height: 'calc(100vh - 180px)' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'bg-gray-50 text-gray-800 hover:bg-gradient-to-r hover:from-primary-100 hover:to-accent-100 hover:text-primary-700'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'deliveries'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'bg-gray-50 text-gray-800 hover:bg-gradient-to-r hover:from-primary-100 hover:to-accent-100 hover:text-primary-700'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Deliveries</span>
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'drivers'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'bg-gray-50 text-gray-800 hover:bg-gradient-to-r hover:from-primary-100 hover:to-accent-100 hover:text-primary-700'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Drivers</span>
          </button>
          <button
            onClick={() => setActiveTab('petty-cash')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'petty-cash'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'bg-gray-50 text-gray-800 hover:bg-gradient-to-r hover:from-primary-100 hover:to-accent-100 hover:text-primary-700'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span>Petty Cash</span>
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'tracking'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'bg-gray-50 text-gray-800 hover:bg-gradient-to-r hover:from-primary-100 hover:to-accent-100 hover:text-primary-700'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span>Live Tracking</span>
          </button>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <button className="flex items-center justify-center gap-3 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl w-full font-semibold transition-all hover:shadow-md">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-md backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 rounded-xl transition-all"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize bg-gradient-to-r from-primary-600 via-teal-600 to-accent-600 bg-clip-text text-transparent">
                  {activeTab.replace('-', ' ')}
                </h1>
                <p className="text-sm text-gray-600">Welcome back, Admin</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@cure.com</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-primary-200">
                A
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
