import React, { useState, useEffect, useRef } from "react";
import "./JobDescription.css";
import { Client } from "@gradio/client";
import JobAnalysisService from "./JobAnalysisService";

// Import file parsing libraries
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import mammoth from "mammoth";

// Set up the PDF.js worker (required for it to run in the browser)
// Using unpkg and the new .mjs extension for PDF.js v4/v5+
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
// ─────────────────────────────────────────────────────────────────────────────
// ROBUST PDF / TEXT / DOCX EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────
async function extractTextFromFile(file) {
  const fileExt = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  try {
    // --- PDF Extraction ---
    if (file.type === "application/pdf" || fileExt === ".pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      if (fullText.trim().length < 20) {
        throw new Error("Could not extract enough text. Is this a scanned image PDF?");
      }
      return fullText.trim();
    } 
    
    // --- DOCX Extraction ---
    else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      fileExt === ".docx"
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (!result.value || result.value.trim().length < 20) {
        throw new Error("Could not extract text from this Word document.");
      }
      return result.value.trim();
    } 
    
    // --- TXT / Plain Text Extraction ---
    else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          if (!text || text.trim().length < 20) {
            reject(new Error("File appears to be empty or unreadable."));
          } else {
            resolve(text.trim());
          }
        };
        reader.onerror = () => reject(new Error("Failed to read text file."));
        reader.readAsText(file, "utf-8");
      });
    }
  } catch (error) {
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function JobDescription({ user, onJobDescriptionSubmit }) {
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // CV / Resume state
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [cvMatchScore, setCvMatchScore] = useState(null);
  const fileInputRef = useRef(null);

  // Red-flag scam keywords — triggers safety net override
  const SCAM_KEYWORDS = [
    "bitcoin", "zelle", "whatsapp", "telegram",
    "personal bank account", "relabel", "check",
    "money order", "package inspection", "cash app",
    "kindly", "trusted representative", "valid bank account",
    "training kit", "worth ₹", "starting salary of ₹",
    "personal gmail address", "confirmation within 24 hours",
    "pay for training", "registration fee",
  ];

  // ── On mount / user change: restore latest analysis + resume for THIS user ──
  useEffect(() => {
    setResumeText("");
    setResumeFileName("");
    setCvMatchScore(null);
    setResult(null);
    setJobDescription("");

    if (user?.email) {
      const latestAnalysis = JobAnalysisService.getLatest(user.email);
      if (latestAnalysis) {
        setResult(latestAnalysis);
        setJobDescription(latestAnalysis.jobDescription);
        if (latestAnalysis.cvMatchScore !== null && latestAnalysis.cvMatchScore !== undefined) {
          setCvMatchScore(latestAnalysis.cvMatchScore);
        }
      }

      const savedResume = JobAnalysisService.getActiveResume(user.email);
      if (savedResume) {
        setResumeText(savedResume.resumeText);
        setResumeFileName(savedResume.fileName);
      }
    }
  }, [user?.email]);

  // ── Resume Upload Handler ──────────────────────────────────────────────────
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExts = [".pdf", ".txt", ".doc", ".docx"];
    const fileExt = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt)) {
      setResumeError("Please upload a PDF, TXT, DOC, or DOCX file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeError("File too large. Maximum size is 5 MB.");
      return;
    }

    setResumeError("");
    setIsParsingResume(true);

    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);
      setResumeFileName(file.name);

      if (user?.email) {
        JobAnalysisService.saveActiveResume(user.email, text, file.name);
      }
      
      // Note: We don't automatically score the CV here anymore, 
      // they must click "Analyze" to hit the Python backend.
      setCvMatchScore(null); 

    } catch (err) {
      setResumeError(err.message || "Failed to parse resume.");
    } finally {
      setIsParsingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleResumeUpload({ target: { files: [file] } });
  };

  const handleRemoveResume = () => {
    setResumeText("");
    setResumeFileName("");
    setCvMatchScore(null);
    setResumeError("");
    if (user?.email) JobAnalysisService.clearActiveResume(user.email);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Form Submit (Calls Hugging Face, then Python Backend) ────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobDescription.trim()) {
      setError("Please enter a job description");
      return;
    }
    if (!user?.email) {
      setError("User session not found. Please log in again.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);
    setCvMatchScore(null);

    try {
      // 1. Get Fake/Real Prediction from Hugging Face
      const client = await Client.connect("https://ankitdand-sentinelxai.hf.space/");
      const hfResponse = await client.predict("/analyze_text", {
        text: jobDescription,
      });

      console.log("Original AI Response:", hfResponse.data);

      let confidenceData = hfResponse.data[0];
      const shapExplanation = hfResponse.data[1];
      const lowerDesc = jobDescription.toLowerCase();

      // 2. Safety Net: override AI if scam keywords detected
      const foundRedFlags = SCAM_KEYWORDS.filter((kw) =>
        new RegExp('\\b' + kw + '\\b', 'i').test(lowerDesc)
      );

      if (foundRedFlags.length > 0) {
        console.log("🚨 Safety Net Triggered! Found:", foundRedFlags);
        confidenceData = {
          label: "Fake",
          confidences: [
            { label: "Fake", confidence: 0.99 },
            { label: "Real", confidence: 0.01 },
          ],
        };
      }

      // 3. Prepare data for your Python Backend
      const rawAnalysis = {
        jobDescription: jobDescription,
        resumeText: resumeText || null, 
        confidence: confidenceData,
      };

      // Ensure you grab the token however you store it in your app
      const token = localStorage.getItem("token"); 

      // 4. Send to Python Backend to get CV Match Score and Relevance
      const pyResponse = await fetch("http://localhost:5000/api/rank_jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ analyses: [rawAnalysis] })
      });

      if (!pyResponse.ok) {
        throw new Error("Failed to process NLP scoring on backend.");
      }

      const pyData = await pyResponse.json();
      const enrichedAnalysis = pyData[0]; // Get the enriched result back
      
      const finalMatchScore = enrichedAnalysis?.cvMatchScore ?? null;
      if (finalMatchScore !== null) {
        setCvMatchScore(finalMatchScore);
      }

      // 5. Save everything to local storage
      const analysisResult = JobAnalysisService.add(
        {
          confidence: confidenceData,
          shapExplanation: shapExplanation,
          jobDescription: jobDescription,
          resumeText: resumeText || null,
          resumeFileName: resumeFileName || null,
          cvMatchScore: finalMatchScore,
        },
        user.email
      );

      setResult(analysisResult);

      if (onJobDescriptionSubmit) {
        onJobDescriptionSubmit(analysisResult);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to analyze job. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Score colour & label helpers ──────────────────────────────────────────
  const getScoreColor = (score) => {
    if (score >= 70) return "#16a34a";
    if (score >= 40) return "#d97706";
    return "#dc2626";
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return "Strong Match";
    if (score >= 40) return "Partial Match";
    return "Weak Match";
  };

  const isResultReal = result?.confidence?.label?.toLowerCase() === "real";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="job-description-container">
      <div className="job-description-content">

        <div className="header-section">
          <h1>Analyze Job Description</h1>
          <p className="page-subtitle">Check jobs for authenticity instantly</p>
        </div>

        <form onSubmit={handleSubmit} className="jd-form">

          {/* ── CV Upload Section ─────────────────────────────────────── */}
          <div className="cv-upload-section">
            <div className="cv-upload-header">
              <span className="cv-upload-title">Upload Your Resume / CV</span>
              
            </div>

            {!resumeFileName ? (
              <div
                className="cv-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleResumeUpload}
                  style={{ display: "none" }}
                />
                {isParsingResume ? (
                  <div className="cv-parsing-indicator">
                    <div className="cv-spinner" />
                    <span>Reading resume…</span>
                  </div>
                ) : (
                  <>
                    <span className="cv-dropzone-icon">⬆️</span>
                    <span className="cv-dropzone-text">
                      Click or drag &amp; drop your resume here
                    </span>
                    <span className="cv-dropzone-formats">
                      PDF · TXT · DOCX &nbsp;·&nbsp; Max 5 MB
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="cv-uploaded-pill">
                <span className="cv-file-icon">📋</span>
                <span className="cv-file-name">{resumeFileName}</span>
                <span className="cv-file-ready">✓ Ready</span>
                <button
                  type="button"
                  className="cv-remove-btn"
                  onClick={handleRemoveResume}
                  title="Remove resume"
                >
                  ✕
                </button>
              </div>
            )}

            {resumeError && (
              <div className="cv-error-message">⚠️ {resumeError}</div>
            )}

            {resumeFileName && (
              <p className="cv-scope-note">
                
              </p>
            )}
          </div>

          {/* ── Job Description Textarea ──────────────────────────────── */}
          <div className="form-group">
            <label htmlFor="jobDescription">Job Description</label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here…"
              rows="12"
              className="jd-textarea"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="spinner" />
                Analyzing…
              </>
            ) : (
              <>
                <span className="button-icon">🔍</span>
                Analyze Job Description
              </>
            )}
          </button>
        </form>

        {/* ── Results ──────────────────────────────────────────────────── */}
        {result && (
          <div className="results-section">

            {/* Confidence Score Card */}
            <div className="result-card confidence-card">
              <div className="result-header">
                
                <h3>Confidence Score</h3>
              </div>
              <div className="confidence-display">
                <div
                  className={`confidence-label ${result.confidence?.label?.toLowerCase()}`}
                >
                  {result.confidence?.label}
                </div>
                {result.confidence?.confidences?.map((conf, idx) => (
                  <div key={idx} className="confidence-item">
                    <span className="conf-label">{conf.label}:</span>
                    <div className="conf-bar-container">
                      <div
                        className={`conf-bar ${conf.label.toLowerCase()}`}
                        style={{ width: `${conf.confidence * 100}%` }}
                      />
                    </div>
                    <span className="conf-value">
                      {(conf.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CV Match Score Card — only for Real jobs with a resume */}
            {isResultReal &&
              result.cvMatchScore !== null &&
              result.cvMatchScore !== undefined && (
                <div className="result-card cv-match-card">
                  <div className="result-header">
                    
                    <h3>CV Match Score</h3>
                  </div>
                  <div className="cv-match-display">
                    <div className="cv-match-score-ring">
                      <svg viewBox="0 0 120 120" className="cv-ring-svg">
                        <circle
                          cx="60" cy="60" r="50"
                          fill="none" stroke="#e5e7eb" strokeWidth="10"
                        />
                        <circle
                          cx="60" cy="60" r="50"
                          fill="none"
                          stroke={getScoreColor(result.cvMatchScore)}
                          strokeWidth="10"
                          strokeDasharray={`${(result.cvMatchScore / 100) * 314} 314`}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                        />
                      </svg>
                      <div className="cv-ring-inner">
                        <span
                          className="cv-ring-score"
                          style={{ color: getScoreColor(result.cvMatchScore) }}
                        >
                          {result.cvMatchScore}%
                        </span>
                        <span className="cv-ring-label">
                          {getScoreLabel(result.cvMatchScore)}
                        </span>
                      </div>
                    </div>
                    <div className="cv-match-info">
                      <p className="cv-match-detail">
                        Based on semantic AI matching between your resume and the job
                        description. Higher = better alignment.
                      </p>
                      {result.resumeFileName && (
                        <p className="cv-match-file">
                          📋 Resume used:{" "}
                          <strong>{result.resumeFileName}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Hint card: real job but no resume uploaded */}
            {isResultReal && !resumeText && (
              <div className="result-card cv-hint-card">
                <div className="result-header">
                  <span className="result-icon">💡</span>
                  <h3>Get Your CV Match Score</h3>
                </div>
                <p className="cv-hint-text">
                  This job looks real! Upload your resume above and re-analyze
                  to see how well your CV matches this job description.
                </p>
              </div>
            )}

            {/* SHAP Explanation Card */}
            <div className="result-card explanation-card">
              <div className="result-header">
                
                <h3>SHAP Explanation</h3>
              </div>
              <div
                className="shap-content"
                dangerouslySetInnerHTML={{ __html: result.shapExplanation }}
              />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default JobDescription;