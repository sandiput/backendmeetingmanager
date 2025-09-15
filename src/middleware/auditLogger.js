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
 * Generate simple title for audit log
 */
function generateTitle(actionType, tableName, req) {
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
  
  // Special cases for specific endpoints
  if (req.path.includes('/search')) {
    return `Cari ${table}`;
  } else if (req.path.includes('/dashboard')) {
    return `Akses Dashboard`;
  } else if (req.path.includes('/stats')) {
    return `Lihat Statistik`;
  } else if (req.path.includes('/trends')) {
    return `Lihat Trend`;
  } else if (req.path.includes('/top-participants')) {
    return `Lihat Top Peserta`;
  } else if (req.path.includes('/test-whatsapp')) {
    return `Test WhatsApp`;
  } else if (req.path.includes('/templates')) {
    return `${action} Template`;
  } else if (req.path.includes('/whatsapp-group')) {
    return `${action} Grup WhatsApp`;
  }
  
  return `${action} ${table}`;
}

/**
 * Generate description with specific data (title, name, etc.)
 */
function generateDescription(req, responseData, newValues, oldValues) {
  let description = '';
  
  // For UPDATE actions, try to get name from newValues or oldValues first
  if (newValues) {
    if (newValues.title) {
      description = newValues.title;
    } else if (newValues.name) {
      description = newValues.name;
    } else if (newValues.full_name) {
      description = newValues.full_name;
    } else if (newValues.username) {
      description = newValues.username;
    }
  }
  
  // If not found in newValues, try oldValues
  if (!description && oldValues) {
    if (oldValues.title) {
      description = oldValues.title;
    } else if (oldValues.name) {
      description = oldValues.name;
    } else if (oldValues.full_name) {
      description = oldValues.full_name;
    } else if (oldValues.username) {
      description = oldValues.username;
    }
  }
  
  // Extract meaningful data from request body or response as fallback
  if (!description && req.body) {
    if (req.body.title) {
      description = req.body.title;
    } else if (req.body.name) {
      description = req.body.name;
    } else if (req.body.full_name) {
      description = req.body.full_name;
    } else if (req.body.username) {
      description = req.body.username;
    }
  }
  
  // Extract from response data if available as final fallback
  if (!description && responseData && responseData.data) {
    const data = responseData.data;
    if (data.title) {
      description = data.title;
    } else if (data.name) {
      description = data.name;
    } else if (data.full_name) {
      description = data.full_name;
    } else if (data.username) {
      description = data.username;
    }
  }
  
  return description;
}

/**
 * Generate detailed description of changes
 */
function generateDescriptionDetail(req, originalData, newData) {
  const changes = [];
  
  if (!req.body || Object.keys(req.body).length === 0) {
    return '';
  }
  
  // Compare original data with new data to track changes
  if (originalData && newData) {
    Object.keys(req.body).forEach(key => {
      if (originalData[key] !== undefined && originalData[key] !== newData[key]) {
        const fieldNames = {
          'title': 'judul',
          'name': 'nama',
          'full_name': 'nama lengkap',
          'username': 'username',
          'email': 'email',
          'whatsapp_number': 'nomor WhatsApp',
          'phone_number': 'nomor telepon',
          'date': 'tanggal',
          'time': 'waktu',
          'location': 'lokasi',
          'description': 'deskripsi',
          'status': 'status'
        };
        
        const fieldName = fieldNames[key] || key;
        changes.push(`mengubah ${fieldName} dari "${originalData[key]}" menjadi "${newData[key]}"`);
      }
    });
  } else {
    // For new records, list the main fields
    const mainFields = ['title', 'name', 'full_name', 'username', 'email', 'date', 'time', 'location'];
    mainFields.forEach(field => {
      if (req.body[field]) {
        const fieldNames = {
          'title': 'judul',
          'name': 'nama',
          'full_name': 'nama lengkap',
          'username': 'username',
          'email': 'email',
          'date': 'tanggal',
          'time': 'waktu',
          'location': 'lokasi'
        };
        const fieldName = fieldNames[field] || field;
        changes.push(`${fieldName}: "${req.body[field]}"`);
      }
    });
  }
  
  return changes.join(', ');
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
    const title = generateTitle(actionType, tableName, req);
    const description = generateDescription(req, responseData, null, null);
    const descriptionDetail = generateDescriptionDetail(req, null, responseData ? responseData.data : null);
    
    const auditData = {
      user_id: req.admin ? req.admin.id : null, // Get user ID from authenticated admin
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
      title: title,
      description: description,
      description_detail: descriptionDetail,
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
    let actionType, tableName, recordId, oldValues, newValues, description, success, errorMessage, customTitle;
    
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
      customTitle = null;
    } else {
      // New format: logDetailedAudit(req, { action_type, table_name, description, ... })
      actionType = options.action_type || options.actionType;
      tableName = options.table_name || options.tableName;
      recordId = options.record_id || options.recordId || null;
      oldValues = options.old_values || options.oldValues || null;
      newValues = options.new_values || options.newValues || null;
      description = options.description || options.customDescription;
      success = options.success !== undefined ? options.success : true;
      errorMessage = options.error_message || options.error || null;
      customTitle = options.customTitle || null;
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
    
    // Generate title, description, and description detail
    const title = customTitle || generateTitle(actionType.toUpperCase(), tableName, req);
    const finalDescription = description || generateDescription(req, options.responseData, newValues, oldValues);
    const descriptionDetail = generateDescriptionDetail(req, oldValues, newValues);
    
    const auditData = {
      user_id: req.admin ? req.admin.id : null, // Get user ID from authenticated admin
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
      title: title,
      description: finalDescription,
      description_detail: descriptionDetail,
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
  generateTitle,
  generateDescription,
  generateDescriptionDetail,
  sanitizePayload
};