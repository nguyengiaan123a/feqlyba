import React, { useState, useEffect } from 'react';
import apiClient from "../services/api";
import { Edit3, Trash2, Search, Plus, ChevronLeft, ChevronRight, X, Paperclip, UploadCloud, Download, FileText, Trash } from 'lucide-react';
import { PATH_IMAGES } from '../types/PathImages';

// Interface cho item DocumentRecord trả về từ API
interface DocumentRecordItem {
    id: number;
    maHoSo: string;
    title: string;
    id_DepartmentRoom: string;
    tenPhongBan: string;
    namHieuLuc: number;
    thoiHanLuuTru: number;
    namHetHan: number | null;
    viTriLuuTru: string;
    nguoiQuanLy: string;
    tinhTrang: string;
    trangThai: string;
    mucDoBaoMat: string;
    ghiChu: string;
    id_DocumentGroup: number | null;
    tenNhomHoSo: string;
    createdDate: string;
}

// Interface cho DocumentGroup (phòng ban)
interface DocumentGroupItem {
    id: number;
    title: string;
    id_DepartmentRoom: string;
}

// Interface cho form data
interface DocumentRecordFormData {
    id: number;
    maHoSo: string;
    title: string;
    namHieuLuc: number;
    thoiHanLuuTru: number;
    viTriLuuTru: string;
    nguoiQuanLy: string;
    tinhTrang: string;
    mucDoBaoMat: string;
    ghiChu: string;
    id_DocumentGroup: number | string;
}
// interface DepartmentRoom

interface DepartmentRoom {
    id: string;
    room: string;
    status: number;
}

// Interface cho file đính kèm
interface DocumentFileVM {
    id: number;
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    createdDate: string;
    id_DocumentRecord: number;
}
const DocumentRecordManager: React.FC = () => {
    const [documentRecords, setDocumentRecords] = useState<DocumentRecordItem[]>([]);
    const [documentGroups, setDocumentGroups] = useState<DocumentGroupItem[]>([]); // Để chọn nhóm hồ sơ
    const [loading, setLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, pageSize: 15 });

    // Role state
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [filterDepartmentId, setFilterDepartmentId] = useState<string>(''); // Lọc theo phòng ban (admin)
    const [filterDocumentGroupId, setFilterDocumentGroupId] = useState<string>(''); // Lọc theo nhóm hồ sơ (tất cả user)
    const [filterDepartment, setFilterDepartment] = useState<DepartmentRoom[]>([]); // Lọc theo phòng ban (admin)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // File management states
    const [selectedRecordForFiles, setSelectedRecordForFiles] = useState<DocumentRecordItem | null>(null);
    const [isFilesModalOpen, setIsFilesModalOpen] = useState<boolean>(false);
    const [recordFiles, setRecordFiles] = useState<DocumentFileVM[]>([]);
    const [filesLoading, setFilesLoading] = useState<boolean>(false);
    const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
    const [tempFiles, setTempFiles] = useState<File[]>([]);

    const initialFormState: DocumentRecordFormData = {
        id: 0,
        maHoSo: '',
        title: '',
        namHieuLuc: new Date().getFullYear(),
        thoiHanLuuTru: 10,
        viTriLuuTru: '',
        nguoiQuanLy: '',
        tinhTrang: 'Tốt',
        mucDoBaoMat: 'Thường',
        ghiChu: '',
        id_DocumentGroup: ''
    };
    const [formData, setFormData] = useState<DocumentRecordFormData>(initialFormState);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    // 0. Lấy thông tin user (kiểm tra role admin)
    const fetchUserInfo = async () => {
        try {
            const response = await apiClient.get('/api/user');
            const roles: string[] = response.data.roles || [];
            const hasAdmin = roles.some((r: string) => r.toLowerCase() === 'admin');
            setIsAdmin(hasAdmin);
        } catch (error) {
            console.error("Lỗi lấy thông tin user:", error);
            setIsAdmin(false);
        }
    };

    // 1. Lấy danh sách Hồ sơ
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/DocumentRecord', {
                params: {
                    page: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    search: searchTerm,
                    Id_DocumentGroup: filterDocumentGroupId || undefined,
                    Id_DepartmentRoom: filterDepartmentId || undefined
                }
            });
            const data: DocumentRecordItem[] = response.data.data || [];

            setDocumentRecords(data);
            setPagination(prev => ({ ...prev, totalPages: response.data.totalPages || 1 }));
        } catch (error) {
            console.error("Lỗi lấy dữ liệu hồ sơ:", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. Lấy danh sách Nhóm Hồ Sơ (để đổ vào Select)
    const fetchGroups = async () => {
        try {
            const response = await apiClient.get('/api/Documentgroup', {
                params: { page: 1, pageSize: 1000 }
            });
            const groups = response.data.data || [];
            setDocumentGroups(groups);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu nhóm hồ sơ:", error);
        }
    };
    const fetchDeparment = async () => {
        try {
            const response = await apiClient.get('/api/DepartmentRoomControlller', {
                params: { page: 1, pageSize: 1000 }
            });
            const groups = response.data.data || [];
            setFilterDepartment(groups);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu nhóm hồ sơ:", error);
        }
    };

    useEffect(() => {
        fetchUserInfo();
        fetchGroups();
        fetchDeparment();
    }, []);

    useEffect(() => {
        fetchData();
    }, [pagination.currentPage, filterDepartmentId, filterDocumentGroupId]);

    // Thêm debounce cho search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (pagination.currentPage !== 1) {
                setPagination(prev => ({ ...prev, currentPage: 1 }));
            } else {
                fetchData();
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // 3. Thêm mới hoặc Cập nhật
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                id_DocumentGroup: formData.id_DocumentGroup ? Number(formData.id_DocumentGroup) : null
            };

            if (editingId) {
                await apiClient.put(`/api/DocumentRecord/${editingId}`, payload);
            } else {
                await apiClient.post('/api/DocumentRecord', payload);
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Thao tác thất bại! Vui lòng kiểm tra lại dữ liệu.");
        }
    };

    // 4. Xóa
    const handleDelete = async () => {
        if (itemToDelete === null) return;
        try {
            await apiClient.delete(`/api/DocumentRecord/${itemToDelete}`);
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

    const openEdit = (item: DocumentRecordItem) => {
        setEditingId(item.id);
        setFormData({
            id: item.id || 0,
            maHoSo: item.maHoSo || '',
            title: item.title || '',
            namHieuLuc: item.namHieuLuc || new Date().getFullYear(),
            thoiHanLuuTru: item.thoiHanLuuTru || 10,
            viTriLuuTru: item.viTriLuuTru || '',
            nguoiQuanLy: item.nguoiQuanLy || '',
            tinhTrang: item.tinhTrang || 'Tốt',
            mucDoBaoMat: item.mucDoBaoMat || 'Thường',
            ghiChu: item.ghiChu || '',
            id_DocumentGroup: item.id_DocumentGroup || ''
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData(initialFormState);
    };

    // Helpers for file size and date formatting
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    // Fetch files for a record
    const fetchRecordFiles = async (recordId: number) => {
        setFilesLoading(true);
        try {
            const response = await apiClient.get(`/api/DocumentRecord/${recordId}/files`);
            setRecordFiles(response.data || []);
        } catch (error) {
            console.error("Lỗi lấy danh sách file:", error);
        } finally {
            setFilesLoading(false);
        }
    };

    const openFilesModal = (item: DocumentRecordItem) => {
        setSelectedRecordForFiles(item);
        setIsFilesModalOpen(true);
        setTempFiles([]);
        fetchRecordFiles(item.id);
    };

    const closeFilesModal = () => {
        setSelectedRecordForFiles(null);
        setIsFilesModalOpen(false);
        setRecordFiles([]);
        setTempFiles([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setTempFiles(prev => [...prev, ...filesArray]);
        }
    };

    const handleUpload = async () => {
        if (!selectedRecordForFiles || tempFiles.length === 0) return;
        setUploadingFiles(true);
        try {
            const formDataObj = new FormData();
            tempFiles.forEach(file => {
                formDataObj.append("files", file);
            });

            await apiClient.post(`/api/DocumentRecord/${selectedRecordForFiles.id}/files`, formDataObj, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            
            setTempFiles([]);
            fetchRecordFiles(selectedRecordForFiles.id);
        } catch (error: any) {
            console.error("Lỗi upload file:", error);
            alert(error.response?.data?.message || "Tải file lên thất bại!");
        } finally {
            setUploadingFiles(false);
        }
    };

    const handleDeleteFile = async (fileId: number) => {
        if (!selectedRecordForFiles) return;
        const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa file này?");
        if (!confirmDelete) return;

        try {
            await apiClient.delete(`/api/DocumentRecord/files/${fileId}`);
            fetchRecordFiles(selectedRecordForFiles.id);
        } catch (error: any) {
            console.error("Lỗi xóa file:", error);
            alert(error.response?.data?.message || "Xóa file thất bại!");
        }
    };

    // Helper: Lấy class CSS cho badge trạng thái
    const getTrangThaiClass = (trangThai: string) => {
        if (trangThai === 'AN TOÀN') return 'bg-green-50 text-green-700 border border-green-200';
        if (trangThai === 'ĐÃ HẾT HẠN - CẦN TIÊU HỦY') return 'bg-red-50 text-red-700 border border-red-200';
        if (trangThai.includes('SẮP HẾT HẠN')) return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
        return 'bg-gray-100 text-gray-500 border border-gray-200';
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden bg-white font-sans text-gray-800">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-3 bg-white shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Quản lý Hồ sơ / Tài liệu</h1>
                    <p className="text-xs text-gray-500">Danh sách các hồ sơ lưu trữ của phòng ban</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                    {/* Select lọc theo phòng ban - chỉ hiện khi admin */}
                    {isAdmin && (
                        <select
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[180px]"
                            value={filterDepartmentId}
                            onChange={(e) => {
                                setFilterDepartmentId(e.target.value);
                                setPagination(prev => ({ ...prev, currentPage: 1 }));
                            }}
                        >
                            <option value="">-- Tất cả phòng ban --</option>
                            {filterDepartment.map(g => (
                                <option key={g.id} value={g.id}>{g.room}</option>
                            ))}
                        </select>
                    )}

                    {/* Select lọc theo nhóm hồ sơ - hiển thị cho tất cả user */}
                    <select
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[180px]"
                        value={filterDocumentGroupId}
                        onChange={(e) => {
                            setFilterDocumentGroupId(e.target.value);
                            setPagination(prev => ({ ...prev, currentPage: 1 }));
                        }}
                    >
                        <option value="">-- Tất cả nhóm hồ sơ --</option>
                        {documentGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.title}</option>
                        ))}
                    </select>

                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm tên hồ sơ..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                            value={searchTerm}
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
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-gray-600 w-12 text-center">STT</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-gray-600">Hồ sơ</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-gray-600 text-center">Năm HL</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-gray-600 text-center">Lưu trữ</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-gray-600 text-center">Hết hạn</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-gray-600 text-center">Vị trí</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-gray-600 text-center">Tình trạng</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-gray-600 text-center">Trạng thái</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-gray-600 text-center">Bảo mật</th>
                            <th className="px-4 py-3 font-bold text-xs uppercase text-gray-600 text-right w-24">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={10} className="text-center py-10"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></td></tr>
                        ) : documentRecords.length === 0 ? (
                            <tr><td colSpan={10} className="text-center py-10 text-sm text-gray-400">Không tìm thấy dữ liệu</td></tr>
                        ) : (
                            documentRecords.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-4 py-3 text-center font-medium text-sm text-gray-500">
                                        {(pagination.currentPage - 1) * pagination.pageSize + index + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <div className="font-semibold text-sm text-gray-800">{item.title}</div>
                                                <div className="text-[10px] text-gray-500 flex gap-2 mt-0.5">
                                                    <span className="font-mono text-blue-600 font-bold">{item.maHoSo || '—'}</span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[150px]">{item.tenNhomHoSo || 'Không nhóm'}</span>
                                                    <span>•</span>
                                                    <span>{item.tenPhongBan || item.id_DepartmentRoom?.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-600 font-medium">
                                        {item.namHieuLuc || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                                        {item.thoiHanLuuTru >= 999 ? 'Vĩnh viễn' : `${item.thoiHanLuuTru} năm`}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                        {item.namHetHan || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                                        {item.viTriLuuTru || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                                        {item.tinhTrang || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {item.trangThai ? (
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getTrangThaiClass(item.trangThai)}`}>
                                                {item.trangThai}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.mucDoBaoMat === 'Thường' ? 'bg-gray-100 text-gray-600' :
                                            item.mucDoBaoMat === 'Mật' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                                'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                            {item.mucDoBaoMat || 'Thường'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openFilesModal(item)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-all" title="Tệp đính kèm"><Paperclip className="w-4 h-4" /></button>
                                            <button onClick={() => openEdit(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Chỉnh sửa"><Edit3 className="w-4 h-4" /></button>
                                            <button onClick={() => confirmDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Xóa"><Trash2 className="w-4 h-4" /></button>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[999] overflow-y-auto">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200 my-8">
                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                            <h3 className="text-sm font-bold uppercase text-gray-700">{editingId ? 'Chỉnh sửa Hồ sơ' : 'Thêm Hồ sơ mới'}</h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Mã Hồ Sơ - người dùng tự nhập */}
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Mã Hồ Sơ (MAHS) <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.maHoSo}
                                        onChange={(e) => setFormData({ ...formData, maHoSo: e.target.value })}
                                        placeholder="Nhập mã hồ sơ (VD: HS-001)..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nhóm Hồ sơ</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.id_DocumentGroup}
                                        onChange={(e) => setFormData({ ...formData, id_DocumentGroup: e.target.value })}
                                    >
                                        <option value="">-- Chọn nhóm hồ sơ (Không bắt buộc) --</option>
                                        {documentGroups.map(g => (
                                            <option key={g.id} value={g.id}>{g.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Tên Hồ sơ / Tài liệu <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Nhập tên hồ sơ..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Người quản lý</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.nguoiQuanLy}
                                        onChange={(e) => setFormData({ ...formData, nguoiQuanLy: e.target.value })}
                                        placeholder="Tên người quản lý..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Năm hiệu lực <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.namHieuLuc}
                                        onChange={(e) => setFormData({ ...formData, namHieuLuc: Number(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Thời hạn lưu trữ (Năm) <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            required
                                            type="number"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.thoiHanLuuTru}
                                            onChange={(e) => setFormData({ ...formData, thoiHanLuuTru: Number(e.target.value) })}
                                        />
                                        <div className="text-xs text-gray-400 whitespace-nowrap">(999 = Vĩnh viễn)</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Vị trí lưu trữ</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.viTriLuuTru}
                                        onChange={(e) => setFormData({ ...formData, viTriLuuTru: e.target.value })}
                                        placeholder="Kho/Tủ/Kệ..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Tình trạng</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.tinhTrang}
                                        onChange={(e) => setFormData({ ...formData, tinhTrang: e.target.value })}
                                    >
                                        <option value="Tốt">Tốt</option>
                                        <option value="Hư hỏng nhẹ">Hư hỏng nhẹ</option>
                                        <option value="Hư hỏng nặng">Hư hỏng nặng</option>
                                        <option value="Mất">Mất</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Mức độ bảo mật</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.mucDoBaoMat}
                                        onChange={(e) => setFormData({ ...formData, mucDoBaoMat: e.target.value })}
                                    >
                                        <option value="Thường">Thường</option>
                                        <option value="Mật">Mật</option>
                                        <option value="Tối mật">Tối mật</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Ghi chú</label>
                                    <textarea
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                                        value={formData.ghiChu}
                                        onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                                        placeholder="Ghi chú thêm..."
                                    ></textarea>
                                </div>

                            </div>

                            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all text-sm">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-[0.98] text-sm uppercase">
                                    Lưu dữ liệu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL QUẢN LÝ FILE ĐÍNH KÈM */}
            {isFilesModalOpen && selectedRecordForFiles && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[999] overflow-y-auto">
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200 my-8">
                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                            <h3 className="text-sm font-bold uppercase text-gray-700 flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-blue-600" />
                                File đính kèm: {selectedRecordForFiles.title}
                            </h3>
                            <button type="button" onClick={closeFilesModal} className="text-gray-400 hover:text-red-500 transition-all"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Upload Area */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Tải lên tài liệu mới</label>
                                <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50/50 flex flex-col items-center justify-center gap-2">
                                    <input
                                        type="file"
                                        id="file-upload-input"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <label
                                        htmlFor="file-upload-input"
                                        className="flex flex-col items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors w-full py-4"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                                            <UploadCloud className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700">Chọn file từ máy tính</span>
                                        <span className="text-[10px] text-gray-400 font-medium">Hỗ trợ nhiều file cùng lúc (Hình ảnh, PDF, Văn bản...)</span>
                                    </label>
                                    
                                    {tempFiles.length > 0 && (
                                        <div className="w-full mt-2 border-t border-gray-200 pt-3">
                                            <div className="text-[11px] font-bold text-gray-500 mb-2">Danh sách file đã chọn ({tempFiles.length})</div>
                                            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                                                {tempFiles.map((f, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs shadow-sm">
                                                        <span className="truncate max-w-[350px] font-medium text-gray-700">{f.name}</span>
                                                        <span className="text-[10px] text-gray-400 shrink-0 font-mono">({formatBytes(f.size)})</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                                                <button
                                                    type="button"
                                                    onClick={() => setTempFiles([])}
                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs transition-colors"
                                                >
                                                    Hủy bỏ
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleUpload}
                                                    disabled={uploadingFiles}
                                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md text-xs flex items-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    {uploadingFiles ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                                                            Đang tải lên...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UploadCloud className="w-3.5 h-3.5" />
                                                            Tải lên ngay
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Files List */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Danh sách tài liệu đã đính kèm</label>
                                
                                {filesLoading ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                                        <p className="text-xs text-gray-400 mt-2">Đang tải danh sách file...</p>
                                    </div>
                                ) : recordFiles.length === 0 ? (
                                    <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg bg-gray-50/30">
                                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-400">Chưa có file đính kèm nào cho hồ sơ này.</p>
                                    </div>
                                ) : (
                                    <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold uppercase text-gray-500">
                                                <tr>
                                                    <th className="px-4 py-2">Tên file</th>
                                                    <th className="px-4 py-2 w-24 text-center">Dung lượng</th>
                                                    <th className="px-4 py-2 w-32 text-center">Ngày tải</th>
                                                    <th className="px-4 py-2 w-20 text-right">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-150 text-xs">
                                                {recordFiles.map(file => (
                                                    <tr key={file.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-4 py-2.5">
                                                            <a
                                                                href={PATH_IMAGES + file.filePath}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline break-all flex items-center gap-1.5"
                                                            >
                                                                <FileText className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                                                {file.fileName}
                                                            </a>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center text-gray-500 font-mono text-[10px]">
                                                            {formatBytes(file.fileSize)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center text-gray-500 text-[10px]">
                                                            {formatDate(file.createdDate)}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right">
                                                            <div className="flex justify-end gap-1.5">
                                                                <a
                                                                    href={PATH_IMAGES + file.filePath}
                                                                    download={file.fileName}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                                                    title="Tải xuống"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                </a>
                                                                <button
                                                                    onClick={() => handleDeleteFile(file.id)}
                                                                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                                    title="Xóa file"
                                                                >
                                                                    <Trash className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-5 py-3 border-t border-gray-100 flex justify-end bg-gray-50">
                            <button
                                type="button"
                                onClick={closeFilesModal}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-350 text-gray-750 font-semibold rounded-lg transition-colors text-xs"
                            >
                                Đóng
                            </button>
                        </div>
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
                        <h3 className="text-base font-bold mb-1">Xác nhận xóa hồ sơ?</h3>
                        <p className="text-xs text-gray-500 mb-5">Hành động này sẽ xóa hồ sơ và không thể hoàn tác.</p>
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

export default DocumentRecordManager;
