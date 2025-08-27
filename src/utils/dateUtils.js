const { format, parseISO, isValid, isBefore, isAfter, addMinutes } = require('date-fns');
const { id } = require('date-fns/locale');

// Format date to Indonesian format
const formatDateIndonesian = (date) => {
  if (typeof date === 'string') {
    date = parseISO(date);
  }
  return format(date, 'EEEE, d MMMM yyyy', { locale: id });
};

// Format time to 24-hour format with seconds (ISO 8601 compliant)
const formatTime = (time) => {
  if (!time) return '';
  
  // If time is already in HH:mm:ss format, ensure it's properly formatted
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(time)) {
    const [hours, minutes, seconds] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}:${seconds}`;
  }
  
  // If time is in HH:mm format, add seconds and ensure proper formatting
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  }

  // If time is a Date object, format it with seconds
  if (time instanceof Date) {
    return format(time, 'HH:mm:ss');
  }

  return '';
};

// Combine date and time strings into a Date object
const combineDateAndTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;

  // Parse time components, handling both HH:mm and HH:mm:ss formats
  const timeParts = timeStr.split(':');
  const hours = parseInt(timeParts[0] || 0);
  const minutes = parseInt(timeParts[1] || 0);
  const seconds = parseInt(timeParts[2] || 0);
  
  const date = parseISO(dateStr);
  
  if (!isValid(date)) return null;

  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(seconds);
  
  return date;
};

// Check if a meeting is upcoming
const isUpcomingMeeting = (date, time) => {
  const meetingDateTime = combineDateAndTime(date, time);
  if (!meetingDateTime) return false;

  const now = new Date();
  return isAfter(meetingDateTime, now);
};

// Check if a meeting is ongoing
const isOngoingMeeting = (date, time, durationMinutes = 60) => {
  const meetingDateTime = combineDateAndTime(date, time);
  if (!meetingDateTime) return false;

  const now = new Date();
  const meetingEndTime = addMinutes(meetingDateTime, durationMinutes);

  return isAfter(now, meetingDateTime) && isBefore(now, meetingEndTime);
};

// Check if a meeting is completed
const isCompletedMeeting = (date, time, durationMinutes = 60) => {
  const meetingDateTime = combineDateAndTime(date, time);
  if (!meetingDateTime) return false;

  const now = new Date();
  const meetingEndTime = addMinutes(meetingDateTime, durationMinutes);

  return isAfter(now, meetingEndTime);
};

// Get meeting status
const getMeetingStatus = (date, time) => {
  if (isUpcomingMeeting(date, time)) {
    return 'upcoming';
  } else if (isOngoingMeeting(date, time)) {
    return 'ongoing';
  } else if (isCompletedMeeting(date, time)) {
    return 'completed';
  } else {
    return 'unknown';
  }
};

// Format duration in minutes to human readable format
const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0 menit';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${minutes} menit`;
  } else if (remainingMinutes === 0) {
    return `${hours} jam`;
  } else {
    return `${hours} jam ${remainingMinutes} menit`;
  }
};

// Get time remaining until meeting
const getTimeRemaining = (date, time) => {
  const meetingDateTime = combineDateAndTime(date, time);
  if (!meetingDateTime) return null;

  const now = new Date();
  const diffInMinutes = Math.floor((meetingDateTime - now) / (1000 * 60));

  if (diffInMinutes < 0) return null;

  return formatDuration(diffInMinutes);
};

module.exports = {
  formatDateIndonesian,
  formatTime,
  combineDateAndTime,
  isUpcomingMeeting,
  isOngoingMeeting,
  isCompletedMeeting,
  getMeetingStatus,
  formatDuration,
  getTimeRemaining
};