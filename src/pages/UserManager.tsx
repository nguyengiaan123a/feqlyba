
import React, { useState, useEffect } from 'react';
import apiClient from "../services/api";
import { Edit3, Trash2, Search, Plus, ChevronLeft, ChevronRight, X, Shield, User } from 'lucide-react';

// Định nghĩa interface cho dữ liệu User trả về từ danh sách
interface UserItem {
  id: string;
  username: string;
  fullName: string;
  fullname?: string;
  userName?: string;
  roleName?: string;
  role?: string;
  idDepartmentRoom?: string;
  chucVu?: string;
}

// Định nghĩa interface cho form data 
interface UserFormData {
  username: string;
  password?: string;
  fullname: string;
  idDepartmentRoom: string;
  roleName: string;
  chucVu: string;
}

interface role {
  id: string;
  name: string;
}

interface DepartmentRoom {
  id: string;
  room: string;
  status: number;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, pageSize: 15 });
  const [roles, setRoles] = useState<role[]>([]);
  const [departmentRooms, setDepartmentRooms] = useState<DepartmentRoom[]>([]);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState: UserFormData = {
    username: '',
    password: '',
    fullname: '',
    idDepartmentRoom: '',
    roleName: '',
    chucVu: ''
  };
  const [formData, setFormData] = useState<UserFormData>(initialFormState);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // 1. Lấy danh sách User
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/danh-sach-tai-khoan', {
        params: { page: pagination.currentPage, pagesize: pagination.pageSize, search: searchTerm }
      });
      setUsers(response.data.data || []);
      setPagination(prev => ({ ...prev, totalPages: response.data.totalPage || 1 }));
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Lấy danh sách role
  const fetchRoles = async () => {
    try {
      const response = await apiClient.get('/api/Role', { params: { page: 1, pagesize: 1000, search: "" } });
      setRoles(response.data.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách role:", error);
    }
  };

  // 3. Lấy danh sách Phòng ban
  const fetchDepartmentRooms = async () => {
    try {
      const response = await apiClient.get('/api/DepartmentRoomControlller', { params: { page: 1, pageSize: 1000 } });
      setDepartmentRooms(response.data.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách phòng ban:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRoles();
    fetchDepartmentRooms();
  }, [pagination.currentPage, searchTerm]);

  // 4. Thêm mới hoặc Cập nhật
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.username || !formData.fullname || !formData.idDepartmentRoom || !formData.roleName) {
        alert("Vui lòng điền đầy đủ các trường bắt buộc!");
        return;
      }

      if (!editingId && !formData.password) {
        alert("Mật khẩu không được để trống khi tạo tài khoản mới!");
        return;
      }

      if (formData.password) {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{6,}$/;
        if (!passwordRegex.test(formData.password)) {
          alert("Mật khẩu phải có ít nhất 6 ký tự, bao gồm ít nhất 1 chữ in hoa, 1 số và 1 ký tự đặc biệt\nVí dụ: Abc123@");
          return;
        }
      }

      const payload: any = {
        Username: formData.username,
        Fullname: formData.fullname,
        idDepartmentRoom: formData.idDepartmentRoom,
        RoleName: formData.roleName,
        ChucVu: formData.chucVu
      };

      if (formData.password) {
        payload.Password = formData.password;
      }

      if (editingId) {
        await apiClient.put(`/api/cap-nhat-tai-khoan/${editingId}`, payload);
        alert("Cập nhật tài khoản thành công!");
      } else {
        await apiClient.post('/api/dang-ky-tai-khoan', payload);
        alert("Tạo tài khoản mới thành công!");
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Lỗi chi tiết:", error.response?.data);
      alert(error.response?.data?.message || "Thao tác thất bại! Vui lòng kiểm tra lại dữ liệu.");
    }
  };

  // 5. Xóa User
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await apiClient.delete(`/api/xoa-tai-khoan/${itemToDelete}`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi xóa!");
    }
  };

  const confirmDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const openEdit = (item: any) => {
    console.log("Dữ liệu item từ API:", item);
    setEditingId(item.id);
    setFormData({
      username: item.username || item.userName || '',
      password: item.password || '', // Luôn để trống password khi mở form sửa
      fullname: item.fullname || item.fullName || '',
      // ✅ FIX: Ép kiểu về chữ thường để so sánh chuẩn xác với thẻ option
      idDepartmentRoom: item.idDepartmentRoom ? item.idDepartmentRoom.toLowerCase() : '',
      roleName: item.role ? item.role.toLowerCase() : '',
      chucVu: item.chucVu || ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormState);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden bg-white font-sans text-gray-800">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-3 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quản lý Tài khoản</h1>
          <p className="text-xs text-gray-500">Danh sách người dùng và phân quyền hệ thống</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm tên hoặc tài khoản..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all active:scale-95 text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600 w-16 text-center">STT</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600">Tài khoản</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600">Họ và tên</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600">Chức vụ</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600">Phòng ban</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600 text-center w-32">Quyền (Role)</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600 text-right w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-sm text-gray-400">Không tìm thấy dữ liệu</td></tr>
            ) : (
              users.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-3 text-center font-medium text-sm text-gray-500">
                    {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-800">{item.username || item.userName}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter">ID: {item.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-700">
                    {item.fullName || item.fullname}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-700">
                    {item.chucVu || '—'}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-700">
                    {item.idDepartmentRoom?.toUpperCase() || 'N/A'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center gap-1 w-max mx-auto">
                      <Shield className="w-3 h-3" />
                      {item.role || item.roleName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => confirmDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0 text-xs">
        <span className="font-medium text-gray-500">Trang {pagination.currentPage} / {pagination.totalPages}</span>
        <div className="flex gap-1">
          <button
            disabled={pagination.currentPage === 1}
            onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
            className="p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:opacity-30 text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
            onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
            className="p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:opacity-30 text-gray-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL THÊM / SỬA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold uppercase text-gray-700">{editingId ? 'Chỉnh sửa Tài khoản' : 'Tạo Tài khoản mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Tài khoản (Username) <span className="text-red-500">*</span></label>
                  <input type="text" disabled={!!editingId} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Nhập tên đăng nhập" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                  <input type="password" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingId ? "Bỏ trống nếu không đổi" : "Ví dụ: Abc123@"} />
                  {!editingId && <p className="text-[10px] text-gray-400 mt-1">Tối thiểu 6 ký tự, 1 chữ in hoa, 1 số, 1 ký tự đặc biệt</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Họ và tên (Fullname) <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.fullname} onChange={(e) => setFormData({ ...formData, fullname: e.target.value })} placeholder="Nhập họ và tên đầy đủ" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Chức vụ</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={formData.chucVu} onChange={(e) => setFormData({ ...formData, chucVu: e.target.value })} placeholder="VD: Trưởng khoa..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Phòng ban / Khoa <span className="text-red-500">*</span></label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
                    value={formData.idDepartmentRoom}
                    onChange={(e) => setFormData({ ...formData, idDepartmentRoom: e.target.value })}
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departmentRooms
                      // ✅ FIX: Lọc cho phép hiển thị nếu phòng ban đang hoạt động (status === 1) 
                      // HOẶC phòng ban đó là phòng đang được edit (để tránh bị mất dữ liệu cũ trên form)
                      .filter(d => d.status === 1 || (editingId && d.id.toLowerCase() === formData.idDepartmentRoom))
                      .map((dept) => (
                        // ✅ FIX: Đưa ID về lowercase để khớp 100% với formData
                        <option key={dept.id} value={dept.id.toLowerCase()}>
                          {dept.room}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Phân quyền (RoleName) <span className="text-red-500">*</span></label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
                    value={formData.roleName}
                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  >
                    <option value="">-- Chọn phân quyền --</option>
                    {roles.map((role) => (
                      // ✅ FIX: Đưa name về lowercase để khớp 100% với formData
                      <option key={role.id} value={role.name.toLowerCase()}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-all active:scale-[0.98] text-sm uppercase">
                  Lưu dữ liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1000] animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-xs shadow-xl p-6 text-center border border-gray-200 zoom-in-95">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold mb-1">Xác nhận xóa tài khoản?</h3>
            <p className="text-xs text-gray-500 mb-5">Hành động này sẽ xóa dữ liệu người dùng và không thể hoàn tác.</p>
            <div className="flex gap-2">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg text-xs transition-colors">Hủy</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors">Xóa ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;

