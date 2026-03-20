/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pill, Syringe, Utensils, Stethoscope, Check, X, Bell, Plus } from 'lucide-react';

// --- Types ---

type MedType = 'Tablet' | 'Capsule' | 'Syrup' | 'Injection';
type Schedule = 'Once Daily' | 'Morning' | 'Afternoon' | 'Evening' | 'Weekly';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string; // HH:mm format
  type: MedType;
  schedule: Schedule;
  taken: boolean;
}

// --- Constants ---

const STORAGE_KEY = 'medicare_meds';
const DATE_KEY = 'medicare_date';

const SAMPLE_MEDS: Medication[] = [
  { id: '1', name: 'Metformin', dosage: '500mg', time: '08:00', type: 'Tablet', schedule: 'Morning', taken: false },
  { id: '2', name: 'Lisinopril', dosage: '10mg', time: '10:00', type: 'Capsule', schedule: 'Morning', taken: false },
  { id: '3', name: 'Atorvastatin', dosage: '20mg', time: '21:00', type: 'Tablet', schedule: 'Evening', taken: false },
];

// --- Helpers ---

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const formatDate = () => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const dateStr = new Intl.DateTimeFormat('en-GB', options).format(new Date());
  // Format: "Thursday / 19 March"
  const parts = dateStr.split(' ');
  const weekday = parts[0];
  const day = parts[1];
  const month = parts[2];
  return `${weekday} / ${day} ${month}`;
};

const isOverdue = (timeStr: string, taken: boolean) => {
  if (taken) return false;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const medTime = new Date();
  medTime.setHours(hours, minutes, 0, 0);
  return now > medTime;
};

const formatTime12h = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
};

// --- Components ---

export default function App() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initialization
  useEffect(() => {
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem(DATE_KEY);
    const storedMeds = localStorage.getItem(STORAGE_KEY);

    let initialMeds: Medication[] = [];

    if (storedMeds) {
      initialMeds = JSON.parse(storedMeds);
      // Reset taken status if it's a new day
      if (storedDate !== today) {
        initialMeds = initialMeds.map(m => ({ ...m, taken: false }));
        localStorage.setItem(DATE_KEY, today);
      }
    } else {
      initialMeds = SAMPLE_MEDS;
      localStorage.setItem(DATE_KEY, today);
    }

    setMeds(initialMeds);
  }, []);

  // Persistence
  useEffect(() => {
    if (meds.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meds));
    }
  }, [meds]);

  // Timer for overdue detection
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const total = meds.length;
    const taken = meds.filter(m => m.taken).length;
    const pending = total - taken;
    const overdueCount = meds.filter(m => isOverdue(m.time, m.taken)).length;
    return { total, taken, pending, overdueCount };
  }, [meds, currentTime]);

  const progress = stats.total > 0 ? (stats.taken / stats.total) * 100 : 0;

  const handleToggleTaken = (id: string) => {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const handleDelete = (id: string) => {
    setMeds(prev => prev.filter(m => m.id !== id));
  };

  const handleAddMed = (newMed: Omit<Medication, 'id' | 'taken'>) => {
    const med: Medication = {
      ...newMed,
      id: Math.random().toString(36).substr(2, 9),
      taken: false,
    };
    setMeds(prev => [...prev, med]);
  };

  return (
    <div className="min-h-screen pb-12 max-w-[520px] mx-auto bg-[#f0f7fe]">
      {/* Header */}
      <header className="relative overflow-hidden p-8 pt-10 text-white rounded-b-[40px] shadow-lg bg-gradient-to-br from-[#1a5a8a] via-[#2b7cb5] to-[#3a9fd8]">
        {/* Decorative Circles */}
        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 rounded-full bg-white opacity-[0.07]" />
        <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-white opacity-[0.05]" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Pill size={28} />
              </div>
              <h1 className="text-[28px] font-semibold font-['Lora']">MediCare</h1>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-wider opacity-80">{formatDate()}</p>
            </div>
          </div>

          <p className="text-[26px] font-medium italic font-['Lora'] mb-4">{getGreeting()}</p>

          <div className="mb-2">
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#7ee8c4] to-[#b8f0d8]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
          <p className="text-sm font-bold">{stats.taken} of {stats.total} medications taken today</p>
        </div>
      </header>

      <main className="px-5 -mt-6 relative z-20 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total" value={stats.total} color="var(--blue)" />
          <StatCard label="Taken" value={stats.taken} color="var(--teal)" />
          <StatCard label="Pending" value={stats.pending} color="var(--coral)" />
        </div>

        {/* Overdue Alarm */}
        <AnimatePresence>
          {stats.overdueCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-5 rounded-[20px] bg-gradient-to-br from-[#e8614a] to-[#f07855] text-white flex items-center gap-4 animate-pulse-alarm"
            >
              <div className="animate-shake">
                <Bell size={32} fill="white" />
              </div>
              <div>
                <p className="text-[18px] font-bold">Medication Overdue!</p>
                <p className="text-[14px] opacity-90">You have {stats.overdueCount} {stats.overdueCount === 1 ? 'medication' : 'medications'} waiting.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Medication List */}
        <section className="space-y-4">
          <h2 className="text-[13px] font-extrabold uppercase tracking-[1.5px] text-[#7a96ae] px-2">Today's Schedule</h2>
          <div className="space-y-4">
            {meds.sort((a, b) => a.time.localeCompare(b.time)).map((med, index) => (
              <MedCard 
                key={med.id} 
                med={med} 
                index={index}
                onToggle={() => handleToggleTaken(med.id)}
                onDelete={() => handleDelete(med.id)}
                isOverdue={isOverdue(med.time, med.taken)}
              />
            ))}
            {meds.length === 0 && (
              <div className="text-center py-12 bg-white rounded-[28px] shadow-sm">
                <p className="text-[#7a96ae] font-bold">No medications added yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Add Medication Form */}
        <AddMedForm onAdd={handleAddMed} />
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="bg-white p-4 rounded-[18px] shadow-[0_4px_24px_rgba(43,124,181,0.10)] text-center">
      <p className="text-[32px] font-[900]" style={{ color }}>{value}</p>
      <p className="text-[12px] font-bold uppercase tracking-[0.5px] text-[#7a96ae]">{label}</p>
    </div>
  );
}

interface MedCardProps {
  key?: string;
  med: Medication;
  index: number;
  onToggle: () => void;
  onDelete: () => void;
  isOverdue: boolean;
}

function MedCard({ med, index, onToggle, onDelete, isOverdue }: MedCardProps) {
  const getIcon = () => {
    switch (med.type) {
      case 'Tablet': return { icon: <Pill size={32} />, bg: '#ddf0ff', color: '#2b7cb5' };
      case 'Capsule': return { icon: <Syringe size={32} />, bg: '#d0f0e8', color: '#2aaa8a' };
      case 'Syrup': return { icon: <Utensils size={32} />, bg: '#fef3da', color: '#f0a832' };
      case 'Injection': return { icon: <Stethoscope size={32} />, bg: '#ede8f8', color: '#8b6fc4' };
    }
  };

  const { icon, bg, color } = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`group relative flex items-center gap-[18px] p-[22px] bg-white rounded-[28px] shadow-[0_4px_24px_rgba(43,124,181,0.10)] transition-all hover:-translate-y-0.5 hover:shadow-lg min-h-[90px] ${
        med.taken ? 'opacity-65 border-2 border-[#2aaa8a]' : isOverdue ? 'border-l-4 border-[#e8614a]' : 'border-2 border-transparent'
      }`}
    >
      {/* Delete Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#7a96ae] hover:text-[#e8614a]"
      >
        <X size={20} />
      </button>

      {/* Taken Badge */}
      {med.taken && (
        <div className="absolute -top-3 -right-2 bg-[#2aaa8a] text-white text-[12px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
          TAKEN ✓
        </div>
      )}

      {/* Icon Box */}
      <div 
        className="w-[62px] h-[62px] rounded-[18px] flex items-center justify-center shrink-0"
        style={{ backgroundColor: bg, color: color }}
      >
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 overflow-hidden">
        <h3 className="text-[22px] font-[900] text-[#1a2f42] truncate leading-tight">{med.name}</h3>
        <p className="text-[18px] font-bold text-[#4a6580]">{med.dosage}</p>
        <div className="mt-1">
          <span className={`inline-block px-3 py-1 rounded-full text-[14px] font-bold ${
            med.taken ? 'bg-[#d0f0e8] text-[#2aaa8a]' : isOverdue ? 'bg-[#fde8e4] text-[#e8614a]' : 'bg-[#e8f4fd] text-[#2b7cb5]'
          }`}>
            {med.taken ? 'Completed' : isOverdue ? 'Overdue' : 'Upcoming'} • {formatTime12h(med.time)}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={onToggle}
        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all shrink-0 ${
          med.taken 
            ? 'bg-[#d0f0e8] text-[#2aaa8a]' 
            : 'bg-gradient-to-br from-[#2aaa8a] to-[#22c49a] text-white shadow-[0_4px_12px_rgba(42,170,138,0.35)] hover:scale-110'
        }`}
      >
        <Check size={28} strokeWidth={3} />
      </button>
    </motion.div>
  );
}

function AddMedForm({ onAdd }: { onAdd: (med: Omit<Medication, 'id' | 'taken'>) => void }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<MedType>('Tablet');
  const [schedule, setSchedule] = useState<Schedule>('Once Daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage || !time) return;
    onAdd({ name, dosage, time, type, schedule });
    setName('');
    setDosage('');
    setTime('');
  };

  return (
    <section className="bg-white p-7 rounded-[28px] shadow-[0_4px_24px_rgba(43,124,181,0.10)]">
      <h2 className="text-[20px] font-extrabold text-[#1a2f42] mb-6 flex items-center gap-2">
        <Plus size={24} className="text-[#2b7cb5]" />
        Add New Medication
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-[14px]">
        <div className="col-span-2 space-y-1.5">
          <label className="text-[14px] font-extrabold uppercase tracking-wider text-[#7a96ae]">Medication Name</label>
          <input 
            type="text" 
            placeholder="e.g. Aspirin"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-[54px] px-4 rounded-[14px] bg-[#e8f4fd] border-2 border-[#c5e3f7] text-[#1a2f42] font-bold text-[17px] focus:bg-white focus:border-[#2b7cb5] focus:ring-4 focus:ring-[#2b7cb5]/10 outline-none transition-all"
            required
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[14px] font-extrabold uppercase tracking-wider text-[#7a96ae]">Dosage</label>
          <input 
            type="text" 
            placeholder="e.g. 100mg"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            className="w-full h-[54px] px-4 rounded-[14px] bg-[#e8f4fd] border-2 border-[#c5e3f7] text-[#1a2f42] font-bold text-[17px] focus:bg-white focus:border-[#2b7cb5] focus:ring-4 focus:ring-[#2b7cb5]/10 outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[14px] font-extrabold uppercase tracking-wider text-[#7a96ae]">Time</label>
          <input 
            type="time" 
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full h-[54px] px-4 rounded-[14px] bg-[#e8f4fd] border-2 border-[#c5e3f7] text-[#1a2f42] font-bold text-[17px] focus:bg-white focus:border-[#2b7cb5] focus:ring-4 focus:ring-[#2b7cb5]/10 outline-none transition-all"
            required
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <label className="text-[14px] font-extrabold uppercase tracking-wider text-[#7a96ae]">Medication Type</label>
          <select 
            value={type}
            onChange={e => setType(e.target.value as MedType)}
            className="w-full h-[54px] px-4 rounded-[14px] bg-[#e8f4fd] border-2 border-[#c5e3f7] text-[#1a2f42] font-bold text-[17px] focus:bg-white focus:border-[#2b7cb5] outline-none transition-all appearance-none"
          >
            <option value="Tablet">Tablet 💊</option>
            <option value="Capsule">Capsule 💉</option>
            <option value="Syrup">Syrup 🥄</option>
            <option value="Injection">Injection 🩺</option>
          </select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <label className="text-[14px] font-extrabold uppercase tracking-wider text-[#7a96ae]">Schedule</label>
          <select 
            value={schedule}
            onChange={e => setSchedule(e.target.value as Schedule)}
            className="w-full h-[54px] px-4 rounded-[14px] bg-[#e8f4fd] border-2 border-[#c5e3f7] text-[#1a2f42] font-bold text-[17px] focus:bg-white focus:border-[#2b7cb5] outline-none transition-all appearance-none"
          >
            <option value="Once Daily">Once Daily</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
            <option value="Weekly">Weekly</option>
          </select>
        </div>

        <button 
          type="submit"
          className="col-span-2 mt-4 h-[64px] rounded-[16px] bg-gradient-to-r from-[#1a5a8a] to-[#2b7cb5] text-white font-[800] text-[19px] shadow-[0_6px_20px_rgba(43,124,181,0.3)] hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all"
        >
          Save Medication
        </button>
      </form>
    </section>
  );
}
