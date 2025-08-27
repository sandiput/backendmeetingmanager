const { validationResult } = require('express-validator');
const { AppError } = require('./logger');

// Sanitize and format WhatsApp number
const formatWhatsAppNumber = (number) => {
  // Remove any non-digit characters
  let cleaned = number.replace(/\D/g, '');

  // Remove leading 0 if exists
  cleaned = cleaned.replace(/^0+/, '');

  // Add country code if not present
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
};

// Validate date format (YYYY-MM-DD)
const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Validate time format (HH:mm:ss) - ISO 8601 compliant
const isValidTime = (timeString) => {
  // Accept both HH:mm and HH:mm:ss formats
  const regexWithSeconds = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  const regexWithoutSeconds = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  // If time has seconds format, return as is
  if (regexWithSeconds.test(timeString)) {
    return true;
  }
  
  // If time has no seconds, it's still valid but we should normalize it
  return regexWithoutSeconds.test(timeString);
};

// Normalize time to ISO format (HH:mm:ss)
const normalizeTimeToISO = (timeString) => {
  if (!timeString) return null;
  
  // If already has seconds, ensure it's properly formatted
  const regexWithSeconds = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  if (regexWithSeconds.test(timeString)) {
    // Ensure hours are two digits
    const [hours, minutes, seconds] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes}:${seconds}`;
  }
  
  // If no seconds, add them and ensure hours are two digits
  const regexWithoutSeconds = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (regexWithoutSeconds.test(timeString)) {
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  }
  
  return null; // Invalid format
};

// Validate NIP format
const isValidNIP = (nip) => {
  // Remove any non-digit characters
  const cleaned = nip.replace(/\D/g, '');
  
  // NIP should be exactly 18 digits
  return cleaned.length === 18;
};

// Validate meeting data
const validateMeetingData = (data) => {
  const errors = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!isValidDate(data.date)) {
    errors.push('Invalid date format. Use YYYY-MM-DD');
  }

  if (!isValidTime(data.time)) {
    errors.push('Invalid time format. Use HH:mm');
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.push('Location is required');
  }

  if (!Array.isArray(data.attendees) || data.attendees.length === 0) {
    errors.push('At least one attendee is required');
  }

  if (data.reminder_minutes !== undefined && 
      (isNaN(data.reminder_minutes) || data.reminder_minutes < 0)) {
    errors.push('Reminder minutes must be a positive number');
  }

  return errors;
};

// Validate participant data
const validateParticipantData = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!data.nip || !isValidNIP(data.nip)) {
    errors.push('Invalid NIP format');
  }

  if (!data.whatsapp_number) {
    errors.push('WhatsApp number is required');
  } else {
    const formattedNumber = formatWhatsAppNumber(data.whatsapp_number);
    if (formattedNumber.length < 10 || formattedNumber.length > 13) {
      errors.push('Invalid WhatsApp number format');
    }
  }

  if (!data.seksi || data.seksi.trim().length === 0) {
    errors.push('Seksi is required');
  }

  return errors;
};

// Validate settings data
const validateSettingsData = (data) => {
  const errors = [];

  if (data.notification_time && !isValidTime(data.notification_time)) {
    errors.push('Invalid notification time format. Use HH:mm');
  }

  if (data.reminder_enabled !== undefined && typeof data.reminder_enabled !== 'boolean') {
    errors.push('Reminder enabled must be a boolean');
  }

  if (data.group_notification_enabled !== undefined && 
      typeof data.group_notification_enabled !== 'boolean') {
    errors.push('Group notification enabled must be a boolean');
  }

  return errors;
};

// Express validator middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation error', 400);
  }
  next();
};

module.exports = {
  formatWhatsAppNumber,
  isValidDate,
  isValidTime,
  normalizeTimeToISO,
  isValidNIP,
  validateMeetingData,
  validateParticipantData,
  validateSettingsData,
  validate
};