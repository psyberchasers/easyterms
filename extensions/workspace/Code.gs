/**
 * EasyTerms Google Workspace Add-on
 * Analyze music contracts directly from Google Drive and Docs
 */

const API_BASE = 'https://easyterms.vercel.app';
const SUPABASE_URL = 'https://jnfzlhzawqkbumzjssma.supabase.co';

/**
 * Homepage trigger for the add-on
 */
function onHomepage(e) {
  return createHomepageCard();
}

/**
 * Docs-specific homepage
 */
function onDocsHomepage(e) {
  return createHomepageCard(true);
}

/**
 * Triggered when files are selected in Drive
 */
function onDriveItemsSelected(e) {
  const items = e.drive.selectedItems;

  if (!items || items.length === 0) {
    return createErrorCard('No files selected');
  }

  // Filter for supported files (PDF, DOC, DOCX)
  const supportedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.google-apps.document'
  ];

  const supportedFiles = items.filter(item => supportedMimes.includes(item.mimeType));

  if (supportedFiles.length === 0) {
    return createErrorCard('Please select a PDF or Word document');
  }

  if (supportedFiles.length === 1) {
    return createAnalyzeCard(supportedFiles[0]);
  }

  return createMultiFileCard(supportedFiles);
}

/**
 * Create the main homepage card
 */
function createHomepageCard(isDocsContext) {
  const userEmail = Session.getActiveUser().getEmail();
  const session = getStoredSession();

  const builder = CardService.newCardBuilder();

  // Header
  const header = CardService.newCardHeader()
    .setTitle('EasyTerms')
    .setSubtitle('Contract Analysis')
    .setImageStyle(CardService.ImageStyle.CIRCLE)
    .setImageUrl('https://easyterms.vercel.app/icon.png');

  builder.setHeader(header);

  // Main section
  const section = CardService.newCardSection();

  if (!session) {
    // Not logged in
    section.addWidget(
      CardService.newTextParagraph()
        .setText('Sign in to analyze contracts and get AI-powered insights.')
    );

    section.addWidget(
      CardService.newTextButton()
        .setText('Sign In to EasyTerms')
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(API_BASE + '/login?workspace=true')
            .setOpenAs(CardService.OpenAs.OVERLAY)
        )
    );
  } else {
    // Logged in
    section.addWidget(
      CardService.newDecoratedText()
        .setText(session.email)
        .setTopLabel('Signed in as')
        .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.PERSON))
    );

    section.addWidget(CardService.newDivider());

    if (isDocsContext) {
      section.addWidget(
        CardService.newTextParagraph()
          .setText('Open a contract document to analyze it, or upload a new contract.')
      );
    } else {
      section.addWidget(
        CardService.newTextParagraph()
          .setText('Select a contract file in Drive to analyze it.')
      );
    }

    // Quick actions
    section.addWidget(
      CardService.newButtonSet()
        .addButton(
          CardService.newTextButton()
            .setText('Open Dashboard')
            .setOpenLink(
              CardService.newOpenLink()
                .setUrl(API_BASE + '/dashboard')
                .setOpenAs(CardService.OpenAs.FULL_SIZE)
            )
        )
        .addButton(
          CardService.newTextButton()
            .setText('Upload Contract')
            .setOpenLink(
              CardService.newOpenLink()
                .setUrl(API_BASE + '/dashboard/upload-contract')
                .setOpenAs(CardService.OpenAs.FULL_SIZE)
            )
        )
    );

    // Recent contracts
    const recentContracts = getRecentContracts(session);
    if (recentContracts && recentContracts.length > 0) {
      section.addWidget(CardService.newDivider());
      section.addWidget(
        CardService.newTextParagraph()
          .setText('<b>Recent Contracts</b>')
      );

      recentContracts.slice(0, 3).forEach(contract => {
        const riskColor = contract.overall_risk === 'high' ? '#ef4444' :
                         contract.overall_risk === 'medium' ? '#eab308' : '#22c55e';

        section.addWidget(
          CardService.newDecoratedText()
            .setText(contract.title)
            .setBottomLabel(formatDate(contract.created_at))
            .setStartIcon(
              CardService.newIconImage()
                .setIcon(CardService.Icon.DESCRIPTION)
            )
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('openContract')
                .setParameters({ contractId: contract.id })
            )
        );
      });
    }

    // Sign out
    section.addWidget(CardService.newDivider());
    section.addWidget(
      CardService.newTextButton()
        .setText('Sign Out')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('signOut')
        )
    );
  }

  builder.addSection(section);

  return builder.build();
}

/**
 * Create card for analyzing a single file
 */
function createAnalyzeCard(file) {
  const session = getStoredSession();

  if (!session) {
    return createSignInCard();
  }

  const builder = CardService.newCardBuilder();

  const header = CardService.newCardHeader()
    .setTitle('Analyze Contract')
    .setSubtitle(file.title);

  builder.setHeader(header);

  const section = CardService.newCardSection();

  section.addWidget(
    CardService.newDecoratedText()
      .setText(file.title)
      .setTopLabel('Selected File')
      .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.DESCRIPTION))
  );

  section.addWidget(
    CardService.newTextParagraph()
      .setText('Click below to analyze this contract with EasyTerms AI.')
  );

  section.addWidget(
    CardService.newTextButton()
      .setText('Analyze Contract')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor('#a855f7')
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('analyzeFile')
          .setParameters({
            fileId: file.id,
            fileName: file.title,
            mimeType: file.mimeType
          })
      )
  );

  builder.addSection(section);

  return builder.build();
}

/**
 * Create card for multiple files
 */
function createMultiFileCard(files) {
  const builder = CardService.newCardBuilder();

  const header = CardService.newCardHeader()
    .setTitle('Multiple Files Selected')
    .setSubtitle(files.length + ' contracts');

  builder.setHeader(header);

  const section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextParagraph()
      .setText('Select a contract to analyze:')
  );

  files.forEach(file => {
    section.addWidget(
      CardService.newDecoratedText()
        .setText(file.title)
        .setStartIcon(CardService.newIconImage().setIcon(CardService.Icon.DESCRIPTION))
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('analyzeFile')
            .setParameters({
              fileId: file.id,
              fileName: file.title,
              mimeType: file.mimeType
            })
        )
    );
  });

  builder.addSection(section);

  return builder.build();
}

/**
 * Create sign-in card
 */
function createSignInCard() {
  const builder = CardService.newCardBuilder();

  const header = CardService.newCardHeader()
    .setTitle('Sign In Required');

  builder.setHeader(header);

  const section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextParagraph()
      .setText('Please sign in to EasyTerms to analyze contracts.')
  );

  section.addWidget(
    CardService.newTextButton()
      .setText('Sign In')
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(API_BASE + '/login?workspace=true')
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );

  builder.addSection(section);

  return builder.build();
}

/**
 * Create error card
 */
function createErrorCard(message) {
  const builder = CardService.newCardBuilder();

  const section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextParagraph()
      .setText('<font color="#ef4444">' + message + '</font>')
  );

  builder.addSection(section);

  return builder.build();
}

/**
 * Analyze a file
 */
function analyzeFile(e) {
  const fileId = e.parameters.fileId;
  const fileName = e.parameters.fileName;
  const mimeType = e.parameters.mimeType;

  const session = getStoredSession();
  if (!session) {
    return createSignInCard();
  }

  try {
    // Get file content
    let fileBlob;

    if (mimeType === 'application/vnd.google-apps.document') {
      // Export Google Doc as PDF
      fileBlob = DriveApp.getFileById(fileId).getAs('application/pdf');
    } else {
      fileBlob = DriveApp.getFileById(fileId).getBlob();
    }

    // Upload to EasyTerms
    const uploadUrl = API_BASE + '/api/contracts/upload';

    const formData = {
      file: fileBlob,
      title: fileName.replace(/\.[^/.]+$/, '')
    };

    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + session.access_token
      },
      payload: formData,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(uploadUrl, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200 || response.getResponseCode() === 201) {
      // Show analyzing card
      return createAnalyzingCard(result.id, fileName);
    } else {
      return createErrorCard('Failed to upload: ' + (result.error || 'Unknown error'));
    }

  } catch (error) {
    Logger.log('Error analyzing file: ' + error.toString());
    return createErrorCard('Error: ' + error.toString());
  }
}

/**
 * Create analyzing progress card
 */
function createAnalyzingCard(contractId, fileName) {
  const builder = CardService.newCardBuilder();

  const header = CardService.newCardHeader()
    .setTitle('Analyzing Contract')
    .setSubtitle(fileName);

  builder.setHeader(header);

  const section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextParagraph()
      .setText('Your contract is being analyzed. This usually takes 30-60 seconds.')
  );

  section.addWidget(
    CardService.newImage()
      .setImageUrl('https://easyterms.vercel.app/analyzing.gif')
  );

  section.addWidget(
    CardService.newTextButton()
      .setText('View Analysis')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor('#a855f7')
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(API_BASE + '/dashboard/contracts/' + contractId)
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
      )
  );

  builder.addSection(section);

  return builder.build();
}

/**
 * Open contract in EasyTerms
 */
function openContract(e) {
  const contractId = e.parameters.contractId;

  return CardService.newActionResponseBuilder()
    .setOpenLink(
      CardService.newOpenLink()
        .setUrl(API_BASE + '/dashboard/contracts/' + contractId)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
    )
    .build();
}

/**
 * Sign out
 */
function signOut() {
  PropertiesService.getUserProperties().deleteProperty('easyterms_session');

  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation()
        .updateCard(createHomepageCard())
    )
    .build();
}

/**
 * Store session
 */
function storeSession(session) {
  PropertiesService.getUserProperties().setProperty('easyterms_session', JSON.stringify(session));
}

/**
 * Get stored session
 */
function getStoredSession() {
  const sessionStr = PropertiesService.getUserProperties().getProperty('easyterms_session');
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr);
  } catch (e) {
    return null;
  }
}

/**
 * Get recent contracts from EasyTerms API
 */
function getRecentContracts(session) {
  try {
    const response = UrlFetchApp.fetch(API_BASE + '/api/contracts?limit=5', {
      headers: {
        'Authorization': 'Bearer ' + session.access_token
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
  } catch (e) {
    Logger.log('Error fetching contracts: ' + e.toString());
  }

  return [];
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Web app doGet for OAuth callback
 */
function doGet(e) {
  const params = e.parameter;

  if (params.session) {
    // Store the session from OAuth callback
    try {
      const session = JSON.parse(decodeURIComponent(params.session));
      storeSession(session);

      return HtmlService.createHtmlOutput(
        '<html><body><script>window.close();</script>' +
        '<p>Signed in successfully! You can close this window.</p></body></html>'
      );
    } catch (err) {
      return HtmlService.createHtmlOutput('Error: ' + err.toString());
    }
  }

  return HtmlService.createHtmlOutput('EasyTerms Workspace Add-on');
}
