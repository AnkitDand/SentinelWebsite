import React, { useState } from "react";
import "./Home.css";

function Home({ user }) {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Real threat examples
  const commonScams = [
    {
      icon: "💰",
      title: "Upfront Payment Scams",
      description:
        "Fake employers asking for money for training, equipment, or background checks before hiring.",
      severity: "Critical",
    },
    {
      icon: "🎯",
      title: "Task-Based Scams",
      description:
        "Promising easy money for simple tasks like rating products, often on Telegram or WhatsApp.",
      severity: "High",
    },
    {
      icon: "🏢",
      title: "Fake Company Profiles",
      description:
        "Non-existent companies with copied logos and fabricated legitimacy indicators.",
      severity: "High",
    },
    {
      icon: "🔗",
      title: "Phishing Links",
      description:
        "Malicious links disguised as job applications stealing personal information.",
      severity: "Medium",
    },
    {
      icon: "💳",
      title: "Identity Theft",
      description:
        "Collecting sensitive documents (PAN, Aadhaar, bank details) under the guise of KYC verification.",
      severity: "Critical",
    },
  ];

  // Red flags to watch for
  const redFlags = [
    {
      icon: "⚠️",
      text: "Promises of unrealistic salaries (e.g., ₹50,000/month for data entry)",
    },
    {
      icon: "⚠️",
      text: "Use of unprofessional communication channels (WhatsApp, Telegram for official hiring)",
    },
    {
      icon: "⚠️",
      text: "Poor grammar, spelling errors, and unprofessional language",
    },
    {
      icon: "⚠️",
      text: "Requests for money, bank details, or sensitive documents upfront",
    },
    {
      icon: "⚠️",
      text: "Vague job descriptions with no clear company information",
    },
    {
      icon: "⚠️",
      text: "Pressure tactics: 'Limited slots', 'Urgent hiring', 'Offer expires today'",
    },
    {
      icon: "⚠️",
      text: "Email addresses from free domains (Gmail, Yahoo) instead of company domains",
    },
    {
      icon: "⚠️",
      text: "No interview process or extremely casual hiring procedures",
    },
  ];

  // FAQ data
  const faqs = [
    {
      question: "How does SentinelXAI detect fake jobs?",
      answer:
        "We use DistilBERT, a state-of-the-art transformer model fine-tuned on thousands of verified fake and genuine job postings. The model analyzes linguistic patterns, structural elements, and contextual clues. We then use SHAP (SHapley Additive exPlanations) to highlight which specific words or phrases contributed to the classification, making our AI decisions transparent and explainable.",
    },
    {
      question: "What makes this different from manual checking?",
      answer:
        "Manual checking is time-consuming and subjective. Our AI processes job descriptions in under 2 seconds and detects subtle patterns that humans might miss. More importantly, we provide explainable results - showing you exactly why a job is flagged as suspicious, helping you learn to identify red flags yourself.",
    },
    {
      question: "Is my data safe when I use this tool?",
      answer:
        "Absolutely. We process job descriptions locally in your browser session and do not store or share the text you analyze. Your privacy is our priority. We only store analysis metadata (timestamp, result) if you're logged in, never the actual job description content.",
    },
    {
      question: "Can scammers trick the AI?",
      answer:
        "While no system is 100% foolproof, our model is trained on evolving scam tactics and regularly updated. Even if a scam passes initial detection, our SHAP explanations help you make an informed decision by highlighting suspicious elements you should verify independently.",
    },
    {
      question: "Who is most vulnerable to job scams?",
      answer:
        "Freshers and students are primary targets due to limited experience. However, experienced professionals are also targeted with sophisticated scams. Task-based scams particularly target people looking for part-time or work-from-home opportunities. Stay vigilant regardless of your experience level.",
    },
    {
      question: "What should I do if I've already fallen for a scam?",
      answer:
        "1) Stop all communication immediately. 2) Do not send any more money or information. 3) Report to cybercrime.gov.in. 4) Block the scammer's contact. 5) Alert your bank if you shared financial information. 6) Document all evidence (screenshots, emails). Remember: it's not your fault, and reporting helps protect others.",
    },
  ];

  // Technology explanation
  const techStack = [
    {
      icon: "🤖",
      title: "DistilBERT Model",
      description:
        "A lightweight yet powerful transformer model that understands context and semantics in job descriptions",
      details: "Fine-tuned on 10,000+ labeled examples",
    },
    {
      icon: "🔍",
      title: "SHAP Analysis",
      description:
        "Explainable AI that highlights exactly which words influenced the prediction",
      details: "Complete transparency in every decision",
    },
    {
      icon: "⚡",
      title: "Real-time Processing",
      description: "Instant analysis with sub-2-second response times",
      details: "Optimized inference pipeline",
    },
  ];

  // Real statistics context
  const situationContext = [
    {
      icon: "📊",
      stat: "52%",
      label: "of Indian job seekers",
      context:
        "have encountered at least one fake job posting (NASSCOM Report)",
    },
    {
      icon: "💸",
      stat: "₹1,200 Cr+",
      label: "lost annually",
      context: "to job-related fraud in India (National Crime Records Bureau)",
    },
    {
      icon: "🎓",
      stat: "68%",
      label: "of victims",
      context:
        "are freshers or students without prior work experience (Cybercrime Cell Data)",
    },
  ];

  return (
    <div className="home-container">
      <div className="home-content">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-text">
            <h1>Welcome to SentinelXAI</h1>
            <p className="hero-subtitle">
              AI-Powered Protection Against Job Scams
            </p>
            <p className="hero-description">
              Don't let fake job postings steal your time, money, or personal
              information. Our explainable AI helps you identify fraudulent
              opportunities before they harm you.
            </p>
          </div>
        </div>

        {/* Situation Context */}
        <div className="section-header">
          <h2>🚨 The Current Situation</h2>
          <p className="section-subtitle">
            Understanding the scale of the job scam epidemic in India
          </p>
        </div>

        <div className="stats-context-grid">
          {situationContext.map((item, index) => (
            <div key={index} className="context-card">
              <div className="context-icon">{item.icon}</div>
              <div className="context-stat">{item.stat}</div>
              <div className="context-label">{item.label}</div>
              <div className="context-text">{item.context}</div>
            </div>
          ))}
        </div>

        {/* Common Scams Section */}
        <div className="section-header">
          <h2>🎭 Common Job Scam Types</h2>
          <p className="section-subtitle">
            Recognize these tactics before they target you
          </p>
        </div>

        <div className="scams-grid">
          {commonScams.map((scam, index) => (
            <div key={index} className="scam-card">
              <div className="scam-header">
                <span className="scam-icon">{scam.icon}</span>
                <span
                  className={`severity-badge ${scam.severity.toLowerCase()}`}>
                  {scam.severity}
                </span>
              </div>
              <h3>{scam.title}</h3>
              <p>{scam.description}</p>
            </div>
          ))}
        </div>

        {/* Red Flags Checklist */}
        <div className="section-header">
          <h2>🚩 Red Flags Checklist</h2>
          <p className="section-subtitle">
            If you see ANY of these signs, proceed with extreme caution
          </p>
        </div>

        <div className="red-flags-container">
          <div className="red-flags-list">
            {redFlags.map((flag, index) => (
              <div key={index} className="red-flag-item">
                <span className="flag-icon">{flag.icon}</span>
                <span className="flag-text">{flag.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Section */}
        <div className="section-header">
          <h2>🔬 Our Technology</h2>
          <p className="section-subtitle">How AI helps you stay safe</p>
        </div>

        <div className="tech-grid">
          {techStack.map((tech, index) => (
            <div key={index} className="tech-card">
              <div className="tech-icon-large">{tech.icon}</div>
              <h3>{tech.title}</h3>
              <p>{tech.description}</p>
              <div className="tech-detail">{tech.details}</div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="section-header">
          <h2>❓ Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about job scam detection
          </p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <div
                className={`faq-question ${expandedFaq === index ? "active" : ""}`}
                onClick={() => toggleFaq(index)}>
                <span>{faq.question}</span>
                <span className="faq-toggle">
                  {expandedFaq === index ? "−" : "+"}
                </span>
              </div>
              {expandedFaq === index && (
                <div className="faq-answer">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <h2>Ready to Protect Yourself?</h2>
          <p>
            Navigate to the <strong>Analyze</strong> page to scan your job
            description with AI-powered detection
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
