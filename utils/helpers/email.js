const mailgun = require('mailgun-js');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const { EMAIL_DOMAIN, EMAIL_TEMPLATES } = require('../constants/constant');
const { MAIL_GUN_API_KEY, GMAIL_ID, GMAIL_PASS } = require('../constants/envConstants');
const { handleAppError } = require('./error');

const mg = mailgun({ apiKey: MAIL_GUN_API_KEY, domain: EMAIL_DOMAIN });

const sendEmailTemplateViaMailgun = async ({ to, subject, template, variables }) => {
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
    err.socpe = err.scope || 'sendEmailTemplateViaMailgun';
    handleAppError({ err, scope: 'sendEmailTemplateViaMailgun' });
  }
};

const Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_ID,
    pass: GMAIL_PASS,
  },
});

const sendMailViaGmail = async ({ to, subject, text, html, templateName, variables = {} }) => {
  try {
    let htmlToSend = html;

    let mailOptions = {
      from: 'Review Chacha <support@reviewchacha.com>',
      to: to,
      subject: subject,
      text: text,
      html: htmlToSend,
    };

    if (templateName) {
      let source = fs.readFileSync(`utils/constants/${templateName}`, 'utf-8');
      const template = handlebars.compile(source);
      htmlToSend = template(variables);
      mailOptions.html = htmlToSend;
      delete mailOptions.text;
    }

    Transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        throw err;
      }
      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });
  } catch (err) {
    err.scope = err.scope || 'sendMailViaGmail';
    handleAppError({ err });
  }
};

module.exports = {
  sendEmailTemplateViaMailgun,
  sendMailViaGmail,
};
