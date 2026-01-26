import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import UserRegister from './pages/UserRegister';
import MedicineManage from './pages/MedicineManage';
import { http } from './api/http';

interface User {
  id: number;
  name: string;
}

function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    http.get('/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  };

  //로그아웃 핸들러
  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('adminPassword');
      //새로고침
      window.location.reload(); 
    }
  };

  // 복용자 삭제 핸들러
  const handleDeleteUser = async (e: React.MouseEvent, userId: number) => {
    e.stopPropagation();
    
    if (!window.confirm('정말 삭제하시겠습니까?\n해당 복용자의 모든 약과 기록이 사라집니다.')) return;

    try {
      await http.delete(`/users/${userId}`);
      alert('삭제되었습니다.');
      
      // 목록 갱신
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      alert('삭제 실패!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-blue-50 p-6">
      <div className="w-full max-w-sm flex justify-between items-center mb-8 mt-10">
        <h1 className="text-4xl font-extrabold text-blue-600">
          💊 약모고
        </h1>
        <button 
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-red-500 font-medium underline transition"
        >
          로그아웃
        </button>
      </div>
      <div className="w-full max-w-sm space-y-4 mb-8">
        {users.map(user => (
          <div 
            key={user.id} 
            onClick={() => navigate(`/users/${user.id}/medicines`)}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition cursor-pointer group"
          >
            <span className="text-xl font-bold text-gray-800">{user.name}</span>
            
            <div className="flex items-center gap-3">
              {/* 화살표: 평소에 보임, 호버시 숨김 */}
              <span className="text-gray-400 group-hover:hidden">&gt;</span>
              
              {/* 삭제 버튼: 평소에 숨김(hidden), 호버시 나타남(group-hover:block) */}
              <button 
                onClick={(e) => handleDeleteUser(e, user.id)}
                className="hidden group-hover:block text-red-400 hover:text-red-600 font-medium px-2 py-1 border border-red-100 rounded bg-white hover:bg-red-50 transition z-10"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="text-gray-400 text-center">등록된 복용자가 없어요.</p>}
      </div>

      <Link to="/register" className="w-full max-w-sm bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg text-center hover:bg-blue-700 transition flex items-center justify-center gap-2">
        <span className="text-2xl">+</span> 복용자 추가
      </Link>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');

  //암호검사
  useEffect(() => {
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword) return;

    localStorage.setItem('adminPassword', inputPassword);
    try {
      //검증
      await http.get('/users');

      //성공시
      setIsAuthenticated(true);
      
    } catch (error) {
      //실패
      console.error("로그인 실패");
      localStorage.removeItem('adminPassword');
    }
  };

  // 암호 없으면 로그인 화면만 보여줌 (라우터 접근 불가)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">💊 약모고</h1>
            <p className="text-gray-400">가족 관리자 인증</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="가족 암호 입력"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition text-lg"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg active:scale-95 transform"
            >
              입장하기 🚀
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<UserRegister />} />
        {/* 새로운 경로 추가 */}
        <Route path="/users/:userId/medicines" element={<MedicineManage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;