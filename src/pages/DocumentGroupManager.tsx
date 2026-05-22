import React, { useState, useEffect } from 'react';
import apiClient from "../services/api";
import { Edit3, Trash2, Search, Plus, ChevronLeft, ChevronRight, X, Folder } from 'lucide-react';

// Interface cho item DocumentGroup trả về từ API
interface DocumentGroupItem {
  id: number;
  title: string;
  createdDate: string;
  status: number;
  thumnail: string;
  id_DepartmentRoom: string;
}

// Interface cho form data
interface DocumentGroupFormData {
  id: number;
  title: string;
  status: number;
  thumnail: string;
  id_DepartmentRoom: string;
}


const DocumentGroupManager: React.FC = () => {
  const [documentGroups, setDocumentGroups] = useState<DocumentGroupItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, pageSize: 15 });



  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const initialFormState: DocumentGroupFormData = {
    id: 0,
    title: '',
    status: 1,
    thumnail: '#',
    id_DepartmentRoom: ''
  };
  const [formData, setFormData] = useState<DocumentGroupFormData>(initialFormState);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // 1. Lấy danh sách Nhóm tài liệu
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/Documentgroup', {
        params: { page: pagination.currentPage, pageSize: pagination.pageSize }
      });
      setDocumentGroups(response.data.data || []);
      setPagination(prev => ({ ...prev, totalPages: response.data.totalPages || 1 }));
    } catch (error) {
      console.error("Lỗi lấy dữ liệu nhóm tài liệu:", error);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchData();
  }, [pagination.currentPage, searchTerm]);

  // 3. Thêm mới hoặc Cập nhật
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        createdDate: new Date().toISOString()
      };

      if (editingId) {
        await apiClient.put(`/api/Documentgroup/${editingId}`, payload);
      } else {
        await apiClient.post('/api/Documentgroup', payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Thao tác thất bại! Vui lòng kiểm tra lại dữ liệu.");
    }
  };

  // 4. Xóa Nhóm tài liệu
  const handleDelete = async () => {
    if (itemToDelete === null) return;
    try {
      await apiClient.delete(`/api/Documentgroup/${itemToDelete}`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi xóa!");
    }
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const openEdit = (item: DocumentGroupItem) => {
    setEditingId(item.id);
    setFormData({
      id: item.id || 0,
      title: item.title || '',
      status: item.status ?? 1,
      thumnail: item.thumnail || '',
      // ✅ FIX ÉP CHỮ THƯỜNG CHO PHÒNG BAN: Để khớp với select option
      id_DepartmentRoom: item.id_DepartmentRoom ? item.id_DepartmentRoom.toLowerCase() : ''
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormState);
  };

  const filteredGroups = searchTerm
    ? documentGroups.filter(g => g.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    : documentGroups;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden bg-white font-sans text-gray-800">

      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-3 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quản lý Nhóm tài liệu</h1>
          <p className="text-xs text-gray-500">Danh sách các nhóm/thư mục tài liệu của phòng ban</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm tên nhóm tài liệu..."
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
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600 w-16 text-center">STT</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600">Tên nhóm tài liệu</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600 text-center w-40">Mã phòng ban</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600 text-center w-44">Ngày tạo</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600 text-center w-32">Trạng thái</th>
              <th className="px-5 py-3 font-bold text-xs uppercase text-gray-600 text-right w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></td></tr>
            ) : filteredGroups.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-sm text-gray-400">Không tìm thấy dữ liệu</td></tr>
            ) : (
              filteredGroups.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-3 text-center font-medium text-sm text-gray-500">
                    {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">

                      <div>
                        <div className="font-semibold text-sm text-gray-800">{item.title}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter">ID: {item.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center text-sm text-gray-600 font-medium">
                    {item.id_DepartmentRoom?.toUpperCase() || '—'}
                  </td>
                  <td className="px-5 py-3 text-center text-sm text-gray-600">
                    {item.createdDate ? new Date(item.createdDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 1
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                      {item.status === 1 ? 'Hoạt động' : 'Ngừng'}
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
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold uppercase text-gray-700">{editingId ? 'Chỉnh sửa Nhóm tài liệu' : 'Thêm Nhóm tài liệu mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Tên nhóm tài liệu <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tên nhóm tài liệu..."
                />
              </div>



              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                >
                  <option value={1}>Hoạt động</option>
                  <option value={0}>Ngừng hoạt động</option>
                </select>
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
            <h3 className="text-base font-bold mb-1">Xác nhận xóa nhóm?</h3>
            <p className="text-xs text-gray-500 mb-5">Hành động này sẽ xóa nhóm tài liệu và không thể hoàn tác.</p>
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

export default DocumentGroupManager;