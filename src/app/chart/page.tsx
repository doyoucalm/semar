'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  translateStem,
  translateBranch,
  translateTenGod,
} from '@/lib/bazi-utils';

function ChartContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/langit/semar/api/session?id=${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Session not found');
        return res.json();
      })
      .then(data => {
        setSession(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
      <div className="text-[#D32F2F] font-black italic uppercase flex items-center gap-2">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        SYNCHRONIZING PILLARS...
      </div>
    </div>
  );
  if (!session) return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center text-red-500">
      Session Error
    </div>
  );

  const { chart, chartSummary } = session;
  const pillars = ['时柱', '日柱', '月柱', '年柱'];
  const labels = ['HOUR', 'DAY', 'MONTH', 'YEAR'];

  // Current Luck Pillar (Luck Pillar 0 or finding current by age)
  const currentLuckPillar = chart.大运?.大运?.[2] || chart.大运?.大运?.[0]; // Default to 3rd or 1st for display

  const getElementClass = (element: string) => {
    switch (element?.toLowerCase()) {
      case 'wood': return 'text-[#15803d]';
      case 'fire': return 'text-[#D32F2F]';
      case 'earth': return 'text-[#92400e]';
      case 'metal': return 'text-[#4b5563]';
      case 'water': return 'text-[#005f7b]';
      default: return 'text-[#1A1C1C]';
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-80">
      {/* Desktop Sidebar Nav */}
      <nav className="hidden md:flex flex-col p-8 pt-12 h-full w-80 border-r-8 border-[#1A1C1C] bg-[#F9F9F9] kinetic-shadow fixed left-0 top-0 z-40">
        <div className="text-4xl text-[#1A1C1C] mb-8 -skew-x-12 underline decoration-[#D32F2F] font-black italic uppercase">
          SEMAR
        </div>
        <div className="flex flex-col gap-2 pt-4">
          <button className="bg-[#D32F2F] text-white -skew-x-12 p-4 my-2 flex items-center gap-3 active:bg-red-800 w-full text-left" onClick={() => router.push('/')}>
            <span className="material-symbols-outlined kinetic-skew-reverse">history_edu</span>
            <span className="kinetic-skew-reverse font-black italic uppercase">New Chart</span>
          </button>
          <a className="text-[#1A1C1C] p-4 hover:bg-[#1A1C1C] hover:text-[#F9F9F9] transition-none flex items-center gap-3 font-black italic uppercase" href="#">
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Fortune Calendar</span>
          </a>
        </div>
      </nav>

      {/* Mobile Top App Bar */}
      <header className="md:hidden flex justify-between items-center w-full px-6 h-20 bg-[#F9F9F9] border-b-4 border-[#1A1C1C] kinetic-shadow sticky top-0 z-50">
        <button onClick={() => router.push('/')} className="text-[#D32F2F] active:translate-y-1 active:translate-x-1">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </button>
        <div className="text-2xl font-black italic -skew-x-[10deg] text-white bg-[#D32F2F] px-4 py-1 uppercase tracking-tighter">
          SEMAR
        </div>
        <button className="text-[#D32F2F] active:translate-y-1 active:translate-x-1">
          <span className="material-symbols-outlined text-3xl">account_circle</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="p-6 md:p-12 max-w-6xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 border-2 border-[#1A1C1C] kinetic-shadow mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black italic uppercase">{session.personName}</h1>
            <p className="text-xs text-[#D32F2F] font-bold uppercase tracking-widest mt-1">Birth Chart: {chart.阳历}</p>
          </div>
          <button
            onClick={() => router.push(`/speak?id=${sessionId}`)}
            className="btn-primary text-sm"
          >
            <span className="kinetic-skew-reverse inline-flex items-center gap-2">
              <span className="material-symbols-outlined">psychology</span>
              ORACLE INQUIRY
            </span>
          </button>
        </div>

        {/* Current Context Mini Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <div className="panel-rebel border-l-8 border-l-[#D32F2F] bg-red-50/30">
              <h3 className="text-[10px] font-black uppercase text-[#D32F2F] mb-2">Ten Years Now (Luck Pillar)</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black uppercase">
                  <span className={getElementClass(translateStem(currentLuckPillar.干支[0]).element)}>{currentLuckPillar.干支[0]}</span>
                  <span className={getElementClass(translateBranch(currentLuckPillar.干支[1]).element)}>{currentLuckPillar.干支[1]}</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase">{translateStem(currentLuckPillar.干支[0]).english} {translateBranch(currentLuckPillar.干支[1]).english}</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Age {currentLuckPillar.开始年龄} - {currentLuckPillar.结束年龄}</p>
                </div>
              </div>
           </div>
           <div className="panel-rebel border-l-8 border-l-[#1A1C1C]">
              <h3 className="text-[10px] font-black uppercase text-gray-500 mb-2">This Time (2026 Year Pillar)</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black uppercase">
                  <span className="text-[#D32F2F]">丙</span>
                  <span className="text-[#D32F2F]">午</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase">Bing Wu (Fire Horse)</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Current Year: 2026</p>
                </div>
              </div>
           </div>
        </div>

        {/* Four Pillars Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1/2 bg-[#e8e8e8] kinetic-skew -z-10 -rotate-3 opacity-20"></div>

          {pillars.map((pKey, i) => {
            const pData = chart[pKey];
            const stem = translateStem(pData.天干.天干);
            const branch = translateBranch(pData.地支.地支);
            const isDayMaster = i === 1;

            return (
              <div
                key={pKey}
                className={`
                  ${isDayMaster ? 'md:col-span-6 md:row-span-1 bg-[#1A1C1C] text-white p-8 kinetic-shadow-red' : 'md:col-span-2 bg-white border-2 border-[#1A1C1C] kinetic-shadow'}
                  p-6 kinetic-skew transform hover:-translate-y-2 transition-transform duration-100
                `}
              >
                <div className="kinetic-skew-reverse">
                  <div className={`flex items-center gap-2 border-b-2 ${isDayMaster ? 'border-[#D32F2F] pb-2 mb-4' : 'border-[#1A1C1C] pb-2 mb-4'}`}>
                    <h2 className={`font-black italic ${isDayMaster ? 'text-xl' : 'text-xs'} uppercase ${isDayMaster ? 'text-[#D32F2F]' : ''}`}>
                      {isDayMaster ? 'DAY MASTER' : labels[i]}
                    </h2>
                  </div>

                  <div className="mb-4">
                    <p className="text-[8px] font-bold uppercase text-gray-400 mb-1">Stem</p>
                    <div className={`${isDayMaster ? 'text-5xl' : 'text-3xl'} font-black uppercase ${isDayMaster ? 'text-white' : getElementClass(stem.element)}`}>
                      {pData.天干.天干}
                    </div>
                    <p className={`text-[9px] font-bold uppercase mt-1 ${isDayMaster ? 'text-gray-300' : 'text-gray-500'}`}>
                      {stem.english}
                    </p>
                  </div>

                  <div className={`border-t-2 ${isDayMaster ? 'border-gray-700 pt-4' : 'border-gray-200 pt-4'}`}>
                    <p className="text-[8px] font-bold uppercase text-gray-400 mb-1">Branch</p>
                    <div className={`${isDayMaster ? 'text-5xl' : 'text-3xl'} font-black uppercase ${isDayMaster ? 'text-white' : getElementClass(branch.element)}`}>
                      {pData.地支.地支}
                    </div>
                    <p className={`text-[9px] font-bold uppercase mt-1 ${isDayMaster ? 'text-gray-300' : 'text-gray-500'}`}>
                      {branch.english}
                    </p>
                  </div>

                  {/* Hidden Stems */}
                  <div className={`mt-4 pt-4 border-t-2 ${isDayMaster ? 'border-gray-700' : 'border-gray-200'} grid grid-cols-3 gap-2`}>
                    {Object.entries(pData.地支.藏干).map(([type, data]: [string, any]) => (
                      <div key={type} className="flex flex-col items-center">
                        <span className={`text-lg font-black ${isDayMaster ? 'text-white' : getElementClass(translateStem(data.天干).element)}`}>{data.天干}</span>
                        <span className="text-[7px] text-gray-400 uppercase font-bold">{translateTenGod(data.十神).slice(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Oracle Preset Questions */}
        <div className="mb-12">
           <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
             <span className="material-symbols-outlined text-[#D32F2F]">psychology_alt</span>
             Oracle Guidance Presets
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => router.push(`/speak?id=${sessionId}&q=wealth_2026`)}
                className="panel-rebel hover:border-[#D32F2F] transition-colors text-left group"
              >
                <span className="text-[10px] font-black text-[#D32F2F] uppercase block mb-1">Wealth 2026</span>
                <p className="font-bold text-sm leading-tight">How will my financial flow be in this Fire Horse year?</p>
              </button>
              <button 
                onClick={() => router.push(`/speak?id=${sessionId}&q=career_cycle`)}
                className="panel-rebel hover:border-[#D32F2F] transition-colors text-left group"
              >
                <span className="text-[10px] font-black text-[#D32F2F] uppercase block mb-1">10-Year Cycle</span>
                <p className="font-bold text-sm leading-tight">What is the core lesson of my current luck pillar?</p>
              </button>
              <button 
                onClick={() => router.push(`/speak?id=${sessionId}&q=love_harmony`)}
                className="panel-rebel hover:border-[#D32F2F] transition-colors text-left group"
              >
                <span className="text-[10px] font-black text-[#D32F2F] uppercase block mb-1">Relationships</span>
                <p className="font-bold text-sm leading-tight">How does this year affect my interpersonal harmony?</p>
              </button>
           </div>
        </div>

        {/* Secondary Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <section className="panel-rebel">
            <h3 className="text-xs font-black italic uppercase text-[#D32F2F] mb-4 border-b-2 border-[#1A1C1C] pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">analytics</span>
              Analysis Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Zodiac</span>
                <span className="font-black">{chart.生肖}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Lunar</span>
                <span className="font-medium text-xs">{chart.农历}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Day Master Strength</span>
                <span className="font-black">{session.chartSummary.dayMasterStrength}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Palace</span>
                <span className="font-black">{chart.命宫}</span>
              </div>
            </div>
          </section>

          <section className="panel-rebel">
            <h3 className="text-xs font-black italic uppercase text-[#D32F2F] mb-4 border-b-2 border-[#1A1C1C] pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">stars</span>
              Symbolic Stars
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(chart.神煞).flat().slice(0, 12).map((s: any) => (
                <span key={s} className="bg-[#e8e8e8] text-[#1A1C1C] text-[10px] px-2 py-1 border border-[#1A1C1C] font-bold uppercase">
                  {s}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Luck Pillars */}
        <div className="panel-rebel">
          <h3 className="text-xs font-black italic uppercase text-[#D32F2F] mb-4 border-b-2 border-[#1A1C1C] pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">timeline</span>
            Timeline of Great Cycles
          </h3>
          <div className="flex overflow-x-auto gap-4 pb-2">
            {chart.大运.大运.map((luck: any, i: number) => {
              const stem = translateStem(luck.干支[0]);
              const branch = translateBranch(luck.干支[1]);
              const isCurrent = i === 2;
              return (
                <div
                  key={i}
                  className={`
                    flex-shrink-0 w-28 border-2 p-4 flex flex-col items-center gap-2
                    ${isCurrent ? 'border-[#D32F2F] bg-[#D32F2F]/5 kinetic-shadow-red' : 'border-[#1A1C1C] bg-white kinetic-shadow'}
                    transition-transform hover:-translate-y-1
                  `}
                >
                  <div className={`text-[10px] font-black uppercase ${isCurrent ? 'text-[#D32F2F]' : 'text-gray-500'}`}>
                    {luck.开始年龄} - {luck.结束年龄}
                  </div>
                  <div className="flex text-3xl font-black leading-none">
                    <span className={getElementClass(stem.element)}>{luck.干支[0]}</span>
                    <span className={getElementClass(branch.element)}>{luck.干支[1]}</span>
                  </div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase">{translateTenGod(luck.天干十神).slice(0,3)}</div>
                  <div className="text-[8px] text-gray-400 font-bold">{luck.开始年份}</div>
                  {isCurrent && <div className="text-[8px] text-[#D32F2F] font-black italic uppercase animate-pulse">Current</div>}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-stretch bg-[#F9F9F9] border-t-4 border-[#1A1C1C] kinetic-shadow z-50 h-20">
        <a className="bg-[#D32F2F] text-white -skew-x-12 flex flex-col items-center justify-center px-6 h-full active:scale-95 w-1/4" href="#">
          <span className="material-symbols-outlined kinetic-skew-reverse mb-1">auto_graph</span>
          <span className="kinetic-skew-reverse text-[10px] font-black italic uppercase">Chart</span>
        </a>
        <a className="text-[#1A1C1C] flex flex-col items-center justify-center px-4 active:scale-95 w-1/4" href="#">
          <span className="material-symbols-outlined mb-1">auto_awesome</span>
          <span className="text-[10px] font-black italic uppercase">Luck</span>
        </a>
        <a className="text-[#1A1C1C] flex flex-col items-center justify-center px-4 active:scale-95 w-1/4" href="#">
          <span className="material-symbols-outlined mb-1">favorite</span>
          <span className="text-[10px] font-black italic uppercase">Match</span>
        </a>
        <a className="text-[#1A1C1C] flex flex-col items-center justify-center px-4 active:scale-95 w-1/4" href="#">
          <span className="material-symbols-outlined mb-1">settings</span>
          <span className="text-[10px] font-black italic uppercase">Config</span>
        </a>
      </nav>
    </div>
  );
}

export default function ChartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-[#D32F2F] font-black italic uppercase">LOADING...</div>
      </div>
    }>
      <ChartContent />
    </Suspense>
  );
}
