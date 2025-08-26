// Application constants
const APP_CONSTANTS = {
  // Server configuration
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: '/api',

  // MongoDB configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/meeting_manager',

  // CORS configuration
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(','),

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // File upload
  UPLOAD: {
    PATH: process.env.UPLOAD_PATH || './uploads',
    MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    ALLOWED_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'text/plain'
    ],
    ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.txt']
  },

  // Timezone
  TIMEZONE: process.env.TZ || 'Asia/Jakarta',

  // Logging
  LOG: {
    LEVEL: process.env.LOG_LEVEL || 'debug',
    FILE: process.env.LOG_FILE || './logs/app.log'
  },

  // WhatsApp configuration
  WHATSAPP: {
    SESSION_PATH: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session',
    GROUP_ID: process.env.WHATSAPP_GROUP_ID || '',
    NOTIFICATION_TIME: process.env.WHATSAPP_NOTIFICATION_TIME || '07:00',
    REMINDER_ENABLED: process.env.WHATSAPP_REMINDER_ENABLED === 'true',
    GROUP_NOTIFICATION_ENABLED: process.env.WHATSAPP_GROUP_NOTIFICATION_ENABLED === 'true'
  },

  // Meeting constants
  MEETING: {
    STATUS: {
      PENDING: 'pending',
      ONGOING: 'ongoing',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      POSTPONED: 'postponed'
    },
    DEFAULT_DURATION: 60, // minutes
    DEFAULT_REMINDER: 30, // minutes before meeting
    MAX_ATTENDEES: 50,
    MIN_ATTENDEES: 2
  },

  // Participant constants
  PARTICIPANT: {
    STATUS: {
      ACTIVE: 'active',
      INACTIVE: 'inactive'
    }
  },

  // Notification templates
  NOTIFICATION_TEMPLATES: {
    GROUP_DAILY: 'Jadwal Rapat Hari Ini:\n\n' +
                '[daftar_rapat]\n\n' +
                'Silakan konfirmasi kehadiran Anda.',
    
    INDIVIDUAL_REMINDER: 'Reminder Rapat:\n\n' +
                        'Yth. [nama],\n\n' +
                        'Mengingatkan bahwa Anda memiliki jadwal rapat:\n' +
                        'Judul: [judul]\n' +
                        'Tanggal: [tanggal]\n' +
                        'Waktu: [waktu]\n' +
                        'Lokasi: [lokasi]\n\n' +
                        'Rapat akan dimulai dalam [sisa_waktu].\n' +
                        'Mohon kehadirannya tepat waktu.',
    
    TEST_MESSAGE: 'Ini adalah pesan test. ' +
                  'Jika Anda menerima pesan ini, berarti konfigurasi WhatsApp berhasil.'
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // Search configuration
  SEARCH: {
    MIN_CHARS: 3,
    MAX_RESULTS: 50
  },

  // Cache configuration
  CACHE: {
    TTL: 300, // 5 minutes
    MAX_ITEMS: 100
  },

  // Security
  SECURITY: {
    SALT_ROUNDS: 10,
    TOKEN_EXPIRY: '24h',
    MIN_PASSWORD_LENGTH: 8
  }
};

module.exports = APP_CONSTANTS;