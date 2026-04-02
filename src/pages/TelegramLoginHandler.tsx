import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { http } from '../api/http';

interface ManagedUser {
  id: number;
  name: string;
}

export default function TelegramLoginHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      setError('잘못된 접근입니다. 텔레그램을 통해 접속해주세요.');
      return;
    }

    const login = async () => {
      try {
        // 1. 백엔드 인증 API 호출
        const res = await http.get(`/auth/telegram?chatId=${chatId}`);
        const { token, users: managedUsers } = res.data;

        // 2. 받은 토큰 저장 (추후 인터셉터에서 사용)
        localStorage.setItem('magicToken', token);
        
        // 3. 가족 수에 따른 라우팅 분기
        if (managedUsers.length === 1) {
          // 한 명이면 바로 관리 화면으로
          window.location.href = `/users/${managedUsers[0].id}/medicines`;
        } else {
          setUsers(managedUsers);
        }
      } catch (err) {
        setError('등록되지 않은 사용자입니다. 관리자에게 문의하세요.');
      }
    };

    login();
  }, [searchParams, navigate]);

  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">💊 누구의 약을 확인할까요?</h2>
        <p className="text-gray-500 mb-6">복용자를 선택해주세요.</p>
        
        <div className="space-y-4">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => window.location.href = `/users/${user.id}/medicines`}
              className="w-full bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-800 font-bold py-4 rounded-xl transition shadow-sm"
            >
              {user.name} 님
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}