import axios from 'axios';

const BACKEND = 'http://192.168.50.207:5000';

export const fetchTodayLogs = () =>
  axios.get(`${BACKEND}/api/logs/today`).then(res => res.data);

export const postLogEntry = (color) =>
  axios.post(`${BACKEND}/api/logs`, { color });

export const checkESPStatus = () =>
  axios.get(`${BACKEND}/api/esp-status`).then(res => res.data.online);

export const fetchLogsByDate = (date) =>
  axios.get(`${BACKEND}/api/logs/export/${date}`).then(res => res.data);

