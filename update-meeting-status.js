const { sequelize } = require('./src/models');

async function updateMeetingStatus() {
  try {
    console.log('Memulai pembaruan status meeting...');
    
    // Memeriksa tipe data kolom status
    const [results] = await sequelize.query(
      "SHOW COLUMNS FROM meetings WHERE Field = 'status'"
    );
    console.log('Informasi kolom status sebelum perubahan:', results[0]);
    
    // Langkah 1: Hapus constraint ENUM yang ada
    console.log('Mengubah kolom status menjadi STRING...');
    await sequelize.query(
      "ALTER TABLE meetings MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'incoming'"
    );
    
    // Langkah 2: Update nilai status yang ada
    console.log('Memperbarui nilai status...');
    await sequelize.query(
      "UPDATE meetings SET status = 'incoming' WHERE status IN ('confirmed', 'pending', 'cancelled', '')"
    );
    
    await sequelize.query(
      "UPDATE meetings SET status = 'completed' WHERE status = 'completed'"
    );
    
    // Langkah 3: Buat kembali kolom dengan ENUM baru
    console.log('Mengubah kolom status menjadi ENUM baru...');
    await sequelize.query(
      "ALTER TABLE meetings MODIFY COLUMN status ENUM('incoming', 'completed') NOT NULL DEFAULT 'incoming'"
    );
    
    // Memeriksa tipe data kolom status setelah perubahan
    const [resultsAfter] = await sequelize.query(
      "SHOW COLUMNS FROM meetings WHERE Field = 'status'"
    );
    console.log('Informasi kolom status setelah perubahan:', resultsAfter[0]);
    
    // Memeriksa status setelah pembaruan
    const [meetings] = await sequelize.query(
      "SELECT id, title, status FROM meetings"
    );
    console.log('\nStatus meetings setelah pembaruan:');
    meetings.forEach(m => {
      console.log(`ID: ${m.id}, Title: ${m.title}, Status: ${m.status}`);
    });
    
    console.log('\nPembaruan status meeting selesai.');
    process.exit(0);
  } catch (err) {
    console.error('Error saat memperbarui status meeting:', err);
    process.exit(1);
  }
}

updateMeetingStatus();