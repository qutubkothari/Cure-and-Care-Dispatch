import { useState } from 'react';
import { Package, MapPin, Camera, DollarSign, CheckCircle, Clock } from 'lucide-react';

export default function DriverApp() {
  const [deliveries] = useState([
    { id: 'INV-001', customer: 'Rajesh Medicals', address: 'Shop 12, Andheri East', status: 'pending' },
    { id: 'INV-002', customer: 'Care Pharmacy', address: 'Main Road, Bandra West', status: 'pending' },
    { id: 'INV-003', customer: 'Health Plus', address: 'Station Road, Powai', status: 'completed' },
  ]);

  const handleDeliver = (id: string) => {
    // Get current location and mark as delivered
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Delivered at:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            time: new Date(),
            invoiceId: id
          });
          alert('✓ Delivery marked! GPS & timestamp captured.');
        },
        (error) => {
          alert('Please enable location services to mark delivery.');
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
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
              <p className="text-sm font-semibold text-primary-600">5 Deliveries</p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button className="bg-white rounded-xl shadow-soft p-4 hover:shadow-lg transition-all active:scale-95">
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <MapPin className="w-6 h-6 text-accent-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 text-center">Start Route</p>
          </button>
          <button className="bg-white rounded-xl shadow-soft p-4 hover:shadow-lg transition-all active:scale-95">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 text-center">Petty Cash</p>
          </button>
        </div>

        {/* Today's Deliveries */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Today's Deliveries</h2>
        </div>

        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className={`bg-white rounded-xl shadow-soft p-4 ${
                delivery.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{delivery.customer}</h3>
                    {delivery.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-accent-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {delivery.address}
                  </p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  delivery.status === 'completed'
                    ? 'bg-accent-100 text-accent-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {delivery.id}
                </span>
              </div>

              {delivery.status === 'pending' ? (
                <div className="flex gap-2">
                  <button className="flex-1 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 text-white font-bold py-3 px-4 rounded-xl hover:from-primary-700 hover:via-primary-600 hover:to-accent-600 transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Mark Delivered
                  </button>
                  <button 
                    onClick={() => handleDeliver(delivery.id)}
                    className="bg-white border-2 border-gray-200 p-3 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <Camera className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-accent-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Completed at 10:30 AM
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="mt-6 bg-white rounded-xl shadow-soft p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Today's Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">5</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-600">1</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">4</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
