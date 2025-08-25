const MODE = 'online'; // 'local' | 'online'

export const API_BASE_URL =
  MODE === 'local'
    ? 'http://192.168.1.24:3000'
    : 'https://mylibrary-back-1.onrender.com';


    