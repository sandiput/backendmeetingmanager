const AuditLog = require('../models/audit_log');
const crypto = require('crypto');

/**
 * Generate session ID based on browser fingerprint
 */
function generateSessionId(req) {
  const fingerprint = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.ip || req.connection.remoteAddress || '',
    req.headers['x-forwarded-for'] || ''
  ].join('|');
  
  return 'sess_' + crypto.createHash('md5').update(fingerprint).digest('hex').substring(0, 16);
}

/**
 * Determine action type based on HTTP method and endpoint
 */
function determineActionType(method, path) {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'GET':
      return 'READ';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'READ';
  }
}

/**
 * Determine table name based on endpoint
 */
function determineTableName(path) {
  if (path.includes('/meetings')) {
    return 'meetings';
  } else if (path.includes('/participants')) {
    return 'participants';
  } else if (path.includes('/settings')) {
    return 'settings';
  } else if (path.includes('/dashboard') || path.includes('/stats')) {
    return 'notification_logs'; // Dashboard queries notification logs
  }
  return 'meetings'; // Default fallback
}

/**
 * Extract record ID from path or request body
 */
function extractRecordId(req) {
  // Try to get ID from URL params
  if (req.params && req.params.id) {
    return req.params.id;
  }
  
  // Try to get ID from request body
  if (req.body && req.body.id) {
    return req.body.id;
  }
  
  // For meeting participants, try to get meeting_id
  if (req.body && req.body.meeting_id) {
    return req.body.meeting_id;
  }
  
  return null;
}

/**
 * Generate human-readable description in Indonesian
 */
function generateDescription(actionType, tableName, recordId, req) {
  const baseActions = {
    'CREATE': 'Buat',
    'READ': 'Lihat',
    'UPDATE': 'Ubah',
    'DELETE': 'Hapus'
  };
  
  const tableNames = {
    'meetings': 'Meeting',
    'participants': 'Peserta',
    'settings': 'Pengaturan',
    'meeting_participants': 'Peserta Meeting',
    'notification_logs': 'Log Notifikasi',
    'meeting_trends': 'Trend Meeting',
    'seksi_stats': 'Statistik Seksi',
    'dashboard_stats': 'Statistik Dashboard'
  };
  
  const action = baseActions[actionType] || actionType;
  const table = tableNames[tableName] || tableName;
  
  // Special cases for specific endpoints and operations
  if (req.path.includes('/search')) {
    return `Cari Data ${table}`;
  } else if (req.path.includes('/dashboard')) {
    return `Akses Statistik Dashboard`;
  } else if (req.path.includes('/stats')) {
    return `Lihat Statistik ${table}`;
  } else if (req.path.includes('/trends')) {
    return `Lihat Trend Meeting`;
  } else if (req.path.includes('/top-participants')) {
    return `Lihat Top Peserta Aktif`;
  } else if (req.path.includes('/test-whatsapp')) {
    return `Test Koneksi WhatsApp`;
  } else if (req.path.includes('/templates')) {
    return `${action} Template Pesan`;
  } else if (req.path.includes('/whatsapp-group')) {
    return `${action} Grup WhatsApp`;
  }
  
  // Standard CRUD operations
  if (recordId) {
    return `${action} ${table} (ID: ${recordId})`;
  }
  
  // General operations
  if (actionType === 'CREATE') {
    return `${action} ${table} Baru`;
  } else if (actionType === 'READ') {
    return `${action} Daftar ${table}`;
  }
  
  return `${action} ${table}`;
}

/**
 * Sanitize request payload (remove sensitive data)
 */
function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  
  const sanitized = { ...payload };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Main audit logging middleware
 */
const auditLogger = (req, res, next) => {
  // Skip logging for certain endpoints
  const skipPaths = ['/health', '/ping', '/favicon.ico'];
  if (skipPaths.some(path => req.path.includes(path))) {
    return next();
  }
  
  const startTime = Date.now();
  const sessionId = req.headers['x-session-id'] || generateSessionId(req);
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  
  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override response methods to capture data
  res.send = function(data) {
    logAuditEntry(req, res, data, startTime, sessionId, ipAddress);
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    logAuditEntry(req, res, data, startTime, sessionId, ipAddress);
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Log audit entry to database
 */
async function logAuditEntry(req, res, responseData, startTime, sessionId, ipAddress) {
  try {
    const executionTime = Date.now() - startTime;
    const actionType = determineActionType(req.method, req.path);
    const tableName = determineTableName(req.path);
    const recordId = extractRecordId(req);
    const success = res.statusCode < 400;
    
    const auditData = {
      user_id: null, // No login system
      session_id: sessionId,
      ip_address: ipAddress,
      user_agent: req.headers['user-agent'] || null,
      action_type: actionType,
      table_name: tableName,
      record_id: recordId,
      http_method: req.method.toUpperCase(),
      endpoint: req.originalUrl || req.path,
      old_values: null, // Will be populated by specific controllers
      new_values: null, // Will be populated by specific controllers
      changed_fields: null, // Will be populated by specific controllers
      description: generateDescription(actionType, tableName, recordId, req),
      success: success,
      error_message: success ? null : (responseData && responseData.error ? responseData.error : null),
      execution_time_ms: executionTime,
      request_payload: sanitizePayload(req.body),
      response_status: res.statusCode
    };
    
    // Create audit log entry
    await AuditLog.create(auditData);
    
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw error to avoid breaking the main request
  }
}

/**
 * Helper function for controllers to log detailed CRUD operations
 * Supports both old format and new flexible format
 */
const logDetailedAudit = async (req, options) => {
  try {
    // Support both old format (multiple parameters) and new format (options object)
    let actionType, tableName, recordId, oldValues, newValues, description, success, errorMessage;
    
    if (typeof options === 'string') {
      // Old format: logDetailedAudit(req, actionType, tableName, recordId, oldValues, newValues, description)
      actionType = options;
      tableName = arguments[2];
      recordId = arguments[3];
      oldValues = arguments[4];
      newValues = arguments[5];
      description = arguments[6];
      success = true;
      errorMessage = null;
    } else {
      // New format: logDetailedAudit(req, { action_type, table_name, description, ... })
      actionType = options.action_type;
      tableName = options.table_name;
      recordId = options.record_id || null;
      oldValues = options.old_values || null;
      newValues = options.new_values || null;
      description = options.description;
      success = options.success !== undefined ? options.success : true;
      errorMessage = options.error_message || null;
    }
    
    const sessionId = req.headers['x-session-id'] || generateSessionId(req);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Determine changed fields
    let changedFields = [];
    if (oldValues && newValues) {
      changedFields = Object.keys(newValues).filter(key => 
        JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
      );
    } else if (newValues) {
      changedFields = Object.keys(newValues);
    } else if (oldValues) {
      changedFields = ['deleted'];
    }
    
    const auditData = {
      user_id: null,
      session_id: sessionId,
      ip_address: ipAddress,
      user_agent: req.headers['user-agent'] || null,
      action_type: actionType.toUpperCase(),
      table_name: tableName,
      record_id: recordId,
      http_method: req.method.toUpperCase(),
      endpoint: req.originalUrl || req.path,
      old_values: oldValues,
      new_values: newValues,
      changed_fields: changedFields,
      description: description || generateDescription(actionType.toUpperCase(), tableName, recordId, req),
      success: success,
      error_message: errorMessage,
      execution_time_ms: null,
      request_payload: sanitizePayload(req.body),
      response_status: success ? 200 : 500
    };
    
    await AuditLog.create(auditData);
    
  } catch (error) {
    console.error('Detailed audit logging error:', error);
  }
};

module.exports = {
  auditLogger,
  logDetailedAudit,
  generateSessionId,
  determineActionType,
  determineTableName,
  sanitizePayload
};