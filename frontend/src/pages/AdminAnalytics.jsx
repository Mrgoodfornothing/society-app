import { useMemo } from 'react'; // Optimization hook
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Download, TrendingUp, AlertCircle, CheckCircle, UserX } from 'lucide-react';

// Register Chart Components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminAnalytics = ({ residents, bills }) => {
  
  // 1. Calculate Real Stats
  const totalRevenue = bills.reduce((acc, bill) => acc + (bill.status === 'paid' ? bill.amount : 0), 0);
  const pendingAmount = bills.reduce((acc, bill) => acc + (bill.status === 'pending' ? bill.amount : 0), 0);
  const paidCount = bills.filter(b => b.status === 'paid').length;
  const pendingCount = bills.filter(b => b.status === 'pending').length;

  // 2. DYNAMIC MONTHLY REVENUE CALCULATION
  const monthlyRevenue = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth = new Array(12).fill(0);

    bills.forEach(bill => {
      if (bill.status === 'paid') {
        const monthIndex = new Date(bill.paymentDate || bill.createdAt).getMonth();
        revenueByMonth[monthIndex] += bill.amount;
      }
    });

    return { labels: months, data: revenueByMonth };
  }, [bills]);

  // 3. Chart Data Configuration
  const revenueData = {
    labels: monthlyRevenue.labels,
    datasets: [
      {
        label: 'Revenue Collection (₹)',
        data: monthlyRevenue.data, // NOW REAL DATA
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const statusData = {
    labels: ['Paid Bills', 'Pending Bills'],
    datasets: [
      {
        data: [paidCount, pendingCount],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderWidth: 0,
      },
    ],
  };

  // 4. FIND TOP DEFAULTERS (Residents with most pending bills)
  const defaulters = useMemo(() => {
    const pendingBills = bills.filter(b => b.status === 'pending');
    const counts = {};
    
    pendingBills.forEach(bill => {
        const name = bill.resident?.name || "Unknown";
        if(!counts[name]) counts[name] = 0;
        counts[name] += bill.amount;
    });

    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a) // Sort by highest amount
        .slice(0, 3); // Top 3
  }, [bills]);

  // 5. Excel Export Logic (FIXED NAME DISPLAY)
  const exportToExcel = () => {
    const dataToExport = bills.map(bill => ({
      Title: bill.title,
      Amount: bill.amount,
      Status: bill.status.toUpperCase(),
      Date_Created: new Date(bill.createdAt).toLocaleDateString(),
      Date_Paid: bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString() : 'N/A',
      Resident: bill.resident?.name || "Unknown User", // Correctly gets name
      Flat: bill.resident?.flatNumber || "N/A"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financials");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    
    saveAs(data, `Society_Financials_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-700 dark:text-white">Financial Health</h3>
        <button 
          onClick={exportToExcel}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-lg"
        >
          <Download size={18} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-xl border-l-4 border-indigo-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm">Total Revenue</p>
                    <h3 className="text-2xl font-bold dark:text-white">₹ {totalRevenue}</h3>
                </div>
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><TrendingUp size={20} /></div>
            </div>
        </div>
        <div className="glass p-6 rounded-xl border-l-4 border-red-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm">Pending Dues</p>
                    <h3 className="text-2xl font-bold text-red-500">₹ {pendingAmount}</h3>
                </div>
                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={20} /></div>
            </div>
        </div>
        <div className="glass p-6 rounded-xl border-l-4 border-green-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-sm">Collection Rate</p>
                    <h3 className="text-2xl font-bold text-green-500">
                       {paidCount + pendingCount > 0 ? ((paidCount / (paidCount + pendingCount)) * 100).toFixed(0) : 0}%
                    </h3>
                </div>
                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={20} /></div>
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl">
          <h4 className="font-bold mb-4 text-slate-700 dark:text-white">Revenue Trend (Monthly)</h4>
          <div className="h-64">
            <Bar data={revenueData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        
        {/* Payment Status & Defaulters */}
        <div className="space-y-6">
            <div className="glass p-6 rounded-xl flex flex-col items-center">
                <h4 className="font-bold mb-4 text-slate-700 dark:text-white">Payment Status</h4>
                <div className="w-48">
                    <Doughnut data={statusData} />
                </div>
            </div>

            {/* NEW: Top Pending Dues */}
            <div className="glass p-4 rounded-xl">
                <h4 className="font-bold mb-2 text-slate-700 dark:text-white flex items-center gap-2">
                    <UserX size={16} className="text-red-500"/> Highest Pending Dues
                </h4>
                {defaulters.length === 0 ? <p className="text-xs text-slate-500">Everyone is paid up!</p> : (
                    <ul className="space-y-2">
                        {defaulters.map(([name, amount], index) => (
                            <li key={index} className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-1">
                                <span className="text-slate-600 dark:text-slate-300">{name}</span>
                                <span className="font-bold text-red-500">₹{amount}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;