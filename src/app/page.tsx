'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    solarDatetime: '',
    gender: 'male' as 'male' | 'female',
    timezone: 'Asia/Jakarta',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/langit/semar/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      console.log('API Response:', data);
      if (data.sessionId) {
        router.push(`/chart?id=${data.sessionId}`);
      } else {
        console.error('No sessionId in response');
        alert('Engine error: No session created.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to engine.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-80 relative overflow-x-hidden">
      {/* Desktop Sidebar Nav */}
      <nav className="hidden md:flex flex-col p-8 pt-12 h-full w-80 border-r-8 border-[#1A1C1C] bg-[#F9F9F9] kinetic-shadow fixed left-0 top-0 z-40">
        <div className="text-4xl text-[#1A1C1C] mb-8 -skew-x-12 underline decoration-[#D32F2F] font-black italic uppercase">
          SEMAR
        </div>
        <div className="flex flex-col gap-2 pt-4">
          <a className="bg-[#D32F2F] text-white -skew-x-12 p-4 my-2 flex items-center gap-3 active:bg-red-800" href="#">
            <span className="material-symbols-outlined kinetic-skew-reverse">history_edu</span>
            <span className="kinetic-skew-reverse font-black italic uppercase">My Destiny</span>
          </a>
          <a className="text-[#1A1C1C] p-4 hover:bg-[#1A1C1C] hover:text-[#F9F9F9] transition-none flex items-center gap-3 font-black italic uppercase" href="#">
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Fortune Calendar</span>
          </a>
          <a className="text-[#1A1C1C] p-4 hover:bg-[#1A1C1C] hover:text-[#F9F9F9] transition-none flex items-center gap-3 font-black italic uppercase mt-auto" href="#">
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </a>
        </div>
      </nav>

      {/* Mobile Top App Bar */}
      <header className="md:hidden flex justify-between items-center w-full px-6 h-20 bg-[#F9F9F9] border-b-4 border-[#1A1C1C] kinetic-shadow sticky top-0 z-50">
        <button className="text-[#D32F2F] active:translate-y-1 active:translate-x-1">
          <span className="material-symbols-outlined text-3xl">menu</span>
        </button>
        <div className="text-2xl font-black italic -skew-x-[10deg] text-white bg-[#D32F2F] px-4 py-1 uppercase tracking-tighter">
          SEMAR
        </div>
        <button className="text-[#D32F2F] active:translate-y-1 active:translate-x-1">
          <span className="material-symbols-outlined text-3xl">account_circle</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="p-6 md:p-12 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12 relative">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-[#D32F2F] kinetic-skew -z-10"></div>
          <h1 className="text-6xl md:text-8xl font-black italic kinetic-skew tracking-tighter uppercase leading-none mb-4">
            BIRTH CHART
          </h1>
          <div className="inline-block bg-[#1A1C1C] text-[#F9F9F9] px-6 py-2 kinetic-skew">
            <p className="font-bold text-xl kinetic-skew-reverse uppercase tracking-widest">
              THE BLUEPRINT OF YOUR SOUL
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="panel-rebel mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="text-xs font-black italic uppercase text-[#D32F2F] block mb-2 kinetic-skew-reverse">
                Full Name
              </label>
              <input
                type="text"
                required
                className="input-rebel kinetic-skew"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Birth Date & Gender Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black italic uppercase text-[#D32F2F] block mb-2 kinetic-skew-reverse">
                  Birth Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  className="input-rebel kinetic-skew text-sm"
                  value={formData.solarDatetime}
                  onChange={(e) => setFormData({ ...formData, solarDatetime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-black italic uppercase text-[#D32F2F] block mb-2 kinetic-skew-reverse">
                  Gender
                </label>
                <select
                  className="input-rebel kinetic-skew text-sm h-[52px]"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                >
                  <option value="male">Male (Yang)</option>
                  <option value="female">Female (Yin)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg"
            >
              {loading ? (
                <span className="kinetic-skew-reverse inline-flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  CALCULATING...
                </span>
              ) : (
                <span className="kinetic-skew-reverse inline-flex items-center gap-2">
                  <span className="material-symbols-outlined">bolt</span>
                  GENERATE ANALYSIS
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="flex justify-between text-xs font-bold uppercase text-[#1A1C1C] opacity-50">
          <span>Engine v0.1</span>
          <span>© 2026 SEMAR</span>
          <span>Bnimahardika</span>
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
