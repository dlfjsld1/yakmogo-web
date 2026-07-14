import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { AUTH_NOTICE_KEY } from './api/http'

describe('App authentication notice', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('인증 만료 이유를 로그인 화면에 한 번 표시한다', () => {
    sessionStorage.setItem(AUTH_NOTICE_KEY, '관리자 인증이 만료되었습니다. 다시 로그인해 주세요.')

    render(<App />)

    expect(screen.getByRole('alert')).toHaveTextContent('관리자 인증이 만료되었습니다')
    expect(sessionStorage.getItem(AUTH_NOTICE_KEY)).toBeNull()
  })
})
