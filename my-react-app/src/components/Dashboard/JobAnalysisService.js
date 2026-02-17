// Service for managing job description analyses
const STORAGE_KEY = "jobDescriptionAnalyses";
const RESUME_KEY = "userResumes"; // Per-user active resume store (keyed by email)

export const JobAnalysisService = {

  // ─────────────────────────────────────────────────────────────────────────
  // ANALYSIS CRUD
  // ─────────────────────────────────────────────────────────────────────────

  // Get all analyses for a specific user
  getAll: (userEmail) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const allAnalyses = data ? JSON.parse(data) : [];
      if (!userEmail) return [];
      return allAnalyses.filter((analysis) => analysis.userEmail === userEmail);
    } catch (error) {
      console.error("Error reading analyses:", error);
      return [];
    }
  },

  // Get the most recent analysis for a specific user
  getLatest: (userEmail) => {
    const analyses = JobAnalysisService.getAll(userEmail);
    return analyses.length > 0 ? analyses[0] : null;
  },

  // Get analysis by ID (scoped to user)
  getById: (id, userEmail) => {
    const analyses = JobAnalysisService.getAll(userEmail);
    return analyses.find((analysis) => analysis.id === id) || null;
  },

  // Add a new analysis
  // Now stores resumeText, resumeFileName, and cvMatchScore per analysis.
  // This means different JDs can have different resumes attached.
  add: (analysisData, userEmail) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const allAnalyses = data ? JSON.parse(data) : [];

      if (!userEmail) throw new Error("User email is required to save data");

      const newAnalysis = {
        id: Date.now(),
        userEmail: userEmail,
        timestamp: new Date().toLocaleString(),
        confidence: analysisData.confidence,
        shapExplanation: analysisData.shapExplanation,
        jobDescription: analysisData.jobDescription,
        // ── CV fields (per-analysis, not shared across users) ──────────────
        resumeText: analysisData.resumeText || null,
        resumeFileName: analysisData.resumeFileName || null,
        cvMatchScore: analysisData.cvMatchScore ?? null, // null = no CV uploaded
      };

      const updatedAnalyses = [newAnalysis, ...allAnalyses];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAnalyses));
      return newAnalysis;
    } catch (error) {
      console.error("Error adding analysis:", error);
      throw error;
    }
  },

  // Delete an analysis by ID
  delete: (id) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      let allAnalyses = data ? JSON.parse(data) : [];
      const updatedAnalyses = allAnalyses.filter(
        (analysis) => analysis.id !== id
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAnalyses));
      return true;
    } catch (error) {
      console.error("Error deleting analysis:", error);
      return false;
    }
  },

  // Clear all analyses for a specific user
  clearAll: (userEmail) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      let allAnalyses = data ? JSON.parse(data) : [];
      const remainingAnalyses = allAnalyses.filter(
        (analysis) => analysis.userEmail !== userEmail
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingAnalyses));
      return true;
    } catch (error) {
      console.error("Error clearing analyses:", error);
      return false;
    }
  },

  // Get statistics for a specific user
  getStats: (userEmail) => {
    const analyses = JobAnalysisService.getAll(userEmail);
    const total = analyses.length;

    if (total === 0) {
      return { total: 0, fake: 0, real: 0, fakePercentage: 0, realPercentage: 0 };
    }

    const fake = analyses.filter(
      (a) => a.confidence?.label?.toLowerCase() === "fake"
    ).length;

    const real = analyses.filter(
      (a) => a.confidence?.label?.toLowerCase() === "real"
    ).length;

    return {
      total,
      fake,
      real,
      fakePercentage: ((fake / total) * 100).toFixed(1),
      realPercentage: ((real / total) * 100).toFixed(1),
    };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIVE RESUME STORE (per-user, session-scoped)
  // Resume is stored separately from analyses so the user can upload once
  // and have it auto-fill for subsequent JDs in the same session.
  // When a user logs out or a different user logs in, their resume is NOT
  // shown — each email key is independent.
  // ─────────────────────────────────────────────────────────────────────────

  // Save the active resume for a specific user
  saveActiveResume: (userEmail, resumeText, fileName) => {
    try {
      const data = localStorage.getItem(RESUME_KEY);
      const resumes = data ? JSON.parse(data) : {};
      resumes[userEmail] = {
        resumeText,
        fileName,
        savedAt: Date.now(),
      };
      localStorage.setItem(RESUME_KEY, JSON.stringify(resumes));
    } catch (error) {
      console.error("Error saving active resume:", error);
    }
  },

  // Get the active resume for a user (returns null if none saved)
  getActiveResume: (userEmail) => {
    try {
      const data = localStorage.getItem(RESUME_KEY);
      if (!data) return null;
      const resumes = JSON.parse(data);
      return resumes[userEmail] || null;
    } catch (error) {
      return null;
    }
  },

  // Clear the active resume for a user
  // Call this on logout or when the user explicitly removes their CV.
  clearActiveResume: (userEmail) => {
    try {
      const data = localStorage.getItem(RESUME_KEY);
      if (!data) return;
      const resumes = JSON.parse(data);
      delete resumes[userEmail];
      localStorage.setItem(RESUME_KEY, JSON.stringify(resumes));
    } catch (error) {
      console.error("Error clearing active resume:", error);
    }
  },
};

export default JobAnalysisService;