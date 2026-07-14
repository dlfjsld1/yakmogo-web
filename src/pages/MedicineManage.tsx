import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { http } from '../api/http'

interface Receiver {
  id: number
  name: string
  chatId: string
}

interface UserDetail {
  id: number
  name: string
  guardians: Receiver[]
}

type ScheduleType = 'DAILY' | 'WEEKLY' | 'INTERVAL'

interface Medicine {
  id: number
  name: string
  scheduleType: ScheduleType
  scheduleValue: string | null
  startDate: string
  intakeTime: string
  active: boolean
}

interface MedicineForm {
  name: string
  scheduleType: ScheduleType
  scheduleValue: string
  selectedDays: string[]
  startDate: string
  intakeTime: string
}

interface Feedback {
  type: 'success' | 'error'
  message: string
}

const daysOfWeek = [
  { id: 'Monday', label: '월' },
  { id: 'Tuesday', label: '화' },
  { id: 'Wednesday', label: '수' },
  { id: 'Thursday', label: '목' },
  { id: 'Friday', label: '금' },
  { id: 'Saturday', label: '토' },
  { id: 'Sunday', label: '일' },
]

function today() {
  return new Date().toISOString().split('T')[0]
}

function emptyMedicineForm(): MedicineForm {
  return {
    name: '',
    scheduleType: 'DAILY',
    scheduleValue: '',
    selectedDays: [],
    startDate: today(),
    intakeTime: '09:00',
  }
}

function errorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback

  const status = error.response?.status
  if (status === 401) return '인증이 만료되었습니다. 다시 로그인해 주세요.'
  if (status === 403) return '이 작업을 수행할 권한이 없습니다.'
  if (!error.response) return '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.'

  const serverMessage = error.response.data?.message
  return typeof serverMessage === 'string' ? serverMessage : fallback
}

function scheduleDescription(medicine: Medicine) {
  if (medicine.scheduleType === 'WEEKLY') {
    const labels = medicine.scheduleValue?.split(',').map((value) => (
      daysOfWeek.find((day) => day.id === value)?.label ?? value
    ))
    return `매주 ${labels?.join('·') ?? ''}`
  }
  if (medicine.scheduleType === 'INTERVAL') return `${medicine.scheduleValue}일 간격`
  return '매일'
}

export default function MedicineManage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const isAdmin = Boolean(localStorage.getItem('adminPassword'))

  const [user, setUser] = useState<UserDetail | null>(null)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false)
  const [editingMedicineId, setEditingMedicineId] = useState<number | null>(null)
  const [medicineForm, setMedicineForm] = useState<MedicineForm>(emptyMedicineForm)
  const [savingMedicine, setSavingMedicine] = useState(false)
  const [deletingMedicineId, setDeletingMedicineId] = useState<number | null>(null)
  const [confirmingMedicineId, setConfirmingMedicineId] = useState<number | null>(null)

  const [isReceiverModalOpen, setIsReceiverModalOpen] = useState(false)
  const [receiverName, setReceiverName] = useState('')
  const [receiverId, setReceiverId] = useState('')
  const [savingReceiver, setSavingReceiver] = useState(false)
  const [deletingReceiverId, setDeletingReceiverId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setPageError('')
      const [userRes, medicineRes] = await Promise.all([
        http.get(`/users/${userId}`),
        http.get(`/medicine-groups/users/${userId}/medicines`),
      ])
      setUser(userRes.data)
      setMedicines(medicineRes.data)
    } catch (error) {
      setPageError(errorMessage(error, '복용 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const openCreateMedicine = () => {
    setFeedback(null)
    setEditingMedicineId(null)
    setMedicineForm(emptyMedicineForm())
    setIsMedicineModalOpen(true)
  }

  const openEditMedicine = (medicine: Medicine) => {
    setFeedback(null)
    setEditingMedicineId(medicine.id)
    setMedicineForm({
      name: medicine.name,
      scheduleType: medicine.scheduleType,
      scheduleValue: medicine.scheduleType === 'INTERVAL' ? medicine.scheduleValue ?? '' : '',
      selectedDays: medicine.scheduleType === 'WEEKLY' && medicine.scheduleValue
        ? medicine.scheduleValue.split(',')
        : [],
      startDate: medicine.startDate,
      intakeTime: medicine.intakeTime.substring(0, 5),
    })
    setIsMedicineModalOpen(true)
  }

  const closeMedicineModal = () => {
    if (!savingMedicine) setIsMedicineModalOpen(false)
  }

  const changeScheduleType = (scheduleType: ScheduleType) => {
    setMedicineForm((current) => ({
      ...current,
      scheduleType,
      scheduleValue: '',
      selectedDays: [],
    }))
  }

  const toggleDay = (dayId: string) => {
    setMedicineForm((current) => ({
      ...current,
      selectedDays: current.selectedDays.includes(dayId)
        ? current.selectedDays.filter((day) => day !== dayId)
        : [...current.selectedDays, dayId],
    }))
  }

  const handleSaveMedicine = async (event: React.FormEvent) => {
    event.preventDefault()
    if (savingMedicine) return

    let scheduleValue: string | null = null
    if (medicineForm.scheduleType === 'WEEKLY') {
      if (medicineForm.selectedDays.length === 0) {
        setFeedback({ type: 'error', message: '복용할 요일을 하나 이상 선택해 주세요.' })
        return
      }
      scheduleValue = medicineForm.selectedDays.join(',')
    }
    if (medicineForm.scheduleType === 'INTERVAL') {
      if (!medicineForm.scheduleValue || Number(medicineForm.scheduleValue) < 1) {
        setFeedback({ type: 'error', message: '복용 간격은 1일 이상이어야 합니다.' })
        return
      }
      scheduleValue = medicineForm.scheduleValue
    }

    const payload = {
      name: medicineForm.name.trim(),
      scheduleType: medicineForm.scheduleType,
      scheduleValue,
      startDate: medicineForm.startDate,
      intakeTime: `${medicineForm.intakeTime}:00`,
    }

    try {
      setSavingMedicine(true)
      setFeedback(null)
      if (editingMedicineId === null) {
        await http.post(`/medicine-groups/users/${userId}/medicines`, payload)
      } else {
        await http.put(`/medicine-groups/medicines/${editingMedicineId}`, payload)
      }
      setIsMedicineModalOpen(false)
      await fetchData()
      setFeedback({
        type: 'success',
        message: editingMedicineId === null ? '약이 등록되었습니다.' : '약 정보가 수정되었습니다.',
      })
    } catch (error) {
      setFeedback({ type: 'error', message: errorMessage(error, '약 정보를 저장하지 못했습니다.') })
    } finally {
      setSavingMedicine(false)
    }
  }

  const handleDeleteMedicine = async (medicine: Medicine) => {
    if (deletingMedicineId !== null) return
    try {
      setDeletingMedicineId(medicine.id)
      setFeedback(null)
      await http.delete(`/medicine-groups/medicines/${medicine.id}`)
      setMedicines((current) => current.filter((item) => item.id !== medicine.id))
      setConfirmingMedicineId(null)
      setFeedback({ type: 'success', message: `${medicine.name}을(를) 삭제했습니다.` })
    } catch (error) {
      setFeedback({ type: 'error', message: errorMessage(error, '약을 삭제하지 못했습니다.') })
    } finally {
      setDeletingMedicineId(null)
    }
  }

  const handleAddReceiver = async (event: React.FormEvent) => {
    event.preventDefault()
    if (savingReceiver) return
    try {
      setSavingReceiver(true)
      setFeedback(null)
      await http.post(`/users/${userId}/receivers`, { name: receiverName, chatId: receiverId })
      setIsReceiverModalOpen(false)
      setReceiverName('')
      setReceiverId('')
      await fetchData()
      setFeedback({ type: 'success', message: '알림 수신자를 추가했습니다.' })
    } catch (error) {
      setFeedback({ type: 'error', message: errorMessage(error, '알림 수신자를 추가하지 못했습니다.') })
    } finally {
      setSavingReceiver(false)
    }
  }

  const handleDeleteReceiver = async (receiver: Receiver) => {
    if (deletingReceiverId !== null || !window.confirm(`${receiver.name} 수신자를 삭제하시겠습니까?`)) return
    try {
      setDeletingReceiverId(receiver.id)
      setFeedback(null)
      await http.delete(`/users/${userId}/receivers/${receiver.id}`)
      setUser((current) => current ? {
        ...current,
        guardians: current.guardians.filter((guardian) => guardian.id !== receiver.id),
      } : current)
      setFeedback({ type: 'success', message: '알림 수신자를 삭제했습니다.' })
    } catch (error) {
      setFeedback({ type: 'error', message: errorMessage(error, '알림 수신자를 삭제하지 못했습니다.') })
    } finally {
      setDeletingReceiverId(null)
    }
  }

  if (loading) {
    return <div role="status" className="min-h-screen flex items-center justify-center">복용 정보를 불러오는 중...</div>
  }

  if (pageError) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white border border-red-100 rounded-2xl p-6 text-center shadow-sm">
          <p role="alert" className="text-red-700 mb-4">{pageError}</p>
          <button type="button" onClick={() => void fetchData()} className="px-5 py-3 bg-blue-600 text-white font-bold rounded-xl">
            다시 시도
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 sm:px-6 py-6 flex flex-col items-center pb-28">
      <header className="w-full max-w-md grid grid-cols-[4rem_1fr_4rem] items-center gap-2 mb-6 mt-2 sm:mt-4">
        {isAdmin ? (
          <button type="button" onClick={() => navigate('/')} className="text-gray-600 hover:text-blue-700 font-bold text-left">
            ← 홈
          </button>
        ) : <span aria-hidden="true" />}
        <h1 className="text-xl sm:text-2xl text-center font-bold text-gray-800 break-keep">{user?.name}님 복용 관리</h1>
      </header>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`w-full max-w-md mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <section aria-labelledby="receiver-heading" className="w-full max-w-md bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 id="receiver-heading" className="text-lg font-bold text-blue-800">🔔 알림 수신자</h2>
          <button type="button" onClick={() => setIsReceiverModalOpen(true)} className="text-sm bg-white text-blue-700 px-3 py-2 rounded-lg border border-blue-200 font-bold">
            수신자 추가
          </button>
        </div>
        {user?.guardians.length ? (
          <ul className="space-y-2">
            {user.guardians.map((receiver) => (
              <li key={receiver.id} className="flex items-center justify-between gap-2 text-gray-700 bg-white p-3 rounded-lg border border-blue-100">
                <span className="min-w-0">
                  <span className="font-medium">{receiver.name}</span>{' '}
                  <span className="text-xs text-gray-500 break-all">({receiver.chatId})</span>
                </span>
                <button
                  type="button"
                  onClick={() => void handleDeleteReceiver(receiver)}
                  disabled={deletingReceiverId !== null}
                  aria-label={`${receiver.name} 수신자 삭제`}
                  className="text-red-600 px-3 py-2 text-sm border border-red-100 rounded-lg disabled:opacity-50"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-500">등록된 수신자가 없어요.</p>}
      </section>

      <section aria-labelledby="medicine-heading" className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="medicine-heading" className="text-lg font-bold text-gray-800">💊 복용 중인 약</h2>
          <button type="button" onClick={openCreateMedicine} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm">
            약 추가
          </button>
        </div>
        {medicines.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-600 mb-2">등록된 약이 없어요.</p>
            <p className="text-sm text-gray-500">약 추가 버튼을 눌러 첫 복용 일정을 등록해 보세요.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {medicines.map((medicine) => (
              <li key={medicine.id} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{medicine.name}</h3>
                    <p className="text-sm text-blue-700 font-medium mt-1">
                      ⏰ {medicine.intakeTime.substring(0, 5)} · {scheduleDescription(medicine)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{medicine.startDate}부터</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {confirmingMedicineId === medicine.id ? (
                      <>
                        <button type="button" onClick={() => setConfirmingMedicineId(null)} disabled={deletingMedicineId !== null} aria-label={`${medicine.name} 삭제 취소`} className="text-gray-700 px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50">
                          취소
                        </button>
                        <button type="button" onClick={() => void handleDeleteMedicine(medicine)} disabled={deletingMedicineId !== null} aria-label={`${medicine.name} 삭제 확인`} className="text-white bg-red-600 px-4 py-2 rounded-lg disabled:opacity-50">
                          {deletingMedicineId === medicine.id ? '삭제 중' : '삭제 확인'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => openEditMedicine(medicine)} aria-label={`${medicine.name} 수정`} className="text-blue-700 px-4 py-2 border border-blue-100 rounded-lg">
                          수정
                        </button>
                        <button type="button" onClick={() => setConfirmingMedicineId(medicine.id)} disabled={deletingMedicineId !== null} aria-label={`${medicine.name} 삭제`} className="text-red-600 px-4 py-2 border border-red-100 rounded-lg disabled:opacity-50">
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isMedicineModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <section role="dialog" aria-modal="true" aria-labelledby="medicine-dialog-title" className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[94vh]">
            <h2 id="medicine-dialog-title" className="text-xl font-bold text-gray-800 mb-4">
              {editingMedicineId === null ? '새로운 약 등록' : '약 정보 수정'}
            </h2>
            <form onSubmit={handleSaveMedicine} className="space-y-4">
              <div>
                <label htmlFor="medicine-name" className="block text-sm text-gray-700 mb-1 font-medium">약 이름</label>
                <input id="medicine-name" type="text" value={medicineForm.name} onChange={(event) => setMedicineForm((current) => ({ ...current, name: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-blue-500" required maxLength={255} />
              </div>
              <div>
                <label htmlFor="schedule-type" className="block text-sm text-gray-700 mb-1 font-medium">복용 주기</label>
                <select id="schedule-type" value={medicineForm.scheduleType} onChange={(event) => changeScheduleType(event.target.value as ScheduleType)} className="w-full border border-gray-300 rounded-xl p-3 bg-white focus:border-blue-500">
                  <option value="DAILY">매일 먹어요</option>
                  <option value="WEEKLY">특정 요일에만 먹어요</option>
                  <option value="INTERVAL">며칠 간격으로 먹어요</option>
                </select>
              </div>
              {medicineForm.scheduleType === 'WEEKLY' && (
                <fieldset>
                  <legend className="block text-sm text-gray-700 mb-2 font-medium">복용 요일 선택</legend>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {daysOfWeek.map((day) => {
                      const selected = medicineForm.selectedDays.includes(day.id)
                      return (
                        <button key={day.id} type="button" onClick={() => toggleDay(day.id)} aria-label={`${day.label}요일`} aria-pressed={selected} className={`min-h-11 rounded-lg text-sm font-bold border ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              )}
              {medicineForm.scheduleType === 'INTERVAL' && (
                <div>
                  <label htmlFor="schedule-interval" className="block text-sm text-gray-700 mb-1 font-medium">복용 간격 (일)</label>
                  <input id="schedule-interval" type="number" min="1" value={medicineForm.scheduleValue} onChange={(event) => setMedicineForm((current) => ({ ...current, scheduleValue: event.target.value }))} className="border border-gray-300 rounded-xl p-3 w-full" required />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start-date" className="block text-sm text-gray-700 mb-1 font-medium">시작일</label>
                  <input id="start-date" type="date" value={medicineForm.startDate} onChange={(event) => setMedicineForm((current) => ({ ...current, startDate: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-300" required />
                </div>
                <div>
                  <label htmlFor="intake-time" className="block text-sm text-gray-700 mb-1 font-medium">알림 시간</label>
                  <input id="intake-time" type="time" value={medicineForm.intakeTime} onChange={(event) => setMedicineForm((current) => ({ ...current, intakeTime: event.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-300" required />
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={closeMedicineModal} disabled={savingMedicine} className="flex-1 py-3 text-gray-700 font-bold bg-gray-100 rounded-xl disabled:opacity-50">취소</button>
                <button type="submit" disabled={savingMedicine} className="flex-1 py-3 text-white font-bold bg-blue-600 rounded-xl disabled:opacity-60">
                  {savingMedicine ? '저장 중' : editingMedicineId === null ? '등록하기' : '수정하기'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isReceiverModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <section role="dialog" aria-modal="true" aria-labelledby="receiver-dialog-title" className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl">
            <h2 id="receiver-dialog-title" className="text-xl font-bold text-gray-800 mb-4">알림 수신자 추가</h2>
            <form onSubmit={handleAddReceiver} className="space-y-4">
              <div>
                <label htmlFor="receiver-name" className="block text-sm text-gray-700 mb-1">이름</label>
                <input id="receiver-name" type="text" value={receiverName} onChange={(event) => setReceiverName(event.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300" required />
              </div>
              <div>
                <label htmlFor="receiver-chat-id" className="block text-sm text-gray-700 mb-1">텔레그램 Chat ID</label>
                <input id="receiver-chat-id" type="text" value={receiverId} onChange={(event) => setReceiverId(event.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsReceiverModalOpen(false)} disabled={savingReceiver} className="flex-1 py-3 text-gray-700 font-bold bg-gray-100 rounded-xl">취소</button>
                <button type="submit" disabled={savingReceiver} className="flex-1 py-3 text-white font-bold bg-blue-600 rounded-xl disabled:opacity-60">{savingReceiver ? '추가 중' : '추가하기'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
