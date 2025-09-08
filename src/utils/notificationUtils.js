const { formatDateIndonesian, formatTime, getTimeRemaining } = require('./dateUtils');

class NotificationUtils {
  // Format group daily notification message
  static formatDailyGroupMessage(meetings, template) {
    if (!meetings || meetings.length === 0) {
      return 'Tidak ada rapat hari ini.';
    }

    let message = template || 'Jadwal Rapat Hari Ini:\n\n';

    meetings.forEach((meeting, index) => {
      message += `${index + 1}. *${meeting.title}*\n`;
      message += `📅 ${formatDateIndonesian(meeting.date)}\n`;
      message += `⏰ ${formatTime(meeting.time)}\n`;
      message += `📍 ${meeting.location}\n`;
      // Get unique sections from participants
      const uniqueSections = [...new Set(
        meeting.participants?.map(p => p.section).filter(section => section) || []
      )];
      
      if (uniqueSections.length > 0) {
        message += `👥 ${uniqueSections.join(', ')}\n`;
      } else {
        message += `👥 ${meeting.participants?.length || 0} peserta\n`;
      }
      if (meeting.notes) {
        message += `📝 ${meeting.notes}\n`;
      }
      message += '\n';
    });

    message += '\nSilakan konfirmasi kehadiran Anda.';

    return message;
  }

  // Format individual reminder message
  static formatReminderMessage(meeting, participant, template) {
    if (!meeting || !participant) return '';

    const timeRemaining = getTimeRemaining(meeting.date, meeting.time);
    let message = template || `Reminder Rapat:\n\n`;

    message = message
      .replace('[nama]', participant.name)
      .replace('[judul]', meeting.title)
      .replace('[tanggal]', formatDateIndonesian(meeting.date))
      .replace('[waktu]', formatTime(meeting.time))
      .replace('[lokasi]', meeting.location)
      .replace('[sisa_waktu]', timeRemaining || 'segera dimulai');

    if (meeting.notes) {
      message += `\n\nCatatan: ${meeting.notes}`;
    }

    return message;
  }

  // Format test message
  static formatTestMessage(type = 'individual', recipient = '') {
    if (type === 'group') {
      return 'Ini adalah pesan test untuk grup WhatsApp. ' +
             'Jika Anda menerima pesan ini, berarti konfigurasi notifikasi grup berhasil.';
    }

    return `Ini adalah pesan test untuk nomor ${recipient}. ` +
           'Jika Anda menerima pesan ini, berarti konfigurasi notifikasi individual berhasil.';
  }

  // Format attendance confirmation message
  static formatAttendanceMessage(participant, meeting, status) {
    let message = `Konfirmasi Kehadiran:\n\n`;
    message += `Nama: ${participant.name}\n`;
    message += `NIP: ${participant.nip}\n`;
    message += `Rapat: ${meeting.title}\n`;
    message += `Tanggal: ${formatDateIndonesian(meeting.date)}\n`;
    message += `Waktu: ${formatTime(meeting.time)}\n`;
    message += `Status: ${status ? 'Hadir' : 'Tidak Hadir'}\n`;

    return message;
  }

  // Format meeting cancellation message
  static formatCancellationMessage(meeting) {
    let message = `⚠️ Pembatalan Rapat\n\n`;
    message += `Rapat berikut telah dibatalkan:\n\n`;
    message += `*${meeting.title}*\n`;
    message += `📅 ${formatDateIndonesian(meeting.date)}\n`;
    message += `⏰ ${formatTime(meeting.time)}\n`;
    message += `📍 ${meeting.location}\n`;

    if (meeting.cancellation_reason) {
      message += `\nAlasan: ${meeting.cancellation_reason}`;
    }

    return message;
  }

  // Format meeting rescheduling message
  static formatReschedulingMessage(meeting, oldDate, oldTime) {
    let message = `📢 Perubahan Jadwal Rapat\n\n`;
    message += `*${meeting.title}*\n\n`;
    message += `Jadwal Lama:\n`;
    message += `📅 ${formatDateIndonesian(oldDate)}\n`;
    message += `⏰ ${formatTime(oldTime)}\n\n`;
    message += `Jadwal Baru:\n`;
    message += `📅 ${formatDateIndonesian(meeting.date)}\n`;
    message += `⏰ ${formatTime(meeting.time)}\n`;
    message += `📍 ${meeting.location}\n`;

    if (meeting.rescheduling_reason) {
      message += `\nAlasan: ${meeting.rescheduling_reason}`;
    }

    return message;
  }

  // Format meeting summary message
  static formatSummaryMessage(meeting) {
    let message = `📋 Ringkasan Rapat\n\n`;
    message += `*${meeting.title}*\n`;
    message += `📅 ${formatDateIndonesian(meeting.date)}\n`;
    message += `⏰ ${formatTime(meeting.time)}\n`;
    message += `📍 ${meeting.location}\n\n`;
    
    // Attendance summary
    const totalAttendees = meeting.participants?.length || 0;
    const presentAttendees = meeting.participants?.filter(a => a.attendance_confirmed).length || 0;
    
    message += `👥 Kehadiran: ${presentAttendees}/${totalAttendees} peserta\n`;
    
    if (meeting.summary) {
      message += `\n📝 Hasil Rapat:\n${meeting.summary}`;
    }

    if (meeting.action_items && meeting.action_items.length > 0) {
      message += `\n\n📌 Tindak Lanjut:\n`;
      meeting.action_items.forEach((item, index) => {
        message += `${index + 1}. ${item}\n`;
      });
    }

    return message;
  }
}

module.exports = NotificationUtils;