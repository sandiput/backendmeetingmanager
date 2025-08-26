const { Meeting, Participant } = require('../models');

// Seed data for participants
const participantData = [
  {
    name: 'Ahmad Fauzi',
    whatsapp_number: '6281234567890',
    nip: '198501152010011001',
    seksi: 'Pengawasan I',
    is_active: true
  },
  {
    name: 'Budi Santoso',
    whatsapp_number: '6281234567891',
    nip: '198601252010011002',
    seksi: 'Pengawasan II',
    is_active: true
  },
  {
    name: 'Citra Dewi',
    whatsapp_number: '6281234567892',
    nip: '198702152010012001',
    seksi: 'Pengawasan III',
    is_active: true
  },
  {
    name: 'Dian Purnama',
    whatsapp_number: '6281234567893',
    nip: '198803252010012002',
    seksi: 'Pengawasan I',
    is_active: true
  },
  {
    name: 'Eko Prasetyo',
    whatsapp_number: '6281234567894',
    nip: '198904152010011003',
    seksi: 'Pengawasan II',
    is_active: true
  }
];

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Generate meeting dates
const generateMeetingDates = () => {
  const dates = [];
  const today = new Date();
  
  // Past dates
  for (let i = 1; i <= 3; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - (i * 3)); // Every 3 days in the past
    dates.push(pastDate);
  }
  
  // Upcoming dates
  for (let i = 1; i <= 3; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + (i * 3)); // Every 3 days in the future
    dates.push(futureDate);
  }
  
  return dates;
};

// Seed data for meetings
const generateMeetingData = (dates) => {
  const meetingTitles = [
    'Rapat Koordinasi Pengawasan',
    'Evaluasi Kinerja Triwulan',
    'Pembahasan Anggaran Tahunan',
    'Sosialisasi Kebijakan Baru',
    'Rapat Persiapan Audit',
    'Evaluasi Hasil Pemeriksaan'
  ];
  
  const locations = [
    'Ruang Rapat Utama',
    'Ruang Rapat Kecil',
    'Aula Kantor',
    'Ruang Multimedia',
    'Zoom Meeting'
  ];
  
  return dates.map((date, index) => {
    const isPast = index < 3;
    
    return {
      title: meetingTitles[index % meetingTitles.length],
      date: formatDate(date),
      start_time: '09:00:00',
      end_time: '11:00:00',
      location: locations[index % locations.length],
      meeting_link: index % 3 === 0 ? 'https://zoom.us/j/123456789' : null,
      dress_code: index % 2 === 0 ? 'Formal' : 'Casual',
      invitation_reference: `REF/${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${index + 1}`,
      attendance_link: `https://forms.office.com/attendance/${index}`,
      discussion_results: isPast ? 'Hasil pembahasan telah didokumentasikan dan ditindaklanjuti sesuai arahan pimpinan.' : null,
      status: isPast ? (index % 3 === 0 ? 'cancelled' : 'completed') : (index % 3 === 0 ? 'pending' : 'confirmed'),
      whatsapp_reminder_enabled: true,
      group_notification_enabled: index % 2 !== 0,
      reminder_sent_at: isPast ? date : null,
      group_notification_sent_at: isPast ? date : null
    };
  });
};

// Main seeding function
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Delete existing data
    console.log('Deleting existing data...');
    await Meeting.destroy({ where: {}, force: true });
    await Participant.destroy({ where: {}, force: true });
    console.log('Existing data deleted.');
    
    // Seed participants
    const participants = await Participant.bulkCreate(participantData);
    console.log(`${participants.length} participants created.`);
    
    // Generate meeting dates and data
    const meetingDates = generateMeetingDates();
    const meetingData = generateMeetingData(meetingDates);
    
    // Seed meetings
    const meetings = await Meeting.bulkCreate(meetingData);
    console.log(`${meetings.length} meetings created.`);
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();