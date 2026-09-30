const { Resend } = require('resend');

const REQUIRED_FIELDS = ['name', 'email', 'enquiry_subject', 'message'];
const ALLOWED_SUBJECTS = [
  'Investment Enquiry',
  'Loan Application',
  'Partnership',
  'Technical Query',
  'General Enquiry',
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 12_000;
const MAX_FIELD_LENGTH = 4_000;

function jsonResult(statusCode, body, allow) {
  return { statusCode, body, ...(allow ? { allow } : {}) };
}

function failure(statusCode) {
  return jsonResult(statusCode, {
    success: false,
    message: 'Unable to submit the contact message.',
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function parseMessage(body) {
  const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    throw new TypeError('Invalid request body');
  }
  return parsedBody;
}

async function handleContactRequest({ method, contentType, body }) {
  if (method !== 'POST') {
    return jsonResult(405, {
      success: false,
      message: 'Unable to submit the contact message.',
    }, 'POST');
  }

  if ((contentType || '').split(';')[0].trim().toLowerCase() !== 'application/json') {
    return failure(415);
  }

  let submitted;
  try {
    const bodyLength = Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body) || '');
    if (bodyLength > MAX_BODY_BYTES) return failure(413);
    submitted = parseMessage(body);
  } catch {
    return failure(400);
  }

  if (typeof submitted['bot-field'] === 'string' && submitted['bot-field'].trim()) {
    return jsonResult(200, {
      success: true,
      message: 'Your message was submitted successfully. Thank you for contacting us.',
    });
  }

  const message = {};
  for (const field of [...REQUIRED_FIELDS, 'phone']) {
    const value = submitted[field] ?? '';
    if (typeof value !== 'string') return failure(400);
    message[field] = value
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim();
    if (message[field].length > MAX_FIELD_LENGTH) return failure(400);
  }

  if (
    REQUIRED_FIELDS.some(field => !message[field])
    || !EMAIL_PATTERN.test(message.email)
    || !ALLOWED_SUBJECTS.includes(message.enquiry_subject)
  ) {
    return failure(400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_RECEIVER_EMAIL;
  if (!apiKey || !recipient || !EMAIL_PATTERN.test(recipient)) {
    console.error('Contact email configuration is incomplete.');
    return failure(500);
  }

  const fields = [
    ['Full Name', message.name],
    ['Email Address', message.email],
    ['Phone Number', message.phone || '—'],
    ['Subject', message.enquiry_subject],
    ['Message', message.message],
  ];
  const rows = fields.map(([label, value]) => (
    `<tr><th>${escapeHtml(label)}</th><td style="white-space:pre-wrap">${escapeHtml(value)}</td></tr>`
  )).join('');
  const text = fields.map(([label, value]) => `${label}: ${value}`).join('\n');

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_SENDER_EMAIL || 'WindWeb Contact <onboarding@resend.dev>',
      to: recipient,
      replyTo: message.email,
      subject: `WindWeb Contact: ${message.enquiry_subject}`,
      html: `<h1>New WindWeb Contact Message</h1><table style="border-collapse:collapse;text-align:left" cellpadding="8" border="1"><tbody>${rows}</tbody></table>`,
      text: `New WindWeb Contact Message\n\n${text}`,
    });
    if (error) {
      console.error('Resend could not send the contact message email.');
      return failure(502);
    }
  } catch {
    console.error('Contact message email delivery failed.');
    return failure(500);
  }

  return jsonResult(200, {
    success: true,
    message: 'Your message was submitted successfully. Thank you for contacting us.',
  });
}

module.exports = { handleContactRequest };
