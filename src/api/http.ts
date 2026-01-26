import axios from 'axios';

export const http = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

//나갈 때 비밀번호 붙이기
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminPassword');

  if (token) {
    config.headers['x-admin-password'] = token;
  }
  return config;
})

//401시 로그인창으로 이동
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status == 401) {
      alert('관리자 암호가 틀렸습니다.');
      //틀린 비번 삭제
      localStorage.removeItem('adminPassword');
      //새로고침
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
)