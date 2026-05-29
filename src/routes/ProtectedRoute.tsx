import { useEffect, useState } from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import apiClient from "../services/api";
import Loading from "../Component/Loading";
import logoBv from "../Asset/Images/Logobv.png";
import { Menu, LogOut, LayoutDashboard, Settings, ChevronDown, ChevronRight } from "lucide-react";

const ProtectedRoute = () => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("");

  // State lưu danh sách Menu từ API
  const [menuData, setMenuData] = useState<any[]>([]);

  // State quản lý việc Đóng/Mở của các danh mục cha
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});

  // State quản lý sidebar thu gọn
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const location = useLocation();

  useEffect(() => {
    const checkAuthAndFetchMenus = async () => {
      try {
        const resUser = await apiClient.get("/api/user");
        setUserName(resUser.data.fullname || "Admin");

        const resMenu = await apiClient.get("/api/Authorization");

        if (resMenu.data && resMenu.data.success) {
          let fetchedMenus = resMenu.data.data;

          // Sắp xếp danh mục cha (Category) theo order_ct từ thấp đến cao
          fetchedMenus.sort((a: any, b: any) => a.order_ct - b.order_ct);

          // Sắp xếp các menu con bên trong theo order_menu từ thấp đến cao
          fetchedMenus.forEach((category: any) => {
            if (category.menus && Array.isArray(category.menus)) {
              category.menus.sort((a: any, b: any) => a.order_menu - b.order_menu);
            }
          });

          setMenuData(fetchedMenus);

          let urls = ["/trang-chu"];
          fetchedMenus.forEach((category: any) => {
            category.menus.forEach((menu: any) => {
              if (menu.url && menu.url !== "/#" && menu.url !== "#") {
                urls.push(menu.url);
              }
            });
          });
        }

        setIsAuth(true);
      } catch (err: any) {
        setIsAuth(false);
      }
    };
    checkAuthAndFetchMenus();
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/dang-xuat");
      window.location.href = "/login";
    } catch (error) {
      window.location.href = "/login";
    }
  };

  // Hàm xử lý Đóng/Mở danh mục
  const toggleCategory = (index: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (isAuth === null) return <Loading />;
  if (!isAuth) return <Navigate to="/login" replace />;

  // if (allowedUrls.length > 0 && location.pathname !== "/" && !allowedUrls.includes(location.pathname)) {
  //   return <Navigate to="/trang-chu" replace />;
  // }

  // --- THAY ĐỔI MÀU CHỮ Ở ĐÂY ---
  // text-slate-600 đổi thành text-black
  const activeClass = (path: string) =>
    location.pathname === path
      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
      : "text-black hover:bg-slate-100 hover:text-blue-600";

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">

      {/* --- SIDEBAR --- */}
      <aside className={`bg-white shadow-xl fixed h-full z-20 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-center bg-slate-50/30 mb-2 h-20">
          <Link to="/trang-chu" className="flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-[1.03] w-full">
            <img src={logoBv} alt="Bệnh Viện Đa Khoa Mỹ Phước" className={`${isSidebarOpen ? 'h-12' : 'h-8'} w-auto object-contain transition-all duration-300`} />
          </Link>
        </div>

        <nav className="mt-2 flex flex-col gap-1 px-3 flex-1 overflow-y-auto pb-4 custom-scrollbar">
          {isSidebarOpen && <p className="text-[10px] font-bold text-black uppercase px-2 mb-2 tracking-widest truncate">Main Menu</p>}
          <Link to="/trang-chu" className={`flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl transition-all duration-200 font-medium text-sm ${activeClass('/trang-chu')}`} title={!isSidebarOpen ? "Dashboard" : ""}>
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="truncate">Dashboard</span>}
          </Link>

          {/* RENDER MENU ĐỘNG TỪ API */}
          {menuData.map((category, catIndex) => {
            const isExpanded = expandedCategories[catIndex];

            return (
              <div key={catIndex} className="mt-2 flex flex-col gap-1">

                {/* Khu vực tiêu đề biến thành Nút bấm */}
                <div
                  className={`flex items-center ${isSidebarOpen ? 'justify-between px-4' : 'justify-center px-0'} py-3 mt-1 cursor-pointer group hover:bg-slate-50 rounded-xl transition-colors`}
                  onClick={() => {
                    if (!isSidebarOpen) setIsSidebarOpen(true);
                    toggleCategory(catIndex);
                  }}
                  title={!isSidebarOpen ? category.title_ctmenu : ""}
                >
                  <p className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-2 group-hover:text-blue-500 transition-colors truncate">
                    {category.thumnail && category.thumnail.startsWith("http") ? (
                      <img src={category.thumnail} alt="cat-icon" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                    ) : (
                      <span className="w-5 h-5 flex items-center justify-center shrink-0">📁</span>
                    )}
                    {isSidebarOpen && <span className="truncate">{category.title_ctmenu}</span>}
                  </p>

                  {/* Icon mũi tên thể hiện đóng mở */}
                  {isSidebarOpen && (
                    <span className="text-black transition-transform duration-200 shrink-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  )}
                </div>

                {/* Render menu con có điều kiện */}
                {isExpanded && isSidebarOpen && (
                  <div className="flex flex-col gap-1 ml-4 border-l-2 border-slate-100 pl-2 mt-1">
                    {category.menus.map((menu: any, mIndex: number) => {
                      const linkUrl = (menu.url === "/#" || menu.url === "#") ? "#" : menu.url;

                      return (
                        <Link
                          key={mIndex}
                          to={linkUrl}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${activeClass(linkUrl)}`}
                        >
                          {menu.thumnail && menu.thumnail.startsWith("http") ? (
                            <img src={menu.thumnail} alt="menu-icon" className="w-4 h-4 shrink-0" />
                          ) : (
                            <Settings className="w-4 h-4 shrink-0 opacity-70" />
                          )}
                          <span className="truncate">{menu.title_menu}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-medium text-sm`}
            title={!isSidebarOpen ? "Đăng xuất" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="truncate">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* --- NỘI DUNG CHÍNH --- */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-20 flex items-center justify-between bg-white/80 backdrop-blur-md px-4 md:px-8 border-b border-slate-200 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col hidden sm:flex">
              {/* Đổi thành text-black */}
              <h1 className="text-black font-bold text-base">
                HỆ THỐNG QUẢN LÝ LƯU TRỮ HỒ SƠ MPH
              </h1>
              <p className="text-xs text-slate-500">Chào mừng trở lại, {userName}!</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/trang-ca-nhan" className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="Hồ sơ cá nhân">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium hidden md:block">{userName}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 w-full overflow-y-auto">
          <Outlet />
        </main>
        <footer className="bg-white border-t border-slate-200 px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-slate-500">

            <p>
              © 2026 <span className="font-semibold text-slate-700">PCNTT - Bệnh Viện Đa Khoa Mỹ Phước</span>
            </p>

            <p className="text-xs text-slate-400">
              Hệ thống quản lý lưu trữ hồ sơ nội bộ
            </p>

          </div>
        </footer>
      </div>
    </div>
  );
};

export default ProtectedRoute;