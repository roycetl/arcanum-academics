import fs from 'fs';
import path from 'path';
import DashboardClient from '../components/DashboardClient';

export default async function Page() {
  // We locate the .swarm/state.json
  const swarmStatePath = path.resolve(process.cwd(), '../.swarm/state.json');
  
  let stateData = { boss: { hp: 5000, maxHp: 5000, name: "The Unknown Entity" } };
  
  try {
    const file = fs.readFileSync(swarmStatePath, 'utf-8');
    const parsed = JSON.parse(file);
    if (parsed && parsed.boss) {
      stateData = parsed;
    }
  } catch(e) {
    console.warn("[System] Cound not read .swarm/state.json correctly. Initializing with fallback boss data.");
  }

  return <DashboardClient initialBossData={stateData.boss} />;
}
