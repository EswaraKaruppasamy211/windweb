const { handleContactRequest } = require('../../lib/contact-email');

exports.handler = async event => {
  const headers = event.headers || {};
  const result = await handleContactRequest({
    method: event.httpMethod,
    contentType: headers['content-type'] || headers['Content-Type'],
    body: event.body,
  });

  return {
    statusCode: result.statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...(result.allow ? { Allow: result.allow } : {}),
    },
    body: JSON.stringify(result.body),
  };
};
