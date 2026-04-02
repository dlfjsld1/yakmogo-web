import axios from 'axios';

export const http = axios.create({
  //TODO: 나중에 빌드할 때는 배포 환경에 따라 개발용 baseURL과 운영용 baseURL을 나누어야 할 수도 있으니 확인할 것
  baseURL: '/api/v1',
});

//나갈 때 비밀번호 붙이기
http.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminPassword');
  const magicToken = localStorage.getItem('magicToken');
  if (adminToken) {
    config.headers['x-admin-password'] = adminToken;
  } else if (magicToken) {
    config.headers['x-magic-token'] = magicToken;
  }
  return config;
})

//401시 로그인창으로 이동
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status == 401) {

      //토큰을 지우기 전에 텔레그램 유저인지 확인
      const isTelegramUser = !!localStorage.getItem('magicToken') && !localStorage.getItem('adminPassword');

      localStorage.removeItem('adminPassword');
      localStorage.removeItem('magicToken');

      if (isTelegramUser) {
        alert('인증이 만료되었습니다. 텔레그램을 통해 다시 접속해주세요.');
        window.location.href = '/tg-login'; 
      } else {
        alert('관리자 암호가 틀렸거나 만료되었습니다.');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
)