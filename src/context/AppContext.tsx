import React, { createContext, useContext, useEffect, useState } from "react";
import { apiService } from "../services/api";
import {
  DemoPersona,
  JalurType,
  SessionData,
  StudentProfile,
  StrategyChoice,
} from "../types";
import { DEMO_PERSONAS } from "../data/personas";

export interface AppContextType {
  // Stepper
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Session
  session: SessionData | null;
  startGuestSession: (consent: boolean) => Promise<boolean>;
  deleteGuestSession: () => Promise<void>;

  // Profile
  profile: StudentProfile;
  updateProfile: (partial: Partial<StudentProfile>) => Promise<void>;
  saveFullProfile: (profile: StudentProfile) => Promise<void>;

  // Shortlist (max 4)
  shortlist: string[];
  addToShortlist: (prodiId: string) => boolean;
  removeFromShortlist: (prodiId: string) => void;
  clearShortlist: () => void;

  // Strategy Choices (Urutan 1 - 4)
  strategyChoices: StrategyChoice[];
  setStrategyChoices: React.Dispatch<React.SetStateAction<StrategyChoice[]>>;
  updateStrategyChoice: (
    urutan: number,
    prodiId: string,
    jalur: JalurType,
  ) => void;

  // What-If Simulator Overrides
  whatIfSkorTryout: number | undefined;
  setWhatIfSkorTryout: (score: number | undefined) => void;
  resetWhatIf: () => void;

  // AI Drawer state
  isAiDrawerOpen: boolean;
  openAiDrawer: (context?: {
    prodiId?: string;
    jalur?: JalurType;
    initialQuestion?: string;
  }) => void;
  closeAiDrawer: () => void;
  aiDrawerContext: {
    prodiId?: string;
    jalur?: JalurType;
    initialQuestion?: string;
  } | null;

  // Personas
  loadPersona: (personaKey: keyof typeof DEMO_PERSONAS) => void;
  activePersonaId: string | null;

  // Toasts / notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const defaultProfile: StudentProfile = {
  tahunLulus: 2026,
  provinsi: "DKI Jakarta",
  akreditasiSekolah: "A",
  skorTryout: 620,
  nilaiRapor: {
    matematika: 88,
    fisika: 85,
    kimia: 84,
    biologi: 82,
    ekonomi: 80,
    sosiologi: 80,
    geografi: 78,
    bahasaIndonesia: 86,
    bahasaInggris: 88,
  },
  trenNilai: "Naik",
  peringkatParalel: undefined,
  totalSiswaAngkatan: undefined,
  interestScores: {
    logikaKoding: 4,
    kesehatanBiologi: 2,
    bisnisManajemen: 3,
    desainKreatif: 3,
    sosialHukum: 2,
    rekayasaFisika: 3,
  },
  interestTags: ["#LogikaKomputasi", "#ProblemSolving"],
  freeStoryText: "",
  alumniDiterima: {},
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [session, setSession] = useState<SessionData | null>(null);
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [strategyChoices, setStrategyChoices] = useState<StrategyChoice[]>([]);
  const [whatIfSkorTryout, setWhatIfSkorTryout] = useState<number | undefined>(
    undefined,
  );

  // Persona
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);

  // AI Drawer
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [aiDrawerContext, setAiDrawerContext] = useState<{
    prodiId?: string;
    jalur?: JalurType;
    initialQuestion?: string;
  } | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const clearToast = () => setToastMessage(null);

  // Initial load from storage
  useEffect(() => {
    const init = async () => {
      // Auto-fallback notification: backend tak terjangkau → tampilkan toast.
      // Mode global tidak diubah (dikunci dari .env); fallback bersifat per-panggilan.
      apiService.setModeAutoSwitchCallback((_newMode, reason) => {
        showToast(reason);
      });

      const existingSession = await apiService.getSession();
      if (existingSession) {
        setSession(existingSession);
      }

      const existingProfile = await apiService.getProfile();
      if (existingProfile) {
        setProfile(existingProfile);
      }

      const savedShortlist = localStorage.getItem("jalurku_shortlist");
      if (savedShortlist) {
        try {
          setShortlist(JSON.parse(savedShortlist));
        } catch {}
      }

      const savedChoices = localStorage.getItem("jalurku_strategy_choices");
      if (savedChoices) {
        try {
          setStrategyChoices(JSON.parse(savedChoices));
        } catch {}
      }
    };
    init();
  }, []);

  const startGuestSession = async (consent: boolean): Promise<boolean> => {
    try {
      const sess = await apiService.createSession(consent);
      setSession(sess);
      showToast("Sesi tamu dimulai secara aman. Data disimpan lokal.");
      return true;
    } catch {
      return false;
    }
  };

  const deleteGuestSession = async () => {
    // 1. Bersihkan seluruh penyimpanan lokal seketika
    try {
      localStorage.removeItem("jalurku_session");
      localStorage.removeItem("jalurku_profile");
      localStorage.removeItem("jalurku_shortlist");
      localStorage.removeItem("jalurku_strategy_choices");
      localStorage.removeItem("jalurku_active_persona");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Storage clear error:", e);
    }

    // 2. Reset seluruh state React seketika agar UI langsung bersih tanpa reload
    setSession(null);
    setProfile(defaultProfile);
    setShortlist([]);
    setStrategyChoices([]);
    setActivePersonaId(null);
    setWhatIfSkorTryout(undefined);
    setCurrentStep(1);
    showToast("Seluruh data sesi Anda berhasil dihapus.");

    // 3. Panggil backend di latar belakang tanpa memblokir UI
    try {
      await apiService.deleteSession();
    } catch (e) {
      console.warn("Backend session delete error:", e);
    }
  };

  const updateProfile = async (partial: Partial<StudentProfile>) => {
    const updated = { ...profile, ...partial };
    setProfile(updated);
    await apiService.updateProfile(updated);
  };

  const saveFullProfile = async (newProfile: StudentProfile) => {
    setProfile(newProfile);
    await apiService.updateProfile(newProfile);
  };

  const addToShortlist = (prodiId: string): boolean => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetNorm = norm(prodiId);

    if (shortlist.some((id) => id === prodiId || norm(id) === targetNorm)) {
      return false;
    }
    if (shortlist.length >= 4) {
      showToast("Batas shortlist maksimal 4 prodi tercapai!");
      return false;
    }
    const updated = [...shortlist, prodiId];
    setShortlist(updated);
    try {
      localStorage.setItem("jalurku_shortlist", JSON.stringify(updated));
    } catch {}

    // Also auto-initialize strategy choices if not yet populated
    if (strategyChoices.length < 4) {
      const nextUrutan = strategyChoices.length + 1;
      const newChoices = [
        ...strategyChoices,
        { urutan: nextUrutan, prodiId, jalur: "SNBT" as JalurType },
      ];
      setStrategyChoices(newChoices);
      try {
        localStorage.setItem(
          "jalurku_strategy_choices",
          JSON.stringify(newChoices),
        );
      } catch {}
    }
    showToast("Prodi ditambahkan ke Shortlist Target.");
    return true;
  };

  const removeFromShortlist = (prodiId: string) => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetNorm = norm(prodiId);

    const updated = shortlist.filter((id) => id !== prodiId && norm(id) !== targetNorm);
    setShortlist(updated);
    try {
      localStorage.setItem("jalurku_shortlist", JSON.stringify(updated));
    } catch {}

    // Also remove from strategy choices and re-index
    const filteredChoices = strategyChoices
      .filter((c) => c.prodiId !== prodiId && norm(c.prodiId) !== targetNorm)
      .map((c, idx) => ({ ...c, urutan: idx + 1 }));
    setStrategyChoices(filteredChoices);
    try {
      localStorage.setItem(
        "jalurku_strategy_choices",
        JSON.stringify(filteredChoices),
      );
    } catch {}
  };

  const clearShortlist = () => {
    setShortlist([]);
    setStrategyChoices([]);
    localStorage.removeItem("jalurku_shortlist");
    localStorage.removeItem("jalurku_strategy_choices");
  };

  const updateStrategyChoice = (
    urutan: number,
    prodiId: string,
    jalur: JalurType,
  ) => {
    setStrategyChoices((prev) => {
      const existingIdx = prev.findIndex((c) => c.urutan === urutan);
      let updated: StrategyChoice[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { urutan, prodiId, jalur };
      } else {
        updated = [...prev, { urutan, prodiId, jalur }];
      }
      localStorage.setItem("jalurku_strategy_choices", JSON.stringify(updated));
      return updated;
    });
  };

  const resetWhatIf = () => {
    setWhatIfSkorTryout(undefined);
    showToast("Simulator What-If direset ke skor profil asli.");
  };

  const openAiDrawer = (context?: {
    prodiId?: string;
    jalur?: JalurType;
    initialQuestion?: string;
  }) => {
    setAiDrawerContext(context || null);
    setIsAiDrawerOpen(true);
  };

  const closeAiDrawer = () => {
    setIsAiDrawerOpen(false);
  };

  const loadPersona = (personaKey: keyof typeof DEMO_PERSONAS) => {
    const p: DemoPersona = DEMO_PERSONAS[personaKey];
    if (!p) return;

    // Create session if not active
    if (!session) {
      const dummySession: SessionData = {
        sessionId: "sess_persona_" + p.id,
        token: "token_persona_" + p.id,
        consentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        profileCompleted: true,
      };
      setSession(dummySession);
      apiService.setToken(dummySession.token);
    }

    setProfile(p.profile);
    apiService.updateProfile(p.profile);
    setShortlist(p.shortlistProdiIds);
    localStorage.setItem(
      "jalurku_shortlist",
      JSON.stringify(p.shortlistProdiIds),
    );

    // Populate strategy choices for persona
    const initialChoices: StrategyChoice[] = p.shortlistProdiIds.map(
      (id, idx) => ({
        urutan: idx + 1,
        prodiId: id,
        jalur: "SNBT" as JalurType,
      }),
    );
    setStrategyChoices(initialChoices);
    localStorage.setItem(
      "jalurku_strategy_choices",
      JSON.stringify(initialChoices),
    );

    setActivePersonaId(p.id);
    setWhatIfSkorTryout(undefined);
    setCurrentStep(p.preferredStep);
    showToast(
      `Persona demo "${p.nama}" dimuat. Membuka Langkah ${p.preferredStep}.`,
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        session,
        startGuestSession,
        deleteGuestSession,
        profile,
        updateProfile,
        saveFullProfile,
        shortlist,
        addToShortlist,
        removeFromShortlist,
        clearShortlist,
        strategyChoices,
        setStrategyChoices,
        updateStrategyChoice,
        whatIfSkorTryout,
        setWhatIfSkorTryout,
        resetWhatIf,
        isAiDrawerOpen,
        openAiDrawer,
        closeAiDrawer,
        aiDrawerContext,
        loadPersona,
        activePersonaId,
        toastMessage,
        showToast,
        clearToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
