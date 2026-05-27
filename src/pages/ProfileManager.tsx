import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { User, Lock, Save, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const ProfileManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile state
  const [fullName, setFullName] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  // Show/Hide password state
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    // Lấy thông tin user hiện tại (ví dụ fullname)
    const fetchUser = async () => {
      try {
        const res = await apiClient.get('/api/user');
        if (res.data) {
          setFullName(res.data.fullname || res.data.username || '');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showNotification('error', 'Vui lòng nhập họ và tên');
      return;
    }

    setIsLoadingProfile(true);
    try {
      const res = await apiClient.put('/api/cap-nhat-thong-tin', { FullName: fullName });
      if (res.data.success) {
        showNotification('success', res.data.message || 'Cập nhật thông tin thành công');
        // Tải lại trang sau một khoảng thời gian ngắn để cập nhật tên trên Header
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showNotification('error', res.data.message || 'Cập nhật thất bại');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Đã xảy ra lỗi');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      showNotification('error', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('error', 'Xác nhận mật khẩu không khớp');
      return;
    }
    if (newPassword.length < 6) {
      showNotification('error', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoadingPassword(true);
    try {
      const res = await apiClient.put('/api/doi-mat-khau', {
        OldPassword: oldPassword,
        NewPassword: newPassword,
        ConfirmPassword: confirmPassword
      });
      if (res.data.success) {
        showNotification('success', res.data.message || 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Đăng xuất sau khi đổi mật khẩu
        setTimeout(async () => {
          try {
            await apiClient.post('/api/dang-xuat');
            window.location.href = '/login';
          } catch (e) {
            window.location.href = '/login';
          }
        }, 1500);
      } else {
        showNotification('error', res.data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Đã xảy ra lỗi');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-slate-500 mt-2 text-sm">Quản lý thông tin cá nhân và bảo vệ an toàn cho tài khoản của bạn</p>
      </div>

      {notification && (
        <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 transition-all ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm shadow-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm shadow-rose-100'
          }`}>
          <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          </div>
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 flex items-center justify-center mb-5 ring-4 ring-white shadow-md relative overflow-hidden group">
              {/* Initials placeholder */}
              <span className="text-3xl font-extrabold text-blue-600 tracking-wider">
                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">{fullName || 'Người dùng'}</h2>
            <p className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Thành viên hệ thống</p>
          </div>

          <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <User size={18} className={activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'} />
              Hồ sơ cá nhân
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-3 w-full px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200 ${activeTab === 'password' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Lock size={18} className={activeTab === 'password' ? 'text-blue-600' : 'text-slate-400'} />
              Bảo mật & Mật khẩu
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="w-full md:w-2/3 lg:w-3/4">
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 min-h-[400px]">
            {activeTab === 'profile' ? (
              <div className="max-w-xl">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-800">Thông tin chung</h3>
                  <p className="text-sm text-slate-500 mt-1">Cập nhật tên hiển thị của bạn trên hệ thống</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Họ và tên</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400"
                      placeholder="Nhập họ và tên của bạn"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoadingProfile}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {isLoadingProfile ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save size={18} />
                          Lưu thay đổi
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="max-w-xl">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-800">Đổi mật khẩu</h3>
                  <p className="text-sm text-slate-500 mt-1">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Mật khẩu cũ</label>
                    <div className="relative group">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 pr-12"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                      >
                        {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Mật khẩu mới</label>
                    <div className="relative group">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 pr-12"
                        placeholder="Tối thiểu 6 ký tự 1 ký tự in hoa và 1 ký tự thường"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Xác nhận mật khẩu mới</label>
                    <div className="relative group">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800 placeholder:text-slate-400 pr-12"
                        placeholder="Nhập lại mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoadingPassword}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-slate-800/20 hover:shadow-slate-800/30 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {isLoadingPassword ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Lock size={18} />
                          Cập nhật mật khẩu
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;
