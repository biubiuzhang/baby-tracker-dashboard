import axios from 'axios';

const BACKEND = 'http://rpi.local:5000';

// ✅ Get today’s summary counts (pee/poo/feed count)
export const fetchTodaySummary = () =>
  axios.get(`/api/logs/today`).then(res => res.data.logs || []);

// ✅ Get full logs by date (used by PastLogList)
export const fetchLogsByDate = (date) =>
  axios.get(`/api/logs/${date}`).then(res => res.data.logs || []);

// ✅ Add a new event (used for dev buttons or test)
export const postEvent = (event, action = null, volume = null, reason = null) =>
  axios.post(`/api/logs`, {
    event,
    action,
    volume: volume,
    reason
  });

// ✅ ESP32 connection status
export const checkESPStatus = () =>
  axios.get(`/api/esp-status`).then(res => res.data.online);

// ✅ Get total volume + diaper summary for today
export const fetchDailyStats = () =>
  axios.get(`/api/stats/summary/today`).then(res => res.data);

// ✅ Get last 7 days of formula + diaper data
export const fetchWeekStats = () =>
  axios.get(`/api/stats/days`).then(res => res.data.days || []);
