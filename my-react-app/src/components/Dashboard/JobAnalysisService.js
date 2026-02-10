// Service for managing job description analyses
const STORAGE_KEY = "jobDescriptionAnalyses";

export const JobAnalysisService = {
  // Get all analyses for a specific user
  getAll: (userEmail) => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const allAnalyses = data ? JSON.parse(data) : [];
      // Filter by the specific user's email
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
  add: (analysisData, userEmail) => {
    try {
      // Get raw data from storage directly to append
      const data = localStorage.getItem(STORAGE_KEY);
      const allAnalyses = data ? JSON.parse(data) : [];

      if (!userEmail) throw new Error("User email is required to save data");

      // Create the analysis object with timestamp, ID, and USER EMAIL
      const newAnalysis = {
        id: Date.now(),
        userEmail: userEmail, // Store who owns this data
        timestamp: new Date().toLocaleString(),
        confidence: analysisData.confidence,
        shapExplanation: analysisData.shapExplanation,
        jobDescription: analysisData.jobDescription,
      };

      // Add to the beginning of the array
      const updatedAnalyses = [newAnalysis, ...allAnalyses];

      // Save to localStorage
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

      // Filter out the specific ID
      const updatedAnalyses = allAnalyses.filter(
        (analysis) => analysis.id !== id,
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

      // Keep only analyses that DO NOT belong to this user
      const remainingAnalyses = allAnalyses.filter(
        (analysis) => analysis.userEmail !== userEmail,
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
      return {
        total: 0,
        fake: 0,
        real: 0,
        fakePercentage: 0,
        realPercentage: 0,
      };
    }

    const fake = analyses.filter(
      (a) => a.confidence?.label?.toLowerCase() === "fake",
    ).length;

    const real = analyses.filter(
      (a) => a.confidence?.label?.toLowerCase() === "real",
    ).length;

    return {
      total,
      fake,
      real,
      fakePercentage: ((fake / total) * 100).toFixed(1),
      realPercentage: ((real / total) * 100).toFixed(1),
    };
  },
};

export default JobAnalysisService;
