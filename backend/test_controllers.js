import { getFinancialReport, getOccupancyReport, getComplaintReport } from './src/controllers/reportController.js';

const mockRes = {
  json: (data) => console.log('DATA:', data),
  status: (code) => {
    console.log('STATUS:', code);
    return { json: (msg) => console.log('ERROR:', msg) };
  }
};

async function run() {
  console.log('--- FINANCE ---');
  await getFinancialReport({}, mockRes);
  
  console.log('--- OCCUPANCY ---');
  await getOccupancyReport({}, mockRes);
  
  console.log('--- COMPLAINT ---');
  await getComplaintReport({}, mockRes);
  
  process.exit(0);
}

run();
