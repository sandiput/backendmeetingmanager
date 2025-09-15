const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255],
      notEmpty: true
    }
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin'),
    allowNull: false,
    defaultValue: 'admin'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to user profile picture'
  },
  whatsapp_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'User WhatsApp number'
  }
}, {
  tableName: 'admins',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password) {
        const salt = await bcrypt.genSalt(12);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    }
  }
});

// Instance methods
Admin.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

Admin.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// Class methods
Admin.findByUsername = async function(username) {
  return await this.findOne({
    where: { username, is_active: true }
  });
};

Admin.findByEmail = async function(email) {
  return await this.findOne({
    where: { email, is_active: true }
  });
};

Admin.authenticate = async function(usernameOrEmail, password) {
  const admin = await this.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ],
      is_active: true
    }
  });

  if (!admin) {
    return null;
  }

  const isValid = await admin.validatePassword(password);
  if (!isValid) {
    return null;
  }

  // Update last login
  await admin.update({ last_login: new Date() });
  
  return admin;
};

module.exports = Admin;