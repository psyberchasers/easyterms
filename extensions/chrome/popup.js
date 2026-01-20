// EasyTerms Chrome Extension
const API_BASE = 'https://easyterms.ai';
const SUPABASE_URL = 'https://jnfzlhzawqkbumzjssma.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZnpsaHphd3FrYnVtempzc21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0MzQ5NDgsImV4cCI6MjA1MjAxMDk0OH0.74LazhLuOBqbSMZFakYALLHiNHri-0eFq3DP-sJy8sw';

// DOM Elements
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const loadingSection = document.getElementById('loading-section');
const signinBtn = document.getElementById('signin-btn');
const signupLink = document.getElementById('signup-link');
const signoutBtn = document.getElementById('signout-btn');
const userEmail = document.getElementById('user-email');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const progressSection = document.getElementById('progress-section');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const resultSection = document.getElementById('result-section');
const resultTitle = document.getElementById('result-title');
const resultSummary = document.getElementById('result-summary');
const riskBadge = document.getElementById('risk-badge');
const viewFullBtn = document.getElementById('view-full-btn');
const viewAllLink = document.getElementById('view-all-link');
const recentList = document.getElementById('recent-list');

let currentUser = null;
let currentContractId = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  showSection('loading');

  // Check for stored session
  let session = await getStoredSession();

  // If no stored session, try to fetch from API (user might be logged in on website)
  if (!session) {
    try {
      const response = await fetch(`${API_BASE}/api/auth/session`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.session) {
          session = data.session;
          await setStoredSession(session);
        }
      }
    } catch (e) {
      console.log('Could not fetch session from API');
    }
  }

  if (session) {
    currentUser = session.user;
    await showLoggedInState();
  } else {
    showSection('auth');
  }
}

// Storage helpers
async function getStoredSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['easyterms_session'], (result) => {
      resolve(result.easyterms_session || null);
    });
  });
}

async function setStoredSession(session) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ easyterms_session: session }, resolve);
  });
}

async function clearStoredSession() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['easyterms_session'], resolve);
  });
}

// UI State management
function showSection(section) {
  authSection.classList.add('hidden');
  mainSection.classList.add('hidden');
  loadingSection.classList.add('hidden');

  if (section === 'auth') authSection.classList.remove('hidden');
  if (section === 'main') mainSection.classList.remove('hidden');
  if (section === 'loading') loadingSection.classList.remove('hidden');
}

async function showLoggedInState() {
  userEmail.textContent = currentUser.email;
  showSection('main');
  await loadRecentContracts();
}

// Auth handlers
signinBtn.addEventListener('click', async () => {
  // First, try to fetch session from API (in case already logged in)
  try {
    const response = await fetch(`${API_BASE}/api/auth/session`, {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      if (data.session) {
        await setStoredSession(data.session);
        currentUser = data.session.user;
        await showLoggedInState();
        return;
      }
    }
  } catch (e) {
    console.log('Could not fetch existing session, opening login');
  }

  // Open login page
  chrome.tabs.create({ url: `${API_BASE}/login?extension=true` });
});

signupLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${API_BASE}/signup?extension=true` });
});

signoutBtn.addEventListener('click', async () => {
  await clearStoredSession();
  currentUser = null;
  showSection('auth');
});

// File upload handlers
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) handleFile(files[0]);
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

async function handleFile(file) {
  // Validate file type
  const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!validTypes.includes(file.type)) {
    alert('Please upload a PDF or Word document');
    return;
  }

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('File size must be less than 10MB');
    return;
  }

  // Show progress
  uploadArea.classList.add('hidden');
  resultSection.classList.add('hidden');
  progressSection.classList.remove('hidden');

  try {
    // Upload and analyze
    await uploadAndAnalyze(file);
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to analyze contract. Please try again.');
    resetUploadState();
  }
}

async function uploadAndAnalyze(file) {
  const session = await getStoredSession();
  if (!session) {
    showSection('auth');
    return;
  }

  // Update progress
  updateProgress(10, 'Uploading contract...');

  // Create form data
  const formData = new FormData();
  formData.append('file', file);

  // Upload to Supabase storage
  const fileName = `${Date.now()}-${file.name}`;
  const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/contracts/${session.user.id}/${fileName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file');
  }

  updateProgress(40, 'Analyzing contract...');

  // Get the file URL
  const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/contracts/${session.user.id}/${fileName}`;

  // Create contract record and trigger analysis
  const contractResponse = await fetch(`${API_BASE}/api/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      title: file.name.replace(/\.[^/.]+$/, ''),
      file_url: fileUrl,
      file_name: file.name,
    }),
  });

  if (!contractResponse.ok) {
    throw new Error('Failed to create contract');
  }

  const contract = await contractResponse.json();
  currentContractId = contract.id;

  updateProgress(60, 'AI analyzing terms...');

  // Poll for analysis completion
  await pollForAnalysis(contract.id, session.access_token);
}

async function pollForAnalysis(contractId, accessToken) {
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`${API_BASE}/api/contracts/${contractId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const contract = await response.json();

      if (contract.status === 'analyzed' && contract.analysis) {
        updateProgress(100, 'Analysis complete!');
        showResult(contract);
        return;
      }

      if (contract.status === 'error') {
        throw new Error('Analysis failed');
      }
    }

    // Update progress
    const progress = 60 + Math.min(35, attempts * 2);
    updateProgress(progress, 'AI analyzing terms...');

    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error('Analysis timeout');
}

function updateProgress(percent, text) {
  progressFill.style.width = `${percent}%`;
  progressText.textContent = text;
}

function showResult(contract) {
  progressSection.classList.add('hidden');
  resultSection.classList.remove('hidden');

  const analysis = contract.analysis;
  resultTitle.textContent = analysis.contractType || contract.title;
  resultSummary.textContent = analysis.summary ?
    (analysis.summary.length > 150 ? analysis.summary.substring(0, 150) + '...' : analysis.summary) :
    'Contract analyzed successfully.';

  // Set risk badge
  const risk = contract.overall_risk || analysis.overallRiskAssessment || 'low';
  riskBadge.textContent = `${risk} risk`;
  riskBadge.className = `risk-badge ${risk}`;

  // Refresh recent list
  loadRecentContracts();
}

function resetUploadState() {
  progressSection.classList.add('hidden');
  resultSection.classList.add('hidden');
  uploadArea.classList.remove('hidden');
  progressFill.style.width = '0%';
}

// View full analysis
viewFullBtn.addEventListener('click', () => {
  if (currentContractId) {
    chrome.tabs.create({ url: `${API_BASE}/dashboard/contracts/${currentContractId}` });
  }
});

viewAllLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${API_BASE}/dashboard` });
});

// Load recent contracts
async function loadRecentContracts() {
  const session = await getStoredSession();
  if (!session) return;

  try {
    const response = await fetch(`${API_BASE}/api/contracts?limit=3`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const contracts = await response.json();
      renderRecentContracts(contracts);
    }
  } catch (error) {
    console.error('Failed to load recent contracts:', error);
  }
}

function renderRecentContracts(contracts) {
  if (!contracts || contracts.length === 0) {
    recentList.innerHTML = '<div class="empty-state">No contracts yet</div>';
    return;
  }

  recentList.innerHTML = contracts.map(contract => {
    const risk = contract.overall_risk || 'low';
    const date = new Date(contract.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return `
      <div class="recent-item" data-id="${contract.id}">
        <div class="recent-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="recent-info">
          <div class="recent-name">${contract.title}</div>
          <div class="recent-date">${date}</div>
        </div>
        <div class="recent-risk ${risk}"></div>
      </div>
    `;
  }).join('');

  // Add click handlers
  recentList.querySelectorAll('.recent-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      chrome.tabs.create({ url: `${API_BASE}/dashboard/contracts/${id}` });
    });
  });
}

// Listen for auth messages from the website
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EASYTERMS_AUTH') {
    setStoredSession(message.session).then(() => {
      currentUser = message.session.user;
      showLoggedInState();
    });
  }
});
