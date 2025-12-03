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
      <h1 className="text-4xl font-extrabold text-blue-600 mb-8 mt-10">
        💊 약모고
      </h1>

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