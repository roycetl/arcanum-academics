import fs from 'fs';
import os from 'os';
import path from 'path';
import DashboardClient from '../components/DashboardClient';

export default async function Page() {
  const swarmStatePath = path.join(os.tmpdir(), 'state.json');
  
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

  return (
    <main className="flex flex-col w-full min-h-screen bg-black overflow-hidden">
      <DashboardClient initialBossData={stateData.boss} />
    </main>
  );
}
