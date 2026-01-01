const bcrypt = require('bcryptjs');

async function generateHashes() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const agentHash = await bcrypt.hash('agent123', 10);
  const userHash = await bcrypt.hash('user123', 10);
  
  console.log('=== COPY THESE HASHES ===');
  console.log('Admin Hash:', adminHash);
  console.log('Agent Hash:', agentHash);
  console.log('User Hash:', userHash);
}

generateHashes();