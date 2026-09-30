const { handleContactRequest } = require('../lib/contact-email');

module.exports = async function handler(req, res) {
  const result = await handleContactRequest({
    method: req.method,
    contentType: req.headers['content-type'],
    body: req.body,
  });
  if (result.allow) {
    res.setHeader('Allow', result.allow);
  }
  return res.status(result.statusCode).json(result.body);
};
