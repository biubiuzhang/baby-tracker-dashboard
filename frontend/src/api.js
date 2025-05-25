import axios from 'axios';

const BACKEND = 'http://rpi.local:5000';

export const fetchTodayLogs = () =>
  axios.get(`${BACKEND}/api/logs/today`).then(res => res.data.logs || []);

export const postLogEntry = (color) =>
  axios.post(`${BACKEND}/api/logs`, { color });

export const checkESPStatus = () =>
  axios.get(`${BACKEND}/api/esp-status`).then(res => res.data.online);

export const fetchLogsByDate = (date) =>
  axios.get(`${BACKEND}/api/logs/export/${date}`).then(res => res.data);

