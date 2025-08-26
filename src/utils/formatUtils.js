class FormatUtils {
  // Format NIP
  static formatNIP(nip) {
    if (!nip) return '';
    
    // Remove any non-digit characters
    const cleaned = nip.replace(/\D/g, '');
    
    // NIP should be exactly 18 digits
    if (cleaned.length !== 18) return cleaned;
    
    // Format: YYYYMMDD XXXXXXXX X
    return `${cleaned.slice(0, 8)} ${cleaned.slice(8, 16)} ${cleaned.slice(16)}`;
  }

  // Format WhatsApp number
  static formatWhatsAppNumber(number) {
    if (!number) return '';

    // Remove any non-digit characters
    let cleaned = number.replace(/\D/g, '');

    // Remove leading 0
    cleaned = cleaned.replace(/^0+/, '');

    // Add country code if not present
    if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    return cleaned;
  }

  // Format name
  static formatName(name) {
    if (!name) return '';

    // Trim whitespace
    name = name.trim();

    // Capitalize first letter of each word
    return name.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  // Format section name (seksi)
  static formatSeksi(seksi) {
    if (!seksi) return '';

    // Trim whitespace and convert to uppercase
    return seksi.trim().toUpperCase();
  }

  // Format percentage
  static formatPercentage(value, decimals = 1) {
    if (typeof value !== 'number') return '0%';
    return value.toFixed(decimals) + '%';
  }

  // Format currency
  static formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Format number with thousand separator
  static formatNumber(number) {
    return new Intl.NumberFormat('id-ID').format(number);
  }

  // Format boolean to Indonesian
  static formatBoolean(value) {
    return value ? 'Ya' : 'Tidak';
  }

  // Format meeting title
  static formatMeetingTitle(title) {
    if (!title) return '';

    // Trim whitespace
    title = title.trim();

    // Capitalize first letter
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Format location
  static formatLocation(location) {
    if (!location) return '';

    // Trim whitespace
    location = location.trim();

    // Capitalize first letter of each word
    return location.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
  }

  // Format status
  static formatStatus(status) {
    if (!status) return '';

    const statusMap = {
      'pending': 'Menunggu',
      'ongoing': 'Sedang Berlangsung',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan',
      'postponed': 'Ditunda'
    };

    return statusMap[status.toLowerCase()] || status;
  }

  // Format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format duration
  static formatDuration(minutes) {
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
  }

  // Sanitize string for safe display
  static sanitizeString(str) {
    if (!str) return '';
    return str
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

module.exports = FormatUtils;