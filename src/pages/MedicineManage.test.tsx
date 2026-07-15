import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MedicineManage from './MedicineManage'
import { http } from '../api/http'

vi.mock('../api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedHttp = vi.mocked(http)

const userDetail = {
  id: 7,
  name: '김약속',
  guardians: [],
}

const intervalMedicine = {
  id: 11,
  name: '혈압약',
  scheduleType: 'INTERVAL',
  scheduleValue: '3',
  startDate: '2026-07-14',
  intakeTime: '09:30:00',
  active: true,
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/users/7/medicines']}>
      <Routes>
        <Route path="/users/:userId/medicines" element={<MedicineManage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function resolveInitialLoad(medicines: typeof intervalMedicine[] = []) {
  mockedHttp.get
    .mockResolvedValueOnce({ data: userDetail })
    .mockResolvedValueOnce({ data: medicines })
}

describe('MedicineManage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('로딩 후 약이 없는 상태를 안내한다', async () => {
    resolveInitialLoad()

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('복용 정보를 불러오는 중')
    expect(await screen.findByText('등록된 약이 없어요.')).toBeInTheDocument()
  })

  it('조회 실패를 화면에 표시하고 다시 시도한다', async () => {
    mockedHttp.get.mockRejectedValueOnce(new Error('network down'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('복용 정보를 불러오지 못했습니다')

    resolveInitialLoad()
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findByText('등록된 약이 없어요.')).toBeInTheDocument()
  })

  it('인증 만료 응답을 화면 오류로 구분한다', async () => {
    mockedHttp.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401, data: {} },
    })

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('인증이 만료되었습니다')
  })

  it('주간 약 등록 중 버튼을 잠가 중복 요청을 막는다', async () => {
    resolveInitialLoad()
    let finishRequest!: () => void
    mockedHttp.post.mockReturnValueOnce(new Promise((resolve) => {
      finishRequest = () => resolve({ data: 'ok' })
    }))

    renderPage()
    await screen.findByText('등록된 약이 없어요.')

    await userEvent.click(screen.getByRole('button', { name: '약 추가' }))
    await userEvent.type(screen.getByLabelText('약 이름'), '비타민')
    await userEvent.selectOptions(screen.getByLabelText('복용 주기'), 'WEEKLY')
    await userEvent.click(screen.getByRole('button', { name: '월요일' }))

    const submit = screen.getByRole('button', { name: '등록하기' })
    await userEvent.click(submit)

    expect(screen.getByRole('button', { name: '저장 중' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: '저장 중' }))
    expect(mockedHttp.post).toHaveBeenCalledTimes(1)
    expect(mockedHttp.post).toHaveBeenCalledWith('/medicine-groups/users/7/medicines', expect.objectContaining({
      name: '비타민',
      scheduleType: 'WEEKLY',
      scheduleValue: 'Monday',
    }))

    resolveInitialLoad()
    await act(async () => finishRequest())
    expect(await screen.findByRole('status')).toHaveTextContent('약이 등록되었습니다')
  })

  it('기존 간격 약을 수정하고 목록을 다시 조회한다', async () => {
    resolveInitialLoad([intervalMedicine])
    mockedHttp.put.mockResolvedValueOnce({ data: 'ok' })

    renderPage()
    await screen.findByText('혈압약')
    await userEvent.click(screen.getByRole('button', { name: '혈압약 수정' }))

    expect(screen.getByLabelText('복용 주기')).toHaveValue('INTERVAL')
    expect(screen.getByLabelText('복용 간격 (일)')).toHaveValue(3)
    await userEvent.clear(screen.getByLabelText('복용 간격 (일)'))
    await userEvent.type(screen.getByLabelText('복용 간격 (일)'), '5')

    resolveInitialLoad([{
      ...intervalMedicine,
      scheduleValue: '5',
    }])
    await userEvent.click(screen.getByRole('button', { name: '수정하기' }))

    await waitFor(() => expect(mockedHttp.put).toHaveBeenCalledWith(
      '/medicine-groups/medicines/11',
      expect.objectContaining({ scheduleType: 'INTERVAL', scheduleValue: '5' }),
    ))
    expect(await screen.findByRole('status')).toHaveTextContent('약 정보가 수정되었습니다')
  })

  it('삭제 확인 뒤 성공한 항목만 목록에서 제거한다', async () => {
    resolveInitialLoad([intervalMedicine])
    mockedHttp.delete.mockResolvedValueOnce({ data: 'ok' })

    renderPage()
    await screen.findByText('혈압약')
    await userEvent.click(screen.getByRole('button', { name: '혈압약 삭제' }))

    expect(mockedHttp.delete).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: '혈압약 삭제 확인' }))

    expect(mockedHttp.delete).toHaveBeenCalledWith('/medicine-groups/medicines/11')
    expect(await screen.findByText('등록된 약이 없어요.')).toBeInTheDocument()
  })
})
