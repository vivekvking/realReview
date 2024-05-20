const mailgun = require('mailgun-js');
const { EMAIL_DOMAIN, EMAIL_TEMPLATES } = require('../constants/constant');
const { MAIL_GUN_API_KEY } = require('../constants/envConstants');
const { handleAppError } = require('./error');

const mg = mailgun({ apiKey: MAIL_GUN_API_KEY, domain: EMAIL_DOMAIN });

const sendEmailTemplate = async ({ to, subject, template, variables }) => {
  try {
    const data = {
      from: 'Review Chacha <support@reviewchacha.com>',
      to: to,
      subject: subject,
      template: template,
      'h:X-Mailgun-Variables': JSON.stringify(variables),
    };
    mg.messages().send(data, function (error, body) {
      console.log(body);
    });
  } catch (err) {
    handleAppError({ err, scope: 'sendEmailTemplate' });
  }
};

module.exports = {
  sendEmailTemplate,
};
