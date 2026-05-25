import { useState, useEffect } from 'react';
import apiClient from "../services/api";
import { Building2, ShieldAlert, Clock, FileText, Search, RefreshCw, AlertCircle, ArrowRight, ShieldCheck, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStat {
  id: string;
  room: string;
  expiredCount: number;
  soonToExpireCount: number;
  validCount: number;
  totalCount: number;
}

export default function Index() {
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch user info
      const userRes = await apiClient.get('/api/user');
      setUserName(userRes.data.fullname || userRes.data.username || 'Thành viên');
      const roles: string[] = userRes.data.roles || [];
      setIsAdmin(roles.some(r => r.toUpperCase() === 'ADMIN'));

      // 2. Fetch dashboard stats
      const statsRes = await apiClient.get('/api/Dashboard');
      setStats(statsRes.data.data || []);
    } catch (err: any) {
      console.error("Lỗi tải dữ liệu dashboard:", err);
      setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filtered stats by search term
  const filteredStats = stats.filter(s =>
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute totals
  const totalDepartments = stats.length;
  const totalExpired = stats.reduce((acc, curr) => acc + curr.expiredCount, 0);
  const totalSoonToExpire = stats.reduce((acc, curr) => acc + curr.soonToExpireCount, 0);
  const totalValid = stats.reduce((acc, curr) => acc + (curr.validCount || 0), 0);
  const totalRecords = stats.reduce((acc, curr) => acc + curr.totalCount, 0);

  const getSystemHealth = () => {
    if (totalExpired > 0) return { text: "Cần chú ý: Có hồ sơ đã hết hạn lưu trữ", color: "text-red-600 bg-red-50 border-red-200" };
    if (totalSoonToExpire > 0) return { text: "Cảnh báo: Có hồ sơ sắp hết hạn lưu trữ trong năm nay", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { text: "Hệ thống an toàn - Không có hồ sơ nào quá hạn", color: "text-green-600 bg-green-50 border-green-200" };
  };

  const systemHealth = getSystemHealth();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 blur-xl w-64 h-64 bg-white rounded-full"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
            {isAdmin ? "👑 Quản trị viên hệ thống" : "🏢 Thành viên phòng ban"}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Xin chào, {userName}!</h2>
          <p className="text-sm text-blue-100 max-w-xl">
            Chào mừng bạn đến với Hệ thống Quản lý Hồ sơ hành chính MPH. Dưới đây là báo cáo tổng quan tình trạng hồ sơ hiện tại.
          </p>
        </div>
      </div>

      {/* System Health Status */}
      <div className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all ${systemHealth.color} shadow-sm`}>
        {totalExpired > 0 ? (
          <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
        ) : totalSoonToExpire > 0 ? (
          <Clock className="w-5 h-5 shrink-0 text-amber-500" />
        ) : (
          <ShieldCheck className="w-5 h-5 shrink-0 text-green-500" />
        )}
        <span>{systemHealth.text}</span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">

        {/* Card 1: Departments */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Phòng chức năng</span>
            <h3 className="text-2xl font-black text-gray-800 font-sans">{totalDepartments}</h3>
            <p className="text-xs text-gray-400">Phân quyền hoạt động</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Expired Documents */}
        <div className="bg-gradient-to-br from-red-50 to-rose-100 p-6 rounded-2xl shadow-sm border border-red-200 flex items-center justify-between hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hồ sơ đã hết hạn</span>
            <h3 className={`text-2xl font-black font-sans ${totalExpired > 0 ? 'text-red-600' : 'text-gray-800'}`}>
              {totalExpired}
            </h3>
            <p className="text-xs text-gray-400">Yêu cầu tiêu hủy</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${totalExpired > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'
            }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>


        {/* Card 3: Soon to Expire */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-6 rounded-2xl shadow-sm border border-amber-200 flex items-center justify-between hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hồ sơ sắp hết hạn</span>
            <h3 className={`text-2xl font-black font-sans ${totalSoonToExpire > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
              {totalSoonToExpire}
            </h3>
            <p className="text-xs text-gray-400">Hết hạn trong năm nay</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${totalSoonToExpire > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'
            }`}>
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Records */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 p-6 rounded-2xl shadow-sm border border-indigo-200 flex items-center justify-between hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tổng số hồ sơ</span>
            <h3 className="text-2xl font-black text-gray-800 font-sans">{totalRecords}</h3>
            <p className="text-xs text-gray-400">Hồ sơ lưu trữ trên hệ thống</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 5: Valid Records */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-6 rounded-2xl shadow-sm border border-green-200 flex items-center justify-between hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hồ sơ còn hạn</span>
            <h3 className="text-2xl font-black text-green-600 font-sans">{totalValid}</h3>
            <p className="text-xs text-gray-400">Đang lưu trữ hợp lệ</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tỷ Lệ Tình Trạng Hồ Sơ</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="3" dy="5" stdDeviation="4" floodOpacity="0.4" />
                  </filter>
                  <linearGradient id="gradValid" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  <linearGradient id="gradExpired" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                  <linearGradient id="gradSoon" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <Pie
                  data={[
                    { name: 'Còn hạn', value: totalValid, fill: 'url(#gradValid)' },
                    { name: 'Sắp hết hạn', value: totalSoonToExpire, fill: 'url(#gradSoon)' },
                    { name: 'Đã hết hạn', value: totalExpired, fill: 'url(#gradExpired)' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  style={{ filter: 'url(#shadow3d)' }}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell key="cell-0" />
                  <Cell key="cell-1" />
                  <Cell key="cell-2" />
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Thống Kê Theo Phòng Ban</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.slice(0, 10)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <filter id="barShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
                  </filter>
                  <linearGradient id="barGradValid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                  <linearGradient id="barGradSoon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="barGradExpired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="validCount" name="Còn hạn" fill="url(#barGradValid)" radius={[6, 6, 0, 0]} style={{ filter: 'url(#barShadow)' }} />
                <Bar dataKey="soonToExpireCount" name="Sắp hết" fill="url(#barGradSoon)" radius={[6, 6, 0, 0]} style={{ filter: 'url(#barShadow)' }} />
                <Bar dataKey="expiredCount" name="Đã hết hạn" fill="url(#barGradExpired)" radius={[6, 6, 0, 0]} style={{ filter: 'url(#barShadow)' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Section Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-800">Thống Kê Chi Tiết Theo Phòng Ban</h3>
            <p className="text-xs text-gray-500">
              {isAdmin ? "Danh sách toàn bộ các phòng chức năng thuộc viện" : "Báo cáo thống kê dành cho phòng ban của bạn"}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm phòng ban..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs transition-all placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-500 hover:text-gray-800 transition-colors shadow-sm shrink-0"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table/Data Area */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <p className="text-xs text-gray-400 mt-2.5 font-medium">Đang tổng hợp báo cáo...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 px-4">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase shadow-sm transition-all"
              >
                Tải lại trang
              </button>
            </div>
          ) : filteredStats.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400 font-medium">
              Không tìm thấy phòng ban nào khớp với tìm kiếm.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4 w-28 text-center">Mã phòng</th>
                  <th className="px-6 py-4">Tên phòng chức năng</th>
                  <th className="px-6 py-4 text-center w-40">Số hồ sơ còn hạn</th>
                  <th className="px-6 py-4 text-center w-44">Số hồ sơ đã hết hạn</th>
                  <th className="px-6 py-4 text-center w-44">Số hồ sơ sắp hết hạn</th>
                  <th className="px-6 py-4 text-center w-32">Tổng số hồ sơ</th>
                  <th className="px-6 py-4 text-center w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredStats.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-center font-bold font-mono text-blue-600 uppercase">
                        {item.id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {item.room}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-green-100 text-green-700 border border-green-200 shadow-sm">
                          {item.validCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.expiredCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                            {item.expiredCount} hồ sơ
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.soonToExpireCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {item.soonToExpireCount} hồ sơ
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-700">
                        {item.totalCount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate('/quan-ly-ho-so')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-[10px] transition-all active:scale-[0.97]"
                        >
                          Chi tiết
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}