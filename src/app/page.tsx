import fs from 'fs';
import path from 'path';
import DashboardClient from '../components/DashboardClient';
import DiamondStaff from '../components/DiamondStaff';

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

  return (
    <main className="flex flex-col w-full bg-black scroll-smooth">
      <section className="w-full relative z-50">
        <DiamondStaff />
      </section>
      
      <section id="studify-setup-anchor" className="w-full min-h-screen relative z-40 bg-black">
        <DashboardClient initialBossData={stateData.boss} />
      </section>
    </main>
  );
}
