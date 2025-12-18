import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  Clock,
  Navigation,
  Phone,
  FileText,
  Upload,
  AlertCircle,
  Home,
  List,
  TrendingUp,
  LogOut,
  Receipt,
  Mail,
  Plus
} from 'lucide-react';
import * as api from '../services/api';
import ImageUpload from '../components/ImageUpload';
import FailedDeliveryModal from '../components/FailedDeliveryModal';
import PettyCashForm from '../components/PettyCashForm';
import { getValidatedPosition } from '../utils/gpsValidation';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import { queueAction } from '../utils/offlineQueue';
import { isOnline } from '../utils/offlineSync';

type Tab = 'home' | 'deliveries' | 'petty-cash' | 'profile';

interface Delivery {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: string;
  amount: number;
  items: string;
  proofUrl?: string;
  createdAt: string;
  priority?: string;
  driverId?: string;
  failureReason?: string;
  failureNotes?: string;
  failurePhotoUrls?: string[];
}

interface PettyCash {
  id: string;
  amount: number;
  category: string;
  description: string;
  status: string;
  receiptUrl?: string;
  createdAt: string;
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCash[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [selectedDeliveryForFail, setSelectedDeliveryForFail] = useState<Delivery | null>(null);
  const [showPettyCashForm, setShowPettyCashForm] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    loadData();
  }, [activeTab, dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const driverId = user.id;

      if (activeTab === 'home' || activeTab === 'deliveries') {
        const params: any = { driverId };
        if (dateFilter) params.date = dateFilter;
        const response = await api.getDeliveries(params);
        setDeliveries(response.data);
      }
      if (activeTab === 'petty-cash' || activeTab === 'home') {
        const response = await api.getPettyCash({ userId: driverId });
        setPettyCash(response.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDelivery = async (id: string) => {
    if (navigator.geolocation) {
      try {
        const gpsData = await getValidatedPosition();
        
        if (gpsData.isMockLocation) {
          const confirm = window.confirm('⚠️ Mock location detected. This may be flagged. Continue anyway?');
          if (!confirm) return;
        }
        
        await api.updateDeliveryStatus(id, {
          status: 'IN_TRANSIT',
          startedAt: new Date().toISOString(),
          startLocation: {
            lat: gpsData.latitude,
            lng: gpsData.longitude,
            accuracy: gpsData.accuracy,
            altitude: gpsData.altitude,
            altitudeAccuracy: gpsData.altitudeAccuracy,
            heading: gpsData.heading,
            speed: gpsData.speed,
            gpsTimestamp: gpsData.timestamp,
            isMockLocation: gpsData.isMockLocation,
            qualityScore: gpsData.qualityScore,
            gpsWarnings: gpsData.warnings.join('; ')
          }
        });
        
        // Update location tracking (queue if offline)
        if (!isOnline()) {
          await queueAction('location-update', '/tracking/location', 'POST', {
            lat: gpsData.latitude,
            lng: gpsData.longitude,
            accuracy: gpsData.accuracy,
            altitude: gpsData.altitude,
            altitudeAccuracy: gpsData.altitudeAccuracy,
            heading: gpsData.heading,
            speed: gpsData.speed,
            gpsTimestamp: gpsData.timestamp,
            isMockLocation: gpsData.isMockLocation,
            qualityScore: gpsData.qualityScore,
            deliveryId: id
          });
          alert('✓ Delivery started! (Will sync when online)');
        } else {
          await api.updateLocation({
            lat: gpsData.latitude,
            lng: gpsData.longitude,
            accuracy: gpsData.accuracy,
            altitude: gpsData.altitude,
            altitudeAccuracy: gpsData.altitudeAccuracy,
            heading: gpsData.heading,
            speed: gpsData.speed,
            gpsTimestamp: gpsData.timestamp,
            isMockLocation: gpsData.isMockLocation,
            qualityScore: gpsData.qualityScore,
            deliveryId: id
          });
          alert('✓ Delivery started! GPS tracking enabled.');
        }
        
        loadData();
      } catch (error: any) {
        console.error('Failed to start delivery:', error);
        if (error.code) {
          // Geolocation error
          alert('Unable to get your location. Please enable GPS.');
        } else {
          alert('Failed to start delivery. Please try again.');
        }
      }
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleCompleteDelivery = (id: string) => {
    setSelectedDelivery(id);
    setShowProofUpload(true);
  };

  const handleProofUpload = async (urls: string[]) => {
    if (!selectedDelivery) return;

    if (navigator.geolocation) {
      try {
        const gpsData = await getValidatedPosition();
        
        if (gpsData.isMockLocation) {
          const confirm = window.confirm('⚠️ Mock location detected. This may be flagged. Continue anyway?');
          if (!confirm) return;
        }
        
        await api.updateDeliveryStatus(selectedDelivery, {
          status: 'DELIVERED',
          completedAt: new Date().toISOString(),
          endLocation: {
            lat: gpsData.latitude,
            lng: gpsData.longitude,
            accuracy: gpsData.accuracy,
            altitude: gpsData.altitude,
            altitudeAccuracy: gpsData.altitudeAccuracy,
            heading: gpsData.heading,
            speed: gpsData.speed,
            gpsTimestamp: gpsData.timestamp,
            isMockLocation: gpsData.isMockLocation,
            qualityScore: gpsData.qualityScore,
            gpsWarnings: gpsData.warnings.join('; ')
          },
          proofUrl: urls[0] || '', // Use first image as primary proof
          proofUrls: urls // Store all images
        });
        alert('✓ Delivery completed successfully!');
        setShowProofUpload(false);
        setSelectedDelivery(null);
        loadData();
      } catch (error: any) {
        console.error('Failed to complete delivery:', error);
        if (error.code) {
          alert('Unable to get your location. Please enable GPS.');
        } else {
          alert('Failed to complete delivery. Please try again.');
        }
      }
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleMarkFailed = (delivery: Delivery) => {
    setSelectedDeliveryForFail(delivery);
    setShowFailedModal(true);
  };

  const handleFailedDeliverySubmit = async (data: { reason: string; notes: string; photoUrls: string[] }) => {
    if (!selectedDeliveryForFail) return;

    if (navigator.geolocation) {
      try {
        const gpsData = await getValidatedPosition();
        
        await api.updateDeliveryStatus(selectedDeliveryForFail.id, {
          status: 'FAILED',
          failedAt: new Date().toISOString(),
          failureLocation: {
            lat: gpsData.latitude,
            lng: gpsData.longitude,
            accuracy: gpsData.accuracy,
            altitude: gpsData.altitude,
            altitudeAccuracy: gpsData.altitudeAccuracy,
            heading: gpsData.heading,
            speed: gpsData.speed,
            gpsTimestamp: gpsData.timestamp,
            isMockLocation: gpsData.isMockLocation,
            qualityScore: gpsData.qualityScore,
            gpsWarnings: gpsData.warnings.join('; ')
          },
          failureReason: data.reason,
          failureNotes: data.notes,
          failurePhotoUrls: data.photoUrls
        });
        
        alert('✓ Delivery marked as failed.');
        setShowFailedModal(false);
        setSelectedDeliveryForFail(null);
        loadData();
      } catch (error) {
        console.error('Failed to mark delivery as failed:', error);
        throw error;
      }
    } else {
      alert('Please enable location services to mark delivery as failed.');
    }
  };

  const handleCreatePettyCash = async (data: { amount: number; category: string; description: string; receiptUrl?: string }) => {
    try {
      setLoading(true);
      await api.createPettyCash({
        ...data,
        userId: JSON.parse(localStorage.getItem('user') || '{}').id
      });
      alert('✓ Petty cash request submitted!');
      setShowPettyCashForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to create petty cash:', error);
      alert('Failed to submit request. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    today: deliveries.filter(d => d.status === 'PENDING' || d.status === 'IN_TRANSIT').length,
    completed: deliveries.filter(d => d.status === 'DELIVERED').length,
    pending: deliveries.filter(d => d.status === 'PENDING').length,
    earnings: `₹${deliveries.filter(d => d.status === 'DELIVERED').reduce((sum, d) => sum + d.amount, 0).toLocaleString()}`
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Header with Sync Indicator */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                <p className="text-gray-600 mt-1">Track your deliveries and earnings</p>
              </div>
              <SyncStatusIndicator onSyncComplete={loadData} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-soft p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                    <p className="text-xs text-gray-600">Today's Tasks</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-soft p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-soft p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-soft p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.earnings}</p>
                    <p className="text-xs text-gray-600">Earnings</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl shadow-lg p-4 hover:from-primary-700 hover:to-accent-700 transition-all active:scale-95">
                <MapPin className="w-8 h-8 mb-2 mx-auto" />
                <p className="text-sm font-semibold">Start Route</p>
              </button>
              <button 
                onClick={() => setActiveTab('petty-cash')}
                className="bg-white rounded-xl shadow-soft p-4 hover:shadow-lg transition-all active:scale-95"
              >
                <DollarSign className="w-8 h-8 text-primary-600 mb-2 mx-auto" />
                <p className="text-sm font-semibold text-gray-900">Petty Cash</p>
              </button>
            </div>

            {/* Active Deliveries */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Active Deliveries</h2>
                <button 
                  onClick={() => setActiveTab('deliveries')}
                  className="text-sm text-primary-600 font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="bg-white rounded-xl shadow-soft p-8 text-center text-gray-500">
                    Loading...
                  </div>
                ) : deliveries.filter(d => d.status !== 'DELIVERED').length === 0 ? (
                  <div className="bg-white rounded-xl shadow-soft p-8 text-center text-gray-500">
                    No active deliveries
                  </div>
                ) : (
                  deliveries.filter(d => d.status !== 'DELIVERED').slice(0, 3).map((delivery) => (
                    <div key={delivery.id} className="bg-white rounded-xl shadow-soft p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{delivery.customerName}</h3>
                            {delivery.priority === 'HIGH' && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                High Priority
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                            <MapPin className="w-3 h-3" />
                            {delivery.address}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{delivery.items || 'Various items'}</span>
                            <span>•</span>
                            <span className="font-semibold text-gray-900">₹{delivery.amount.toLocaleString()}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                          delivery.status === 'IN_TRANSIT'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {delivery.invoiceNumber}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {delivery.status === 'PENDING' ? (
                          <>
                            <button 
                              onClick={() => handleStartDelivery(delivery.id)}
                              disabled={loading}
                              className="flex-1 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-primary-700 hover:to-accent-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Navigation className="w-4 h-4" />
                              Start
                            </button>
                            <button
                              onClick={() => handleMarkFailed(delivery)}
                              disabled={loading}
                              className="bg-white border-2 border-red-500 px-3 rounded-lg hover:bg-red-50 flex items-center disabled:opacity-50"
                            >
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            </button>
                            <a href={`tel:${delivery.customerPhone}`} className="bg-white border-2 border-gray-200 px-3 rounded-lg hover:bg-gray-50 flex items-center">
                              <Phone className="w-5 h-5 text-gray-600" />
                            </a>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleCompleteDelivery(delivery.id)}
                              disabled={loading}
                              className="flex-1 bg-gradient-to-r from-accent-600 to-accent-700 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-accent-700 hover:to-accent-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Complete
                            </button>
                            <button
                              onClick={() => handleMarkFailed(delivery)}
                              disabled={loading}
                              className="bg-white border-2 border-red-500 px-3 rounded-lg hover:bg-red-50 flex items-center disabled:opacity-50"
                            >
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Performance</h3>
              <div className="h-48 flex items-end justify-between gap-2">
                {[65, 78, 82, 90, 85, 92, 88].map((height, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full">
                      <div 
                        className="w-full bg-gradient-to-t from-primary-500 to-accent-400 rounded-t-lg transition-all"
                        style={{ height: `${height}px` }}
                      ></div>
                      <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-900">
                        {Math.floor(height / 10)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'deliveries':
        return (
          <div className="space-y-4">
            {/* Date Filter */}
            <div className="bg-white rounded-xl shadow-soft p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-soft p-2 flex gap-2">
              <button className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-100 to-accent-50 text-primary-700 rounded-lg font-semibold">
                All ({deliveries.length})
              </button>
              <button className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-semibold">
                Pending ({stats.pending})
              </button>
              <button className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-semibold">
                Done ({stats.completed})
              </button>
            </div>

            {/* Deliveries List */}
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className={`bg-white rounded-xl shadow-soft p-4 ${
                    delivery.status === 'completed' ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{delivery.customerName}</h3>
                        {delivery.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-accent-500" />
                        )}
                        {delivery.priority === 'high' && delivery.status !== 'completed' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 flex items-start gap-1 mb-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{delivery.address}</span>
                      </p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600">{delivery.items || 'Various items'}</span>
                          <span className="text-gray-400">•</span>
                          <span className="font-semibold text-gray-900">₹{delivery.amount.toLocaleString()}</span>
                        </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                      delivery.status === 'completed'
                        ? 'bg-accent-100 text-accent-700'
                        : delivery.status === 'in-transit'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {delivery.id}
                    </span>
                  </div>

                  {delivery.status === 'completed' ? (
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-accent-600 font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Completed at {new Date(delivery.createdAt).toLocaleTimeString()}
                      </div>
                      <button className="text-sm text-primary-600 font-medium">
                        View Proof →
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-3 border-t">
                      {delivery.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleStartDelivery(delivery.id)}
                            className="flex-1 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-primary-700 hover:to-accent-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Navigation className="w-4 h-4" />
                            Start Delivery
                          </button>
                          <button
                            onClick={() => handleMarkFailed(delivery)}
                            disabled={loading}
                            className="bg-white border-2 border-red-500 px-4 rounded-lg hover:bg-red-50 flex items-center disabled:opacity-50"
                          >
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          </button>
                          <a 
                            href={`tel:${delivery.customerPhone}`}
                            className="bg-white border-2 border-gray-200 px-4 rounded-lg hover:bg-gray-50 flex items-center"
                          >
                            <Phone className="w-5 h-5 text-gray-600" />
                          </a>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleCompleteDelivery(delivery.id)}
                            className="flex-1 bg-gradient-to-r from-accent-600 to-accent-700 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-accent-700 hover:to-accent-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Delivered
                          </button>
                          <button
                            onClick={() => handleMarkFailed(delivery)}
                            disabled={loading}
                            className="bg-white border-2 border-red-500 px-4 rounded-lg hover:bg-red-50 flex items-center disabled:opacity-50"
                          >
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'petty-cash':
        return (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-soft p-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">₹500</p>
                <p className="text-sm text-gray-600">Pending Approval</p>
              </div>
              <div className="bg-white rounded-xl shadow-soft p-4">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-accent-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">₹2,850</p>
                <p className="text-sm text-gray-600">Approved This Month</p>
              </div>
            </div>

            {/* New Request Button */}
            <button className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold py-4 px-6 rounded-xl hover:from-primary-700 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Submit New Request
            </button>

            {/* Requests List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Requests</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="bg-white rounded-xl shadow-soft p-8 text-center text-gray-500">
                    Loading requests...
                  </div>
                ) : pettyCash.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-soft p-8 text-center text-gray-500">
                    No petty cash requests yet
                  </div>
                ) : (
                  pettyCash.map((request) => (
                    <div key={request.id} className="bg-white rounded-xl shadow-soft p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{request.category}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              request.status === 'APPROVED'
                                ? 'bg-accent-100 text-accent-700'
                                : request.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{request.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <p className="text-xl font-bold text-gray-900">\u20b9{request.amount.toLocaleString()}</p>
                      </div>
                      {request.status === 'APPROVED' && (
                        <div className="flex items-center gap-2 text-sm text-accent-600 pt-3 border-t">
                          <CheckCircle className="w-4 h-4" />
                          <span>Amount will be credited soon</span>
                        </div>
                      )}
                      {request.receiptUrl && (
                        <div className="pt-3 border-t">
                          <a href={request.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 font-medium">
                            View Receipt \u2192
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Request Form Card */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Submit</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                    <option>Fuel</option>
                    <option>Parking</option>
                    <option>Toll</option>
                    <option>Maintenance</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Brief description..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>
                <button className="w-full bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 text-gray-600">
                  <Upload className="w-5 h-5" />
                  <span>Upload Receipt (Optional)</span>
                </button>
                <button className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold py-3 rounded-lg hover:from-primary-700 hover:to-accent-700 shadow-lg">
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  RK
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">Rajesh Kumar</h2>
                  <p className="text-gray-600">Driver ID: DRV-001</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-amber-400">⭐</span>
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">4.8</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>+91 98765 11111</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>rajesh@cure.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Package className="w-5 h-5 text-gray-400" />
                  <span>Vehicle: MH 02 AB 1234</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary-50 rounded-lg">
                  <p className="text-3xl font-bold text-primary-600">248</p>
                  <p className="text-sm text-gray-600 mt-1">Total Deliveries</p>
                </div>
                <div className="text-center p-4 bg-accent-50 rounded-lg">
                  <p className="text-3xl font-bold text-accent-600">98%</p>
                  <p className="text-sm text-gray-600 mt-1">Success Rate</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">4.8</p>
                  <p className="text-sm text-gray-600 mt-1">Avg Rating</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600">₹85K</p>
                  <p className="text-sm text-gray-600 mt-1">Total Earnings</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Driving License</p>
                      <p className="text-xs text-gray-500">Valid till Dec 2028</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-accent-500" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Vehicle RC</p>
                      <p className="text-xs text-gray-500">Valid till Mar 2026</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-accent-500" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Insurance</p>
                      <p className="text-xs text-gray-500">Valid till Jun 2026</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-accent-500" />
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 text-red-600 font-bold py-3 px-6 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Driver App</h1>
                <p className="text-xs text-gray-600">Rajesh Kumar</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary-600">{stats.today} Tasks</p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'home'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Home</span>
            </button>
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'deliveries'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600'
              }`}
            >
              <List className="w-6 h-6" />
              <span className="text-xs font-medium">Deliveries</span>
            </button>
            <button
              onClick={() => setActiveTab('petty-cash')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'petty-cash'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600'
              }`}
            >
              <Receipt className="w-6 h-6" />
              <span className="text-xs font-medium">Cash</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600'
              }`}
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Proof Upload Modal */}
      {showProofUpload && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Upload Proof of Delivery</h2>
                <button
                  onClick={() => {
                    setShowProofUpload(false);
                    setSelectedDelivery(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Take photos of the delivered items and customer signature
              </p>
              <ImageUpload
                onUpload={handleProofUpload}
                maxImages={5}
                type="delivery-proof"
              />
            </div>
          </div>
        </div>
      )}

      {/* Failed Delivery Modal */}
      {showFailedModal && selectedDeliveryForFail && (
        <FailedDeliveryModal
          deliveryId={selectedDeliveryForFail.id}
          customerName={selectedDeliveryForFail.customerName}
          onClose={() => {
            setShowFailedModal(false);
            setSelectedDeliveryForFail(null);
          }}
          onSubmit={handleFailedDeliverySubmit}
        />
      )}

      {/* Petty Cash Form */}
      {showPettyCashForm && (
        <PettyCashForm
          onClose={() => setShowPettyCashForm(false)}
          onSubmit={handleCreatePettyCash}
        />
      )}
    </div>
  );
}
