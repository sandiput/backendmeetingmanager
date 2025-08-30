const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // User & Session Info
  user_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'User ID (null for anonymous users)'
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Browser session fingerprint'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: false,
    comment: 'Client IP address (supports IPv6)'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Browser user agent string'
  },
  
  // Action Details
  action_type: {
    type: DataTypes.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE'),
    allowNull: false,
    comment: 'Type of CRUD operation'
  },
  table_name: {
    type: DataTypes.ENUM('meetings', 'participants', 'settings', 'meeting_participants', 'notification_logs'),
    allowNull: false,
    comment: 'Target table name'
  },
  record_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'ID of the affected record'
  },
  
  // Request Info
  http_method: {
    type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
    allowNull: false,
    comment: 'HTTP method used'
  },
  endpoint: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'API endpoint accessed'
  },
  
  // Data Changes
  old_values: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Previous values before change (for UPDATE/DELETE)'
  },
  new_values: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'New values after change (for CREATE/UPDATE)'
  },
  changed_fields: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of field names that were changed'
  },
  
  // Context
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Human-readable description of the action'
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether the operation was successful'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if operation failed'
  },
  
  // Performance
  execution_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Execution time in milliseconds'
  },
  
  // Additional Context
  request_payload: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Request body/parameters (sanitized)'
  },
  response_status: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'HTTP response status code'
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // We don't need updatedAt for audit logs
  indexes: [
    {
      fields: ['action_type']
    },
    {
      fields: ['table_name']
    },
    {
      fields: ['record_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['user_id', 'session_id']
    },
    {
      fields: ['ip_address']
    },
    {
      fields: ['success']
    }
  ]
});

// Static methods for common queries
AuditLog.getByTable = function(tableName, limit = 100) {
  return this.findAll({
    where: { table_name: tableName },
    order: [['created_at', 'DESC']],
    limit
  });
};

AuditLog.getByAction = function(actionType, limit = 100) {
  return this.findAll({
    where: { action_type: actionType },
    order: [['created_at', 'DESC']],
    limit
  });
};

AuditLog.getBySession = function(sessionId, limit = 100) {
  return this.findAll({
    where: { session_id: sessionId },
    order: [['created_at', 'DESC']],
    limit
  });
};

AuditLog.getFailedOperations = function(limit = 100) {
  return this.findAll({
    where: { success: false },
    order: [['created_at', 'DESC']],
    limit
  });
};

AuditLog.getSlowOperations = function(thresholdMs = 1000, limit = 100) {
  return this.findAll({
    where: {
      execution_time_ms: {
        [sequelize.Sequelize.Op.gte]: thresholdMs
      }
    },
    order: [['execution_time_ms', 'DESC']],
    limit
  });
};

module.exports = AuditLog;