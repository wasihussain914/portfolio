// ============================================================================
//  Portfolio data model — single source of truth
//  Everything rendered on the page is derived from these objects.
// ============================================================================

export const profile = {
  name: "Wasi Hussain",
  fullName: "Syed W. (Wasi) Hussain",
  tagline: "CS + Applied Math @ Vanderbilt",
  roles: [
    "Machine Learning Engineer",
    "Full-Stack Builder",
    "Cybersecurity Researcher",
    "Cloud Developer",
    "Hackathon Winner",
  ],
  blurb:
    "I build systems that ship — from autonomous cyber-range pipelines for DARPA CASTLE, " +
    "to award-winning marketplaces and edge-AI defense platforms. Rising junior studying " +
    "Computer Science & Applied Mathematics, chasing hard problems at the intersection of " +
    "ML, cloud, and security.",
  location: "Nashville, TN",
  email: "wasi.hussain914@gmail.com",
  schoolEmail: "syed.w.hussain@vanderbilt.edu",
  links: {
    linkedin: "https://www.linkedin.com/in/wasihussain914",
    github: "https://github.com/wasihussain914",
    resume: "assets/resume.pdf",
  },
};

// Headline stats shown as animated counters in the hero / about section.
export const stats = [
  { label: "Hackathon Winnings", value: 165, prefix: "$", suffix: "K+" },
  { label: "Projects Shipped", value: 18, suffix: "+" },
  { label: "Students Reached", value: 7000, suffix: "+" },
  { label: "Emulated Cyber Envs", value: 10, suffix: "+" },
];

export const education = [
  {
    school: "Vanderbilt University",
    degree: "B.S. Computer Science & Applied Mathematics",
    location: "Nashville, TN",
    dates: "2025 – 2028",
    note: "Focus: machine learning, cloud systems, cybersecurity. GPA 3.5.",
  },
  {
    school: "Rochester Institute of Technology",
    degree: "B.S. Computer Science (transferred)",
    location: "Rochester, NY",
    dates: "2023 – 2025",
    note: "Coursework toward CS, GPA 4.0. Transferred to Vanderbilt.",
  },
];

export const experience = [
  {
    org: "Vanderbilt ISIS",
    role: "Research Assistant — DARPA CASTLE (PURPLE team)",
    dates: "May 2026 – Present",
    tag: "Research · Cybersecurity",
    highlights: [
      "Built an automated scenario-generation pipeline for DARPA CASTLE; deployed network assets + 50+ real-world vulnerabilities, cutting setup time 70% for RL agents.",
      "Wrote validation routines and benchmark-dataset tooling measuring cyber-agent performance across 10+ emulated environments.",
    ],
  },
  {
    org: "Vanderbilt Cloud Innovation Lab",
    role: "Cloud Developer",
    dates: "Aug 2025 – May 2026",
    tag: "Cloud · AI",
    highlights: [
      "Built AI video-segmentation pipelines on AWS (Transcribe, EC2) with Pydantic + prompt engineering for automated news labeling.",
      "Shipped commercial-segment detection via image mosaicing + black-frame analysis at 95% accuracy.",
      "AWS Lambda + IaC pipelines automating 10TB of media analysis — cost −80%, time −90%.",
    ],
  },
  {
    org: "NSF REU — North Dakota State University",
    role: "Research Assistant",
    dates: "Jul – Aug 2025",
    tag: "Research · ML Hardware",
    highlights: [
      "AI for Sustainable Energy Systems: evaluated LLM energy footprints.",
      "Developed a 2B-parameter 1-bit LLM using FeFETs for a 100× energy reduction.",
      "Placed 2nd of 30+ projects.",
    ],
  },
  {
    org: "Rochester Institute of Technology",
    role: "Teaching Assistant — CS2 Data Structures",
    dates: "Feb – May 2025",
    tag: "Teaching",
    highlights: [
      "Ran weekly problem-solving + debugging support for 30+ students.",
    ],
  },
  {
    org: "Mpower Social Enterprises — Dhaka",
    role: "Machine Learning Intern",
    dates: "May – Jul 2023",
    tag: "ML · Healthcare",
    highlights: [
      "Built a GPT-3.5 nutrition chatbot with PDF knowledge retrieval (chunked loading).",
      "Trained a TensorFlow miscarriage-risk model on a UN dataset of 600k+ patients — +60% accuracy.",
    ],
  },
];

// Category keys used for the interactive project filter.
export const categories = [
  { key: "all", label: "All" },
  { key: "award", label: "🏆 Award-Winning" },
  { key: "ai", label: "AI / ML" },
  { key: "cloud", label: "Cloud" },
  { key: "security", label: "Security" },
  { key: "web", label: "Web / Full-Stack" },
  { key: "tools", label: "Tools" },
];

// Every project — the whole body of work, curated and described.
export const projects = [
  {
    name: "AnchorExchange",
    subtitle: "CommodoreCleanout",
    award: "🥇 1st @ Vanderbilt Greenathon · $150K seed",
    year: "2026",
    cats: ["award", "web"],
    blurb:
      "Peer-to-peer sustainable marketplace for 7,000+ Vanderbilt students to buy, sell, and trade dorm goods. Piloted across 6 residence halls with 300+ transactions and 1,000+ lbs of waste diverted.",
    stack: ["Next.js", "React", "Firebase", "TypeScript"],
    metrics: ["$150K funding", "7,000+ users", "1,000+ lbs diverted"],
    url: "https://github.com/wasihussain914/CommodoreCleanout",
    accent: "#22d3a6",
  },
  {
    name: "Hush-Mesh",
    award: "🥈 2nd @ AWS Mission Autonomy Hackathon · $15K",
    year: "2025",
    cats: ["award", "ai", "cloud", "security"],
    blurb:
      "Real-time maritime convoy-protection system. Tethered edge drones run CNN-LSTM threat detection (92.86% accuracy) and reroute the convoy, with A* path planning for 4-drone formations avoiding 500+ dynamic obstacles.",
    stack: ["AWS Kinesis", "Lambda", "ECS/Fargate", "PyTorch"],
    metrics: ["92.86% accuracy", "−45% latency", "500+ obstacles avoided"],
    url: "https://github.com/wasihussain914/hush-mesh",
    accent: "#38bdf8",
  },
  {
    name: "Aegis-Edge",
    award: "🏅 Best Collaboration @ AWS Global Government Hackathon 2026",
    year: "2026",
    cats: ["award", "security", "ai"],
    blurb:
      "Governable, jam-resilient cooperative counter-UAS at the edge. Deterministic engagement gate with human-in-the-loop control — keeping the LLM firmly off the kill chain.",
    stack: ["TypeScript", "Edge AI", "AWS"],
    metrics: ["Human-in-the-loop", "Jam-resilient", "Deterministic gate"],
    url: "https://github.com/wasihussain914/Aegis-Edge",
    accent: "#f472b6",
  },
  {
    name: "Narravision",
    award: "🎨 Built @ Claude AI Hackathon",
    year: "2025",
    cats: ["award", "ai"],
    blurb:
      "Reads books to you with generated illustrations and narration as you go. Turns any text into an illustrated, narrated experience — built on Claude, Gemini, and Cartesia.",
    stack: ["TypeScript", "Claude", "Gemini", "Cartesia"],
    metrics: ["Live narration", "Generative art", "Multi-model"],
    url: "https://github.com/wasihussain914/Narravision",
    accent: "#a78bfa",
  },
  {
    name: "CASTLE Scenario Pipeline",
    subtitle: "DARPA · Vanderbilt ISIS",
    year: "2026",
    cats: ["ai", "security", "cloud"],
    blurb:
      "A closed feedback loop turning a natural-language request into a validated, reproducible cyber-range scenario — topology, assets, real vulnerabilities, and attack paths — plus a deploy-ready OpenStack Heat file.",
    stack: ["Python", "LLMs", "OpenStack", "RL"],
    metrics: ["50+ real vulns", "−70% setup time", "10+ environments"],
    url: "https://github.com/wasihussain914",
    accent: "#c084fc",
  },
  {
    name: "1-Bit LLM on FeFETs",
    subtitle: "NSF REU · NDSU",
    award: "🥈 2nd of 30+ projects",
    year: "2025",
    cats: ["ai"],
    blurb:
      "A 2-billion-parameter 1-bit large language model built on ferroelectric FET hardware, achieving a 100× energy reduction — research into AI for sustainable energy systems.",
    stack: ["PyTorch", "FeFET", "Quantization"],
    metrics: ["2B params", "1-bit", "100× less energy"],
    url: "https://github.com/wasihussain914",
    accent: "#34d399",
  },
  {
    name: "JobPilot",
    year: "2026",
    cats: ["ai", "tools"],
    blurb:
      "Auto-discovery → match → draft → review → assisted-apply pipeline for internships. Automates everything up to the moment an application goes out under your name — the final send stays human-gated.",
    stack: ["Python", "LLMs", "RAG"],
    metrics: ["Resume-matched", "Auto-tailored", "Human-gated"],
    url: "https://github.com/wasihussain914/jobpilot",
    accent: "#fbbf24",
  },
  {
    name: "NetPilot",
    year: "2026",
    cats: ["ai", "tools"],
    blurb:
      "A referral-networking engine. Finds alumni at target companies, resolves verified emails, and drafts tailored coffee-chat outreach + LinkedIn notes — all gated and rate-limited inside a free-tier budget.",
    stack: ["Python", "Brave API", "Hunter", "LLMs"],
    metrics: ["Alumni discovery", "Email enrichment", "Gated sending"],
    url: "https://github.com/wasihussain914/netpilot",
    accent: "#60a5fa",
  },
  {
    name: "LeetCode Trainer",
    year: "2026",
    cats: ["tools", "web"],
    blurb:
      "A self-contained, fully-offline LeetCode-style practice app. Write Python or JavaScript, run against test cases, and see pass/fail — all in the browser via vendored Pyodide. Built for flights with no internet.",
    stack: ["JavaScript", "Pyodide", "WebAssembly"],
    metrics: ["100% offline", "Python + JS", "In-browser"],
    url: "https://github.com/wasihussain914/leetcode-trainer",
    accent: "#f59e0b",
  },
  {
    name: "LLM Council",
    year: "2026",
    cats: ["ai", "web"],
    blurb:
      "Instead of asking one model, convene a council. Sends your query to multiple LLMs, has them anonymously review and rank each other, then a Chairman model synthesizes the final answer.",
    stack: ["Python", "OpenRouter", "React"],
    metrics: ["Multi-model", "Peer-ranked", "Local web app"],
    url: "https://github.com/wasihussain914",
    accent: "#818cf8",
  },
  {
    name: "zoom-bot",
    year: "2026",
    cats: ["ai", "tools"],
    blurb:
      "Listens to any meeting playing on your machine, transcribes it locally with faster-whisper, logs everything said, and DMs you on Discord the moment your name comes up. No Zoom credentials required.",
    stack: ["Python", "faster-whisper", "ffmpeg"],
    metrics: ["Local transcription", "Name alerts", "No creds"],
    url: "https://github.com/wasihussain914",
    accent: "#2dd4bf",
  },
  {
    name: "manga2kindle",
    year: "2026",
    cats: ["tools"],
    blurb:
      "Hand it a manga PDF, get back a Kindle-ready EPUB — right-to-left reading, double-page splitting, and e-ink-appropriate resizing. A clean wrapper around Kindle Comic Converter.",
    stack: ["Shell", "Python", "KCC"],
    metrics: ["RTL reading", "Page splitting", "e-ink tuned"],
    url: "https://github.com/wasihussain914/manga2kindle",
    accent: "#fb7185",
  },
  {
    name: "castle-dashboard",
    year: "2026",
    cats: ["cloud", "tools"],
    blurb:
      "A personal, read-only control panel for CASTLE research work — live OpenStack state, project allocation, the knowledge base, and workstream plans, all in one place. Read-only by design; never mutates the cloud.",
    stack: ["Python", "Flask", "OpenStack"],
    metrics: ["Live cloud state", "Read-only", "Single pane"],
    url: "https://github.com/wasihussain914/castle-dashboard",
    accent: "#a3e635",
  },
  {
    name: "AI Video Pipeline",
    subtitle: "Cloud Innovation Lab",
    year: "2025",
    cats: ["cloud", "ai"],
    blurb:
      "Serverless media-analysis pipeline processing 10TB of video: AI segmentation, commercial detection via image mosaicing + black-frame analysis (95% accuracy), and automated news labeling.",
    stack: ["AWS Lambda", "Transcribe", "EC2", "IaC"],
    metrics: ["10TB processed", "−80% cost", "−90% time"],
    url: "https://github.com/wasihussain914",
    accent: "#38bdf8",
  },
  {
    name: "Nutrition Chatbot",
    subtitle: "Mpower Social Enterprises",
    year: "2023",
    cats: ["ai"],
    blurb:
      "A GPT-3.5 nutrition assistant with PDF knowledge retrieval via chunked loading, plus a TensorFlow miscarriage-risk model trained on a UN dataset of 600k+ patients (+60% accuracy).",
    stack: ["GPT-3.5", "TensorFlow", "RAG"],
    metrics: ["600k+ patients", "+60% accuracy", "PDF retrieval"],
    url: "https://github.com/wasihussain914",
    accent: "#4ade80",
  },
  {
    name: "AI Humanizer",
    year: "2026",
    cats: ["tools", "ai"],
    blurb:
      "Detects and removes signs of AI-generated writing using 24 pattern detectors, 500+ vocabulary terms, and statistical analysis (burstiness, type-token ratio, readability). Ships as a CLI + skill with 128 passing tests.",
    stack: ["Node.js", "NLP", "CLI"],
    metrics: ["24 detectors", "500+ terms", "128 tests"],
    url: "https://github.com/wasihussain914",
    accent: "#facc15",
  },
  {
    name: "covidtracker",
    year: "2024",
    cats: ["web", "tools"],
    blurb:
      "A Flask app charting COVID-19 case data for Bangladesh — daily counts, 7-day rolling averages, and trend visualization pulled from public data sources.",
    stack: ["Flask", "Python", "Matplotlib"],
    metrics: ["Daily counts", "7-day avg", "Live data"],
    url: "https://github.com/wasihussain914/covidtracker",
    accent: "#f87171",
  },
  {
    name: "OLevelGradeWeighter",
    year: "2024",
    cats: ["tools"],
    blurb:
      "A CLI that calculates weighted O-Level Computer Science grades across Papers 2, 4, and optionally 6, outputting total marks and final percentage.",
    stack: ["Python", "CLI"],
    metrics: ["Weighted scoring", "Multi-paper", "Instant"],
    url: "https://github.com/wasihussain914/OLevelGradeWeighter",
    accent: "#9ca3af",
  },
];

// Skill groups — rendered as animated bars and fed into the 3D skill sphere.
export const skills = {
  Languages: ["Python", "C", "JavaScript", "TypeScript", "Java", "HTML/CSS"],
  "ML / AI": ["PyTorch", "TensorFlow", "Reinforcement Learning", "LLMs", "RAG", "Computer Vision", "GPT"],
  "Cloud / Infra": ["AWS", "EC2", "Lambda", "Kinesis", "ECS", "Fargate", "OpenStack", "IaC"],
  "Frameworks": ["React", "Next.js", "Flask", "Firebase", "Node.js"],
  "Data / Libs": ["Pandas", "NumPy", "Matplotlib", "Seaborn", "Pydantic"],
};

// Flat list of every skill token for the rotating 3D sphere.
export const skillCloud = Object.values(skills).flat();
