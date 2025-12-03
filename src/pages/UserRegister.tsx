import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { http } from "../api/http";

export default function UserRegister() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [guardianName, setGuardianName] = useState('');
    const [guardianId, setGuardianId] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await http.post('/users', {
                name: name,
                guardians: [
                    {
                        name: guardianName,
                        chatId: guardianId
                    }
                ]
            });

            alert('등록 성공!');
            navigate('/');
        } catch (error) {
            alert('등록 실패... 백엔드 로그 확인!');
            console.error(error);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
            
            {/* 헤더 영역 */}
            <div className="flex items-center justify-between mb-8">
                <Link to="/" className="text-gray-400 hover:text-gray-600 font-bold transition">
                    ← 취소
                </Link>
                <h2 className="text-2xl font-bold text-gray-800">
                  👨‍👩‍👧‍👦 복용자 등록
                </h2>
                <div className="w-10"></div> {/* 타이틀 중앙 정렬을 위한 투명 박스 */}
            </div>
    
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. 약물 복용자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  복용자 성함
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 김철수"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>
    
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-4 font-bold">🔔 알림 받을 대상 정보</p>
                
                {/* 2. 알림 받을 대상 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    알림 대상
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="예: 아들 (또는 본인)"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
    
                {/* 3. 텔레그램 ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    텔레그램 Chat ID
                  </label>
                  <input
                    type="text"
                    value={guardianId}
                    onChange={(e) => setGuardianId(e.target.value)}
                    placeholder="예: 54648140"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    * 텔레그램 봇(@Yakson_bot)에게 말을 걸면 ID를 알 수 있어요.
                  </p>
                </div>
              </div>
    
              {/* 저장 버튼 */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 transition shadow-lg transform active:scale-95 mt-4"
              >
                등록하기
              </button>
            </form>
          </div>
        </div>
      );
}