const { Resend } = require('resend');

const FIELD_LABELS = {
  company_name: 'Company Name',
  registered_address: 'Registered Office Address',
  factory_address: 'Factory / Project Address',
  cin_number: 'CIN Number',
  gst_number: 'GST Number',
  contact_person: 'Contact Person',
  designation: 'Designation',
  mobile_number: 'Mobile Number',
  email_address: 'Email Address',
  pan_number: 'PAN Number',
  project_name: 'Project Name',
  project_location: 'Project Location',
  industry_sector: 'Industry / Sector',
  total_project_cost: 'Total Project Cost (₹)',
  promoter_equity: 'Promoter Equity (₹)',
  term_loan_requested: 'Term Loan Requested (₹)',
  loan_purpose: 'Loan Purpose',
  loan_tenure: 'Loan Tenure',
  repayment_mode: 'Repayment Mode',
  expected_start_date: 'Expected Start Date',
  expected_completion_date: 'Expected Completion Date',
  project_description: 'Brief Project Description',
  turnover_year_1: 'Turnover Year 1 (₹)',
  turnover_year_2: 'Turnover Year 2 (₹)',
  turnover_year_3: 'Turnover Year 3 (₹)',
  net_profit_year_1: 'Net Profit Year 1 (₹)',
  net_profit_year_2: 'Net Profit Year 2 (₹)',
  net_profit_year_3: 'Net Profit Year 3 (₹)',
  existing_bank_loans: 'Existing Bank Loans (₹)',
  lending_institution: 'Lending Institution',
  cibil_score: 'CIBIL Score',
  security_type: 'Type of Security',
  security_market_value: 'Market Value of Security (₹)',
  guarantor_name: 'Guarantor Name',
  documents_checklist: 'Documents Checklist',
  declaration_place: 'Place',
  declaration_date: 'Date',
  authorised_signatory: 'Authorised Signatory',
};

const REQUIRED_FIELDS = [
  'company_name',
  'registered_address',
  'cin_number',
  'gst_number',
  'contact_person',
  'mobile_number',
  'email_address',
  'pan_number',
  'industry_sector',
  'total_project_cost',
  'term_loan_requested',
  'loan_purpose',
  'loan_tenure',
  'security_type',
  'security_market_value',
];

const NUMERIC_FIELDS = [
  'total_project_cost',
  'promoter_equity',
  'term_loan_requested',
  'turnover_year_1',
  'turnover_year_2',
  'turnover_year_3',
  'net_profit_year_1',
  'net_profit_year_2',
  'net_profit_year_3',
  'existing_bank_loans',
  'cibil_score',
  'security_market_value',
];

const MAX_BODY_BYTES = 50_000;
const MAX_FIELD_LENGTH = 10_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function parseApplication(body) {
  let parsedBody = body;
  if (typeof body === 'string') {
    parsedBody = JSON.parse(body);
  }
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    throw new TypeError('Invalid request body');
  }
  return parsedBody;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      message: 'Unable to submit the loan application.',
    });
  }

  const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    return res.status(415).json({
      success: false,
      message: 'Unable to submit the loan application.',
    });
  }

  let submitted;
  try {
    if (Buffer.byteLength(typeof req.body === 'string' ? req.body : JSON.stringify(req.body) || '') > MAX_BODY_BYTES) {
      return res.status(413).json({
        success: false,
        message: 'Unable to submit the loan application.',
      });
    }
    submitted = parseApplication(req.body);
  } catch {
    return res.status(400).json({
      success: false,
      message: 'Unable to submit the loan application.',
    });
  }

  const application = {};
  for (const [field, value] of Object.entries(submitted)) {
    if (!Object.hasOwn(FIELD_LABELS, field)) continue;
    if (typeof value !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Unable to submit the loan application.',
      });
    }
    const sanitized = value
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim();
    if (sanitized.length > MAX_FIELD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: 'Unable to submit the loan application.',
      });
    }
    application[field] = sanitized;
  }

  if (REQUIRED_FIELDS.some(field => !application[field])) {
    return res.status(400).json({
      success: false,
      message: 'Unable to submit the loan application.',
    });
  }

  if (!EMAIL_PATTERN.test(application.email_address)) {
    return res.status(400).json({
      success: false,
      message: 'Unable to submit the loan application.',
    });
  }

  if (NUMERIC_FIELDS.some(field => application[field] && !Number.isFinite(Number(application[field])))) {
    return res.status(400).json({
      success: false,
      message: 'Unable to submit the loan application.',
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.LOAN_RECEIVER_EMAIL;
  if (!apiKey || !recipient || !EMAIL_PATTERN.test(recipient)) {
    console.error('Loan email configuration is incomplete.');
    return res.status(500).json({
      success: false,
      message: 'Unable to submit the loan application.',
    });
  }

  const emailFields = Object.keys(FIELD_LABELS).map(field => [field, application[field] || '']);
  const rows = emailFields.map(([field, value]) => (
    `<tr><th>${escapeHtml(FIELD_LABELS[field])}</th><td style="white-space:pre-wrap">${escapeHtml(value || '—')}</td></tr>`
  )).join('');
  const text = emailFields
    .map(([field, value]) => `${FIELD_LABELS[field]}: ${value || '—'}`)
    .join('\n');

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.LOAN_SENDER_EMAIL || 'WindWeb <onboarding@resend.dev>',
      to: recipient,
      replyTo: application.email_address,
      subject: 'New Loan Application - WindWeb',
      html: `<h1>New Loan Application</h1><table style="border-collapse:collapse;text-align:left" cellpadding="8" border="1"><tbody>${rows}</tbody></table>`,
      text: `New Loan Application\n\n${text}`,
    });
    if (error) {
      console.error('Resend could not send the loan application email.');
      return res.status(502).json({
        success: false,
        message: 'Unable to submit the loan application.',
      });
    }
  } catch {
    console.error('Loan application email delivery failed.');
    return res.status(500).json({
      success: false,
      message: 'Unable to submit the loan application.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Loan application submitted successfully.',
  });
};
