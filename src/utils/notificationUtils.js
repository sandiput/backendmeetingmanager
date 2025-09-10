const { formatDateIndonesian, formatTime, getTimeRemaining } = require("./dateUtils");

class NotificationUtils {
  // Format group daily notification message
  static formatDailyGroupMessage(meetings, template) {
    if (!meetings || meetings.length === 0) {
      return "Tidak ada rapat hari ini.";
    }

    let message = template || "Jadwal Rapat Hari Ini:\n\n";

    meetings.forEach((meeting, index) => {
      message += `${index + 1}. *${meeting.title}*\n`;
      message += `📅 ${formatDateIndonesian(meeting.date)}\n`;
      message += `⏰ ${formatTime(meeting.time)}\n`;
      message += `📍 ${meeting.location}\n`;
      // Get unique sections from participants
      const uniqueSections = [...new Set(meeting.participants?.map((p) => p.section).filter((section) => section) || [])];

      if (uniqueSections.length > 0) {
        message += `👥 ${uniqueSections.join(", ")}\n`;
      } else {
        message += `👥 ${meeting.participants?.length || 0} peserta\n`;
      }
      if (meeting.notes) {
        message += `📝 ${meeting.notes}\n`;
      }
      message += "\n";
    });

    message += "\nSilakan konfirmasi kehadiran Anda.";

    return message;
  }

  // Format individual reminder message
  static formatReminderMessage(meeting, participant, template) {
    if (!meeting || !participant) return "";

    const timeRemaining = getTimeRemaining(meeting.date, meeting.time);
    let message = template || `Reminder Rapat:\n\n`;

    message = message
      .replace("[nama]", participant.name)
      .replace("[judul]", meeting.title)
      .replace("[tanggal]", formatDateIndonesian(meeting.date))
      .replace("[waktu]", formatTime(meeting.time))
      .replace("[lokasi]", meeting.location)
      .replace("[sisa_waktu]", timeRemaining || "segera dimulai");

    if (meeting.notes) {
      message += `\n\nCatatan: ${meeting.notes}`;
    }

    return message;
  }

  // Format test message
  static formatTestMessage(type = "individual", recipient = "") {
    if (type === "group") {
      return "Ini adalah pesan test untuk grup WhatsApp. " + "Jika Anda menerima pesan ini, berarti konfigurasi notifikasi grup berhasil.";
    }

    return `Ini adalah pesan test untuk nomor ${recipient}. ` + "Jika Anda menerima pesan ini, berarti konfigurasi notifikasi individual berhasil.";
  }
}

module.exports = NotificationUtils;
