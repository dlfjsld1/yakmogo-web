import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { http } from '../api/http';

// 👇 [추가] 유저 및 보호자 정보 타입 정의
interface Receiver {
  id: number;
  name: string;
  chatId: string;
}

interface UserDetail {
  id: number;
  name: string;
  guardians: Receiver[];
}

interface Medicine {
  id: number;
  name: string;
  scheduleType: string;
  intakeTime: string;
  active: boolean;
}

export default function MedicineManage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // 👇 [추가] 유저 정보 상태
  const [user, setUser] = useState<UserDetail | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 💊 약 등록 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('09:00:00');

  // 👨‍👩‍👧‍👦 수신자 추가 모달 상태
  const [isReceiverModalOpen, setIsReceiverModalOpen] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverId, setReceiverId] = useState('');

  useEffect(() => {
    fetchData(); // 함수 이름 변경 (fetchMedicines -> fetchData)
  }, [userId]);

  // 👇 [수정] 약 목록뿐만 아니라 유저 정보도 같이 가져옴
  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. 유저 정보(+보호자) 가져오기
      const userRes = await http.get(`/users/${userId}`);
      setUser(userRes.data);

      // 2. 약 목록 가져오기
      const medRes = await http.get(`/users/${userId}/medicines`);
      setMedicines(medRes.data);
    } catch (err) {
      console.error(err);
      // alert('데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (medicineId: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await http.delete(`/medicines/${medicineId}`);
      setMedicines(medicines.filter(m => m.id !== medicineId));
    } catch (e) {
      alert('삭제 실패!');
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await http.post(`/users/${userId}/medicines`, {
        name: newName,
        scheduleType: 'DAILY',
        startDate: newDate,
        intakeTime: newTime.length === 5 ? newTime + ":00" : newTime
      });
      alert('약이 등록되었습니다! 💊');
      setIsModalOpen(false);
      setNewName('');
      fetchData(); // 목록 새로고침
    } catch (e) {
      alert('등록 실패!');
    }
  };

  // 👨‍👩‍👧‍👦 수신자 추가 핸들러
  const handleAddReceiver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await http.post(`/users/${userId}/receivers`, {
        name: receiverName,
        chatId: receiverId
      });
      alert('알림 수신자가 추가되었습니다! 🎉');
      setIsReceiverModalOpen(false);
      setReceiverName('');
      setReceiverId('');
      fetchData(); // 👇 [추가] 새로고침해야 화면에 바로 뜸!
    } catch (e) {
      alert('추가 실패!');
    }
  };

  // 🗑️ 수신자 삭제 핸들러
  const handleDeleteReceiver = async (receiverId: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await http.delete(`/users/${userId}/receivers/${receiverId}`);
      // 화면 갱신
      fetchData();
    } catch (e) {
      alert('삭제 실패!');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center pb-24">
      {/* 헤더 */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 mt-4">
        <Link to="/" className="text-gray-500 hover:text-gray-800 text-lg">← 뒤로가기</Link>
        {/* 👇 제목에 유저 이름 표시 */}
        <h1 className="text-2xl font-bold text-gray-800">{user?.name}님 관리</h1>
        <div className="w-8"></div>
      </div>

      {/* 보호자 목록 카드 */}
      <div className="w-full max-w-md bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-blue-800">🔔 알림 수신자</h3>
            <button 
                onClick={() => setIsReceiverModalOpen(true)}
                className="text-sm bg-white text-blue-600 px-3 py-1 rounded-lg border border-blue-200 font-bold hover:bg-blue-100 transition"
            >
                + 추가
            </button>
        </div>
        
        {user?.guardians && user.guardians.length > 0 ? (
           <div className="space-y-2">
           {user.guardians.map(receiver => (
               <div key={receiver.id} className="flex items-center justify-between text-gray-700 bg-white p-2 rounded-lg border border-blue-100 group">
                   {/* 왼쪽 정보 */}
                   <div className="flex items-center gap-2">
                       <span className="text-blue-500">📢</span>
                       <span className="font-medium">{receiver.name}</span>
                       <span className="text-xs text-gray-400">({receiver.chatId})</span>
                   </div>
                   
                   {/* 👇 [추가] 오른쪽 삭제 버튼 (마우스 올리면 보임) */}
                   <button 
                       onClick={() => handleDeleteReceiver(receiver.id)}
                       className="text-red-300 hover:text-red-500 text-sm px-2 hidden group-hover:block transition"
                   >
                       삭제
                   </button>
               </div>
           ))}
       </div>
        ) : (
            <p className="text-sm text-gray-400">등록된 수신자가 없어요.</p>
        )}
      </div>

      {/* 리스트 영역 */}
      <div className="w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-gray-800 mb-2 ml-1">💊 복용 중인 약</h3>
        {medicines.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 mb-2">등록된 약이 없어요.</p>
            <p className="text-sm text-gray-400">우측 하단 + 버튼을 눌러보세요!</p>
          </div>
        ) : (
          medicines.map((med) => (
            <div key={med.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{med.name}</h3>
                <p className="text-sm text-blue-500 font-medium mt-1">
                  ⏰ {med.intakeTime?.substring(0, 5)} (매일)
                </p>
              </div>
              <button 
                onClick={() => handleDelete(med.id)}
                className="text-red-400 hover:text-red-600 px-3 py-1 text-sm border border-red-100 rounded-lg hover:bg-red-50 transition"
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>

      {/* 약 추가 플로팅 버튼 */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center text-3xl hover:bg-blue-700 transition transform hover:scale-110 z-10"
      >
        <span className="text-2xl">+</span>
      </button>

      {/* 💊 약 등록 모달 (기존 동일) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">💊 새로운 약 등록</h2>
            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div><input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="약 이름" className="w-full px-4 py-3 rounded-xl border" required/></div>
              <div className="flex gap-2">
                  <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border" required/>
                  <input type="time" value={newTime} onChange={e=>setNewTime(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border" required/>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-xl">취소</button>
                <button type="submit" className="flex-1 py-3 text-white bg-blue-600 rounded-xl">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 수신자 추가 모달 (기존 동일) */}
      {isReceiverModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🔔 보호자 추가</h2>
            <form onSubmit={handleAddReceiver} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">이름</label>
                <input type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="예: 딸" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" required/>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">텔레그램 Chat ID</label>
                <input type="text" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} placeholder="예: 98765432" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" required/>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsReceiverModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl">취소</button>
                <button type="submit" className="flex-1 py-3 text-white font-bold bg-blue-600 rounded-xl">추가하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}