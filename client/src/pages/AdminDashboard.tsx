import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Eye,
  Upload
} from 'lucide-react';
import * as api from '../services/api';
import BulkImportModal from '../components/BulkImportModal';
import AuditLogViewer from '../components/AuditLogViewer';
import FilterModal from '../components/FilterModal';
import ReportGenerator from '../components/ReportGenerator';
import UserManagement from '../components/UserManagement';
import SyncStatusIndicator from '../components/SyncStatusIndicator';

type Tab = 'dashboard' | 'deliveries' | 'drivers' | 'petty-cash' | 'tracking' | 'audit' | 'reports' | 'users';

interface Delivery {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: string;
  driverId?: string;
  driver?: Driver;
  amount: number;
  items: string;
  proofUrl?: string;
  proofUrls?: string[];
  createdAt: string;
  priority?: string;
  failureReason?: string;
  failureNotes?: string;
  failurePhotoUrls?: string[];
  accuracy?: number;
  isMockLocation?: boolean;
  qualityScore?: number;
  gpsWarnings?: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
}

interface PettyCash {
  id: string;
  amount: number;
  category: string;
  description: string;
  status: string;
  receiptUrl?: string;
  userId: string;
  user?: { name: string };
  createdAt: string;
  approvalNotes?: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [showNewDeliveryModal, setShowNewDeliveryModal] = useState(false);
  const [selectedDeliveryForProof, setSelectedDeliveryForProof] = useState<Delivery | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCash[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    driverId: '',
    dateFrom: '',
    dateTo: '',
    priority: ''
  });
  const [newDelivery, setNewDelivery] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    items: '',
    amount: '',
    driverId: '',
    priority: 'NORMAL'
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'deliveries' || activeTab === 'dashboard') {
        const response = await api.getDeliveries(filters);
        setDeliveries(response.data);
        
        // Extract unique drivers from deliveries
        const uniqueDrivers: Driver[] = [];
        const driverIds = new Set<string>();
        response.data.forEach((delivery: Delivery) => {
          if (delivery.driver && !driverIds.has(delivery.driver.id)) {
            driverIds.add(delivery.driver.id);
            uniqueDrivers.push(delivery.driver);
          }
        });
        setDrivers(uniqueDrivers);
      }
      if (activeTab === 'drivers') {
        // Get all deliveries to extract drivers
        const response = await api.getDeliveries();
        const uniqueDrivers: Driver[] = [];
        const driverIds = new Set<string>();
        response.data.forEach((delivery: Delivery) => {
          if (delivery.driver && !driverIds.has(delivery.driver.id)) {
            driverIds.add(delivery.driver.id);
            uniqueDrivers.push(delivery.driver);
          }
        });
        setDrivers(uniqueDrivers);
      }
      if (activeTab === 'petty-cash' || activeTab === 'dashboard') {
        const response = await api.getPettyCash();
        setPettyCash(response.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelivery = async () => {
    try {
      setLoading(true);
      await api.createDelivery({
        invoiceNumber: `INV-${Date.now()}`,
        ...newDelivery,
        amount: parseFloat(newDelivery.amount),
        status: 'PENDING'
      });
      setShowNewDeliveryModal(false);
      setNewDelivery({
        customerName: '',
        customerPhone: '',
        address: '',
        items: '',
        amount: '',
        driverId: '',
        priority: 'NORMAL'
      });
      loadData();
      alert('✓ Delivery created successfully!');
    } catch (error) {
      console.error('Failed to create delivery:', error);
      alert('Failed to create delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePettyCash = async (id: string) => {
    const notes = prompt('Add approval notes (optional):');
    try {
      await api.updatePettyCashStatus(id, 'APPROVED', notes || undefined);
      loadData();
      alert('✓ Petty cash approved!');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve. Please try again.');
    }
  };

  const handleRejectPettyCash = async (id: string) => {
    const reason = prompt('Enter rejection reason (required):');
    if (!reason || !reason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    try {
      await api.updatePettyCashStatus(id, 'REJECTED', reason);
      loadData();
      alert('✓ Petty cash rejected!');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject. Please try again.');
    }
  };

  const handleBulkImport = async (deliveriesData: any[]) => {
    try {
      const response = await api.bulkCreateDeliveries(deliveriesData);
      await loadData();
      return response.data.results;
    } catch (error: any) {
      console.error('Bulk import error:', error);
      return {
        success: 0,
        failed: deliveriesData.length,
        errors: [error.response?.data?.error || error.message || 'Unknown error']
      };
    }
  };

  // Calculate stats from real data
  const stats = [
    { 
      label: 'Total Deliveries', 
      value: deliveries.length.toString(), 
      icon: Package, 
      color: 'text-primary-600', 
      bg: 'bg-primary-100', 
      trend: '+12%' 
    },
    { 
      label: 'Completed Today', 
      value: deliveries.filter(d => d.status === 'DELIVERED').length.toString(), 
      icon: CheckCircle, 
      color: 'text-accent-600', 
      bg: 'bg-accent-100', 
      trend: '+8%' 
    },
    { 
      label: 'Active Drivers', 
      value: drivers.filter(d => d.isActive).length.toString(), 
      icon: Users, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100', 
      trend: '100%' 
    },
    { 
      label: 'Pending Petty Cash', 
      value: `₹${pettyCash.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-amber-600', 
      bg: 'bg-amber-100', 
      trend: '-5%' 
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
                    {loading ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                    ) : deliveries.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No deliveries found</td></tr>
                    ) : (
                      deliveries.slice(0, 5).map((delivery) => (
                        <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{delivery.invoiceNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">{delivery.customerName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">{delivery.driver?.name || 'Unassigned'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              delivery.status === 'DELIVERED' 
                                ? 'bg-accent-100 text-accent-700'
                                : delivery.status === 'IN_TRANSIT'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {delivery.status === 'DELIVERED' && <CheckCircle className="w-3 h-3" />}
                              {delivery.status === 'IN_TRANSIT' && <MapPin className="w-3 h-3" />}
                              {delivery.status === 'PENDING' && <Clock className="w-3 h-3" />}
                              {delivery.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">₹{delivery.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {new Date(delivery.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    )}
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
                  {/* Filter Button - White background with border */}
                  <button 
                    onClick={() => setShowFilterModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium" 
                    title="Filter deliveries"
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    {(filters.status || filters.driverId || filters.dateFrom || filters.dateTo || filters.priority) && (
                      <span className="ml-1 w-2 h-2 bg-primary-600 rounded-full"></span>
                    )}
                  </button>
                  {/* Bulk Import Button */}
                  <button
                    onClick={() => setShowBulkImportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                    title="Bulk import deliveries from CSV"
                  >
                    <Upload className="w-4 h-4" />
                    Import
                  </button>
                  {/* New Delivery Button - Opens form (coming soon) */}
                  <button 
                    onClick={() => setShowNewDeliveryModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 shadow-md font-medium transition-all hover:scale-105"
                    title="Create new delivery"
                  >
                    <Plus className="w-4 h-4" />
                    New Delivery
                  </button>
                </div>
              </div>
            </div>

            {/* Deliveries List */}
            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <div className="bg-white rounded-xl shadow-soft p-12 text-center text-gray-500">
                  Loading deliveries...
                </div>
              ) : deliveries.length === 0 ? (
                <div className="bg-white rounded-xl shadow-soft p-12 text-center text-gray-500">
                  No deliveries found
                </div>
              ) : (
                deliveries.map((delivery) => (
                  <div key={delivery.id} className="bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{delivery.invoiceNumber}</h3>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            delivery.status === 'DELIVERED' 
                              ? 'bg-accent-100 text-accent-700'
                              : delivery.status === 'IN_TRANSIT'
                              ? 'bg-blue-100 text-blue-700'
                              : delivery.status === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {delivery.status === 'DELIVERED' && <CheckCircle className="w-3 h-3" />}
                            {delivery.status === 'IN_TRANSIT' && <MapPin className="w-3 h-3" />}
                            {delivery.status === 'FAILED' && <AlertCircle className="w-3 h-3" />}
                            {delivery.status === 'PENDING' && <Clock className="w-3 h-3" />}
                            {delivery.status}
                          </span>
                          {delivery.priority === 'HIGH' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              <AlertCircle className="w-3 h-3" />
                              High Priority
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{delivery.customerName}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {delivery.address}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {delivery.customerPhone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 mb-1">₹{delivery.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{delivery.items || 'Various items'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {delivery.driver ? delivery.driver.name.split(' ').map(n => n[0]).join('') : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{delivery.driver?.name || 'Unassigned'}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(delivery.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {delivery.proofUrl && (
                          <span className="flex items-center gap-1 text-xs text-accent-600 bg-accent-50 px-2 py-1 rounded">
                            <Camera className="w-3 h-3" />
                            Proof Available
                          </span>
                        )}
                        {delivery.status === 'FAILED' && delivery.failureReason && (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            <AlertCircle className="w-3 h-3" />
                            {delivery.failureReason}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedDeliveryForProof(delivery)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                          <Navigation className="w-4 h-4" />
                          Track
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'drivers':
        return (
          <div className="space-y-6">
            {/* Drivers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full bg-white rounded-xl shadow-soft p-12 text-center text-gray-500">
                  Loading drivers...
                </div>
              ) : drivers.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl shadow-soft p-12 text-center text-gray-500">
                  No drivers found
                </div>
              ) : (
                drivers.map((driver) => (
                  <div key={driver.id} className="bg-white rounded-xl shadow-soft p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg">
                          {driver.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                          <p className="text-xs text-gray-500">ID: {driver.id}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        driver.isActive 
                          ? 'bg-accent-100 text-accent-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {driver.phone || 'N/A'}
                      </p>
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {driver.email}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {deliveries.filter(d => d.driverId === driver.id).length}
                        </p>
                        <p className="text-xs text-gray-600">Deliveries</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-accent-600">
                          {deliveries.filter(d => d.driverId === driver.id && d.status === 'DELIVERED').length}
                        </p>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                    </div>

                    <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 font-medium text-sm">
                      View Details
                    </button>
                  </div>
                ))
              )}
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
                <p className="text-3xl font-bold text-amber-600">
                  ₹{pettyCash.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {pettyCash.filter(p => p.status === 'PENDING').length} requests
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-accent-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Approved</h3>
                </div>
                <p className="text-3xl font-bold text-accent-600">
                  ₹{pettyCash.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {pettyCash.filter(p => p.status === 'APPROVED').length} requests
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Rejected</h3>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  ₹{pettyCash.filter(p => p.status === 'REJECTED').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {pettyCash.filter(p => p.status === 'REJECTED').length} requests
                </p>
              </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-white to-primary-50">
                <h2 className="text-lg font-semibold text-gray-900">Petty Cash Requests</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    Loading petty cash requests...
                  </div>
                ) : pettyCash.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    No petty cash requests found
                  </div>
                ) : (
                  pettyCash.map((request) => (
                    <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">PC-{request.id}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === 'APPROVED'
                                ? 'bg-accent-100 text-accent-700'
                                : request.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{request.user?.name || 'Unknown User'}</p>
                          <p className="text-sm text-gray-900 mb-1">
                            <span className="font-medium">{request.category}:</span> {request.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 mb-2">₹{request.amount.toLocaleString()}</p>
                          {request.receiptUrl && (
                            <a 
                              href={request.receiptUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                            >
                              <FileText className="w-3 h-3" />
                              View Receipt
                            </a>
                          )}
                        </div>
                      </div>
                      {request.approvalNotes && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {request.approvalNotes}
                          </p>
                        </div>
                      )}
                      {request.status === 'PENDING' && (
                        <div className="flex gap-3 pt-4 border-t">
                          <button 
                            onClick={() => handleApprovePettyCash(request.id)}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectPettyCash(request.id)}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                          {request.receiptUrl && (
                            <a
                              href={request.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              <Eye className="w-5 h-5 text-gray-600" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'tracking':
        return (
          <div className="space-y-6">
            {/* Live Tracking Map */}
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
              <div className="h-96 bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 relative overflow-hidden">
                {/* Map Grid Pattern */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(#00a896 1px, transparent 1px), linear-gradient(90deg, #00a896 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }}></div>

                {!trackingEnabled ? (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                      <MapPin className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Live Tracking</h3>
                      <p className="text-gray-600 mb-4">Monitor all active drivers in real-time</p>
                      <button 
                        onClick={() => setTrackingEnabled(true)}
                        className="px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 font-semibold transition-all hover:scale-105 shadow-lg"
                      >
                        Enable Live Tracking
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Animated Routes */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                      <defs>
                        <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00a896" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#4caf50" stopOpacity="0.6" />
                        </linearGradient>
                      </defs>
                      {/* Route lines */}
                      <path d="M 50 50 Q 200 100 350 80" stroke="url(#routeGradient)" strokeWidth="3" fill="none" strokeDasharray="10 5">
                        <animate attributeName="stroke-dashoffset" from="0" to="15" dur="1s" repeatCount="indefinite" />
                      </path>
                      <path d="M 100 200 Q 250 180 400 250" stroke="url(#routeGradient)" strokeWidth="3" fill="none" strokeDasharray="10 5">
                        <animate attributeName="stroke-dashoffset" from="0" to="15" dur="1s" repeatCount="indefinite" />
                      </path>
                      <path d="M 600 100 Q 500 200 350 280" stroke="url(#routeGradient)" strokeWidth="3" fill="none" strokeDasharray="10 5">
                        <animate attributeName="stroke-dashoffset" from="0" to="15" dur="1s" repeatCount="indefinite" />
                      </path>
                    </svg>

                    {/* Driver Markers */}
                    {drivers.filter(d => d.isActive).map((driver, idx) => {
                      const positions = [
                        { top: '15%', left: '20%' },
                        { top: '45%', left: '60%' },
                        { top: '70%', left: '35%' },
                        { top: '30%', left: '75%' }
                      ];
                      const pos = positions[idx % positions.length];
                      const isSelected = selectedDriver === driver.id;

                      return (
                        <div
                          key={driver.id}
                          className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                            isSelected ? 'scale-125 z-20' : 'z-10 hover:scale-110'
                          }`}
                          style={{ top: pos.top, left: pos.left }}
                          onClick={() => setSelectedDriver(driver.id)}
                        >
                          {/* Pulsing circle */}
                          <div className="absolute inset-0 w-12 h-12 bg-primary-500 rounded-full opacity-20 animate-ping"></div>
                          
                          {/* Driver marker */}
                          <div className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                            isSelected
                              ? 'bg-gradient-to-br from-primary-600 to-accent-600 ring-4 ring-white'
                              : 'bg-gradient-to-br from-primary-500 to-accent-500'
                          }`}>
                            <span className="text-white font-bold text-sm">
                              {driver.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>

                          {/* Driver info tooltip */}
                          {isSelected && (
                            <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 whitespace-nowrap animate-fade-in z-30">
                              <div className="text-xs font-semibold text-gray-900">{driver.name}</div>
                              <div className="text-xs text-gray-600">{driver.email}</div>
                              <div className="text-xs text-primary-600 mt-1">📍 Active Delivery</div>
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Tracking Info Card */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4 z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {selectedDriver 
                                ? `Tracking: ${drivers.find(d => d.id === selectedDriver)?.name}`
                                : `${drivers.filter(d => d.isActive).length} Active Drivers`
                              }
                            </div>
                            <div className="text-xs text-gray-600">
                              {selectedDriver
                                ? drivers.find(d => d.id === selectedDriver)?.email
                                : 'Click on a marker to view details'
                              }
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {selectedDriver && (
                            <button 
                              onClick={() => setSelectedDriver(null)}
                              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                            >
                              Clear
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setTrackingEnabled(false);
                              setSelectedDriver(null);
                            }}
                            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                          >
                            Stop
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Active Drivers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {drivers.filter(d => d.isActive).map((driver) => (
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
                        <p className="text-xs text-gray-500">{driver.email}</p>
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
                      <span className="text-gray-600">Phone</span>
                      <span className="font-medium text-gray-900">{driver.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Active Deliveries</span>
                      <span className="font-medium text-gray-900">
                        {deliveries.filter(d => d.driverId === driver.id && d.status === 'IN_TRANSIT').length} pending
                      </span>
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

      case 'audit':
        return <AuditLogViewer />;

      case 'reports':
        return <ReportGenerator drivers={drivers} />;

      case 'users':
        return <UserManagement />;

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
          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'bg-gray-50 text-gray-800 hover:bg-gradient-to-r hover:from-primary-100 hover:to-accent-100 hover:text-primary-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Audit Logs</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'bg-gray-50 text-gray-800 hover:bg-gradient-to-r hover:from-primary-100 hover:to-accent-100 hover:text-primary-700'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Reports</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'bg-gray-50 text-gray-800 hover:bg-gradient-to-r hover:from-primary-100 hover:to-accent-100 hover:text-primary-700'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>User Management</span>
          </button>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl w-full font-semibold transition-all hover:shadow-md"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="transition-all duration-300 lg:ml-64">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-md backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize bg-gradient-to-r from-primary-600 via-teal-600 to-accent-600 bg-clip-text text-transparent">
                  {activeTab.replace('-', ' ')}
                </h1>
                <p className="text-sm text-gray-600">Welcome back, Admin</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mobile Menu Button - Only visible on small screens */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 rounded-lg transition-all shadow-md"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
              
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@cure.com</p>
              </div>
              <SyncStatusIndicator onSyncComplete={loadData} />
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

      {/* New Delivery Modal */}
      {showNewDeliveryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">New Delivery</h2>
                  <p className="text-sm text-white/80">Create a new delivery order</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewDeliveryModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  Customer Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={newDelivery.customerName}
                      onChange={(e) => setNewDelivery({...newDelivery, customerName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={newDelivery.customerPhone}
                      onChange={(e) => setNewDelivery({...newDelivery, customerPhone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <textarea
                      value={newDelivery.address}
                      onChange={(e) => setNewDelivery({...newDelivery, address: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter complete delivery address"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-600" />
                  Order Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Items *
                    </label>
                    <input
                      type="text"
                      value={newDelivery.items}
                      onChange={(e) => setNewDelivery({...newDelivery, items: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., 15 items"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹) *
                    </label>
                    <input
                      type="text"
                      value={newDelivery.amount}
                      onChange={(e) => setNewDelivery({...newDelivery, amount: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="2,450"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Driver *
                    </label>
                    <select
                      value={newDelivery.driverId}
                      onChange={(e) => setNewDelivery({...newDelivery, driverId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select driver</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={newDelivery.priority}
                      onChange={(e) => setNewDelivery({...newDelivery, priority: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High Priority</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl border-t">
              <button
                onClick={() => setShowNewDeliveryModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDelivery}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:from-primary-700 hover:to-accent-700 font-semibold shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {selectedDeliveryForProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Delivery Details</h2>
                <p className="text-sm text-gray-600">{selectedDeliveryForProof.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedDeliveryForProof(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Delivery Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-semibold">{selectedDeliveryForProof.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedDeliveryForProof.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-accent-600">
                    ₹{selectedDeliveryForProof.amount.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{selectedDeliveryForProof.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    selectedDeliveryForProof.status === 'DELIVERED' 
                      ? 'bg-accent-100 text-accent-700'
                      : selectedDeliveryForProof.status === 'IN_TRANSIT'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedDeliveryForProof.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Driver</p>
                  <p className="font-medium">{selectedDeliveryForProof.driver?.name || 'Unassigned'}</p>
                </div>
              </div>

              {/* GPS Quality Indicator */}
              {selectedDeliveryForProof.qualityScore !== undefined && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    GPS Data Quality
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Quality Score</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          selectedDeliveryForProof.qualityScore >= 80 ? 'bg-green-100 text-green-700' :
                          selectedDeliveryForProof.qualityScore >= 60 ? 'bg-blue-100 text-blue-700' :
                          selectedDeliveryForProof.qualityScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedDeliveryForProof.qualityScore}/100
                        </span>
                      </div>
                    </div>
                    {selectedDeliveryForProof.accuracy !== undefined && (
                      <div>
                        <p className="text-xs text-gray-600">GPS Accuracy</p>
                        <p className="font-medium mt-1">±{selectedDeliveryForProof.accuracy.toFixed(1)}m</p>
                      </div>
                    )}
                  </div>
                  {selectedDeliveryForProof.isMockLocation && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Mock Location Detected</p>
                        <p className="text-xs text-red-700 mt-1">This GPS data may have been spoofed</p>
                      </div>
                    </div>
                  )}
                  {selectedDeliveryForProof.gpsWarnings && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="font-medium">Warnings:</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {selectedDeliveryForProof.gpsWarnings.split('; ').map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Proof Photos */}
              {(selectedDeliveryForProof.proofUrls && selectedDeliveryForProof.proofUrls.length > 0) || selectedDeliveryForProof.proofUrl ? (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-accent-600" />
                    Proof of Delivery
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(selectedDeliveryForProof.proofUrls || [selectedDeliveryForProof.proofUrl]).map((url, index) => (
                      url && (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity group"
                        >
                          <img
                            src={url}
                            alt={`Proof ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      )
                    ))}
                  </div>
                </div>
              ) : selectedDeliveryForProof.status === 'DELIVERED' ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No proof photos uploaded yet</p>
                </div>
              ) : null}

              {/* Failed Delivery Details */}
              {selectedDeliveryForProof.status === 'FAILED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    Failure Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-red-900">Reason:</span>
                      <span className="ml-2 text-red-700">{selectedDeliveryForProof.failureReason}</span>
                    </div>
                    {selectedDeliveryForProof.failureNotes && (
                      <div>
                        <span className="font-medium text-red-900">Notes:</span>
                        <p className="mt-1 text-red-700">{selectedDeliveryForProof.failureNotes}</p>
                      </div>
                    )}
                  </div>
                  {selectedDeliveryForProof.failurePhotoUrls && selectedDeliveryForProof.failurePhotoUrls.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-red-900 mb-2">Evidence Photos:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedDeliveryForProof.failurePhotoUrls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={url}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal
          drivers={drivers}
          onClose={() => setShowBulkImportModal(false)}
          onImport={handleBulkImport}
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          filters={filters}
          drivers={drivers}
          onClose={() => setShowFilterModal(false)}
          onApply={(newFilters) => setFilters(newFilters)}
          onClear={() => setFilters({ status: '', driverId: '', dateFrom: '', dateTo: '', priority: '' })}
        />
      )}
    </div>
  );
}
