
import React, { useState } from 'react';
import { PROGRAMS, Program, UserProfile, PROGRAM_SUBJECTS, Subject } from '../types';
import { ChevronRight, GraduationCap, Calendar, User, BookOpen } from 'lucide-react';
import Logo from './Logo';

interface ProfileSetupProps {
  onComplete: (profile: UserProfile) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [program, setProgram] = useState<Program | ''>('');
  const [semester, setSemester] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const availableSubjects = (program && semester)
    ? (PROGRAM_SUBJECTS[program as Program][semester] || [])
    : [];

  const handleSubmit = () => {
    if (name && program && semester && selectedSubject) {
      onComplete({
        name,
        email: 'estudiante@udenar.edu.co',
        program: program as Program,
        semester,
        selectedSubject,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=d32f2f`
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-xl">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(211,47,47,0.1)] animate-in zoom-in-95 duration-500">
        <div className="p-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <Logo size="sm" showSubtext={false} className="mb-4" />
              <h2 className="text-3xl font-heading font-extrabold text-slate-900">Configuración</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium italic">Personalizando tu entorno de aprendizaje</p>
            </div>
            <div className="text-xs font-black text-white bg-[#D32F2F] px-4 py-2 rounded-full border border-red-400 shadow-lg shadow-red-500/20">PASO {step}/4</div>
          </div>

          <div className="min-h-[350px]">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <label className="block text-slate-800 text-sm font-black mb-4 uppercase tracking-widest flex items-center gap-2">
                  <User size={18} className="text-[#D32F2F]" /> Identificación
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#D32F2F] transition-all text-xl font-bold placeholder:text-slate-300"
                  placeholder="Escribe tu nombre"
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <label className="block text-slate-800 text-sm font-black mb-5 uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap size={18} className="text-[#D32F2F]" /> Programa Académico
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {PROGRAMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setProgram(p)}
                      className={`w-full text-left px-6 py-4 rounded-2xl border-2 transition-all font-bold ${program === p
                          ? 'bg-red-50 border-[#D32F2F] text-[#D32F2F] scale-[1.02] shadow-md'
                          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <label className="block text-slate-800 text-sm font-black mb-8 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={18} className="text-[#D32F2F]" /> Semestre
                </label>
                <div className="grid grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSemester(s)}
                      className={`h-16 rounded-2xl border-2 flex items-center justify-center font-black text-xl transition-all ${semester === s
                          ? 'bg-red-50 border-[#D32F2F] text-[#D32F2F] shadow-lg shadow-red-500/10'
                          : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <label className="block text-slate-800 text-sm font-black mb-5 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={18} className="text-[#D32F2F]" /> Materia de Enfoque
                </label>
                <p className="text-slate-400 text-xs mb-4">Selecciona la materia que deseas potenciar con IA</p>
                <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {availableSubjects.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub)}
                      className={`w-full text-left px-6 py-4 rounded-2xl border-2 transition-all font-bold ${selectedSubject?.id === sub.id
                          ? 'bg-red-50 border-[#D32F2F] text-[#D32F2F] scale-[1.01] shadow-md'
                          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{sub.name}</span>
                        <span className="text-[9px] uppercase px-2 py-1 bg-slate-100 rounded-lg text-slate-400">{sub.category}</span>
                      </div>
                    </button>
                  ))}
                  {availableSubjects.length === 0 && (
                    <p className="text-slate-400 italic text-center py-10">No hay materias registradas para este periodo.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex gap-4">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-4 text-slate-400 font-black hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
              >
                Regresar
              </button>
            )}
            <button
              onClick={() => step < 4 ? setStep(step + 1) : handleSubmit()}
              disabled={(step === 1 && !name) || (step === 2 && !program) || (step === 4 && !selectedSubject)}
              className="flex-[2] py-5 bg-black text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-[#D32F2F] transition-all duration-300 shadow-xl disabled:opacity-30 disabled:grayscale"
            >
              {step === 4 ? 'Activar Perfil' : 'Siguiente'}
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
