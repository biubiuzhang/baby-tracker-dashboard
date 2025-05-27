import axios from 'axios';

const BACKEND = 'http://rpi.local:5000';

// ✅ Get today’s summary counts (pee/poo/feed count)
export const fetchTodaySummary = () =>
  axios.get(`${BACKEND}/api/logs/today`).then(res => res.data.logs || []);

// ✅ Get full logs by date (used by PastLogList)
export const fetchLogsByDate = (date) =>
  axios.get(`${BACKEND}/api/logs/${date}`).then(res => res.data.logs || []);

// ✅ Add a new event (used for dev buttons or test)
export const postEvent = (event, action = null, volume_ml = null, reason = null) =>
  axios.post(`${BACKEND}/api/logs`, {
    event,
    action,
    volume: volume_ml,
    reason
  });

// ✅ ESP32 connection status
export const checkESPStatus = () =>
  axios.get(`${BACKEND}/api/esp-status`).then(res => res.data.online);

// ✅ Get total volume + diaper summary for today
export const fetchDailyStats = () =>
  axios.get(`${BACKEND}/api/stats/summary/today`).then(res => res.data);

// ✅ Get last 7 days of formula + diaper data
export const fetchWeekStats = () =>
  axios.get(`${BACKEND}/api/stats/days`).then(res => res.data.days || []);
