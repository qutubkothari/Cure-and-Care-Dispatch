import { useState } from 'react';
import { Download, FileText, Calendar, TrendingUp, DollarSign, Users, Package } from 'lucide-react';
import * as api from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'delivery-summary' | 'driver-performance' | 'petty-cash-reconciliation';

interface ReportFilters {
  reportType: ReportType;
  dateFrom: string;
  dateTo: string;
  driverId?: string;
  status?: string;
}

interface ReportGeneratorProps {
  drivers: { id: string; name: string }[];
}

function ReportGenerator({ drivers }: ReportGeneratorProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'delivery-summary',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    dateTo: new Date().toISOString().split('T')[0],
    driverId: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await api.getReportData({
        type: filters.reportType,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        driverId: filters.driverId || undefined,
        status: filters.status || undefined
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 168, 150); // Primary color
    doc.text('Cure & Care Dispatch', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const reportTitle = getReportTitle(filters.reportType);
    doc.text(reportTitle, pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Period: ${filters.dateFrom} to ${filters.dateTo}`, pageWidth / 2, 37, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 42, { align: 'center' });

    let yPosition = 50;

    if (filters.reportType === 'delivery-summary') {
      // Summary Stats
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary Statistics', 14, yPosition);
      yPosition += 10;

      const summaryData = [
        ['Total Deliveries', reportData.summary.total],
        ['Delivered', reportData.summary.delivered],
        ['In Transit', reportData.summary.inTransit],
        ['Pending', reportData.summary.pending],
        ['Failed', reportData.summary.failed],
        ['Total Revenue', `₹${reportData.summary.revenue.toLocaleString()}`],
        ['Avg Delivery Value', `₹${reportData.summary.avgValue.toLocaleString()}`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [0, 168, 150] },
        margin: { left: 14, right: 14 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Deliveries by Status
      if (reportData.deliveries && reportData.deliveries.length > 0) {
        doc.text('Delivery Details', 14, yPosition);
        yPosition += 7;

        const deliveryData = reportData.deliveries.map((d: any) => [
          d.invoiceNumber,
          d.customerName,
          d.driver?.name || 'Unassigned',
          d.status,
          `₹${d.amount.toLocaleString()}`,
          new Date(d.createdAt).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Invoice', 'Customer', 'Driver', 'Status', 'Amount', 'Date']],
          body: deliveryData,
          theme: 'striped',
          headStyles: { fillColor: [0, 168, 150] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 }
        });
      }
    } else if (filters.reportType === 'driver-performance') {
      // Driver Performance Stats
      doc.text('Driver Performance Metrics', 14, yPosition);
      yPosition += 10;

      const driverData = reportData.drivers.map((d: any) => [
        d.name,
        d.totalDeliveries,
        d.completed,
        d.failed,
        `${d.successRate}%`,
        `₹${d.totalEarnings.toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Driver', 'Total', 'Completed', 'Failed', 'Success Rate', 'Earnings']],
        body: driverData,
        theme: 'grid',
        headStyles: { fillColor: [0, 168, 150] },
        margin: { left: 14, right: 14 }
      });
    } else if (filters.reportType === 'petty-cash-reconciliation') {
      // Petty Cash Summary
      doc.text('Petty Cash Summary', 14, yPosition);
      yPosition += 10;

      const summaryData = [
        ['Total Requests', reportData.summary.total],
        ['Approved', reportData.summary.approved],
        ['Pending', reportData.summary.pending],
        ['Rejected', reportData.summary.rejected],
        ['Total Amount', `₹${reportData.summary.totalAmount.toLocaleString()}`],
        ['Approved Amount', `₹${reportData.summary.approvedAmount.toLocaleString()}`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [0, 168, 150] },
        margin: { left: 14, right: 14 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Breakdown by Category
      if (reportData.byCategory && reportData.byCategory.length > 0) {
        doc.text('By Category', 14, yPosition);
        yPosition += 7;

        const categoryData = reportData.byCategory.map((c: any) => [
          c.category,
          c.count,
          `₹${c.totalAmount.toLocaleString()}`,
          `₹${c.avgAmount.toLocaleString()}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Category', 'Count', 'Total Amount', 'Avg Amount']],
          body: categoryData,
          theme: 'striped',
          headStyles: { fillColor: [0, 168, 150] },
          margin: { left: 14, right: 14 }
        });
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`${filters.reportType}-${filters.dateFrom}-to-${filters.dateTo}.pdf`);
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csv = '';
    let filename = '';

    if (filters.reportType === 'delivery-summary') {
      filename = 'delivery-summary.csv';
      csv = 'Invoice,Customer,Driver,Status,Amount,Priority,Date\n';
      reportData.deliveries.forEach((d: any) => {
        csv += `${d.invoiceNumber},${d.customerName},${d.driver?.name || 'Unassigned'},${d.status},${d.amount},${d.priority || 'NORMAL'},${new Date(d.createdAt).toLocaleDateString()}\n`;
      });
    } else if (filters.reportType === 'driver-performance') {
      filename = 'driver-performance.csv';
      csv = 'Driver,Total Deliveries,Completed,Failed,Success Rate,Earnings\n';
      reportData.drivers.forEach((d: any) => {
        csv += `${d.name},${d.totalDeliveries},${d.completed},${d.failed},${d.successRate}%,${d.totalEarnings}\n`;
      });
    } else if (filters.reportType === 'petty-cash-reconciliation') {
      filename = 'petty-cash-reconciliation.csv';
      csv = 'Driver,Category,Amount,Status,Description,Date\n';
      reportData.requests.forEach((r: any) => {
        csv += `${r.user?.name},${r.category},${r.amount},${r.status},"${r.description}",${new Date(r.createdAt).toLocaleDateString()}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const getReportTitle = (type: ReportType): string => {
    switch (type) {
      case 'delivery-summary': return 'Delivery Summary Report';
      case 'driver-performance': return 'Driver Performance Report';
      case 'petty-cash-reconciliation': return 'Petty Cash Reconciliation Report';
      default: return 'Report';
    }
  };

  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case 'delivery-summary': return <Package className="w-5 h-5" />;
      case 'driver-performance': return <Users className="w-5 h-5" />;
      case 'petty-cash-reconciliation': return <DollarSign className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-sm text-gray-600">Generate comprehensive reports and export data</p>
      </div>

      {/* Report Configuration */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Report Configuration</h3>
        </div>

        <div className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['delivery-summary', 'driver-performance', 'petty-cash-reconciliation'] as ReportType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilters({ ...filters, reportType: type })}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    filters.reportType === type
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    filters.reportType === type ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getReportIcon(type)}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{getReportTitle(type).replace(' Report', '')}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Optional Filters */}
          {filters.reportType !== 'petty-cash-reconciliation' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver (Optional)
                </label>
                <select
                  value={filters.driverId}
                  onChange={(e) => setFilters({ ...filters, driverId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Drivers</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>
              {filters.reportType === 'delivery-summary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status (Optional)
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateReport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold disabled:opacity-50 transition-all"
          >
            <TrendingUp className="w-5 h-5" />
            {loading ? 'Generating Report...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-600" />
              <h3 className="font-semibold text-gray-900">Report Results</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {reportData.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(reportData.summary).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof value === 'number' && key.toLowerCase().includes('amount') 
                      ? `₹${value.toLocaleString()}` 
                      : value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Data Preview */}
          <div className="text-sm text-gray-600">
            <p>✓ Report generated successfully</p>
            <p>Click export buttons above to download the report</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportGenerator;
