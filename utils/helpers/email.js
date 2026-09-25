const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const { GMAIL_ID, GMAIL_PASS } = require('../constants/envConstants');
const { handleAppError } = require('./error');

const Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_ID,
    pass: GMAIL_PASS,
  },
});

const sendMailViaGmail = async ({ to, subject, text, html, templateName, variables = {} }) => {
  try {
    if (!GMAIL_ID || !GMAIL_PASS) {
      console.log(`[email] no credentials configured - skipping mail to ${to} ("${subject}")`);
      return;
    }

    let htmlToSend = html;

    let mailOptions = {
      from: 'Review Chacha <support@reviewchacha.com>',
      to: to,
      subject: subject,
      text: text,
      html: htmlToSend,
    };

    if (templateName) {
      //? resolved against this file, not process.cwd() - the relative path here
      //? only worked when the server happened to be started from the repo root
      let source = fs.readFileSync(path.join(__dirname, '..', 'constants', templateName), 'utf-8');
      const template = handlebars.compile(source);
      htmlToSend = template(variables);
      mailOptions.html = htmlToSend;
      delete mailOptions.text;
    }

    const info = await Transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
  } catch (err) {
    err.scope = err.scope || 'sendMailViaGmail';
    handleAppError({ err });
  }
};

module.exports = {
  sendMailViaGmail,
};
