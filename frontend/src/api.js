import axios from 'axios';

const BACKEND = 'http://192.168.50.207:5000';

export const fetchTodayLogs = () =>
  axios.get(`${BACKEND}/api/logs/today`).then(res => res.data);

export const postLogEntry = (type) =>
  axios.post(`${BACKEND}/api/logs`, { type });

export const checkESPStatus = () =>
  axios.get(`${BACKEND}/api/esp-status`).then(res => res.data);
