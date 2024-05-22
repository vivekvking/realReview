const EMAIL_DOMAIN = 'reviewchacha.com';

const EMAIL_TEMPLATES = {
  email_verification: {
    name: 'email verification',
    description: 'email sent during signup for email verification',
    variables: ['username', 'verifyEmailRedirectUrl'],
  },
  forgot_password: {},
  interaction_with_your_post: {},
};

const NODEMAILER_EMAIL_TEMPLATES = {
  email_verification: {
    name: 'email-verification.html',
    variables: ['username', 'redirectUrl'],
  },
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg', 'video/quicktime'];

module.exports = {
  EMAIL_DOMAIN,
  EMAIL_TEMPLATES,
  ALLOWED_MIME_TYPES,
  NODEMAILER_EMAIL_TEMPLATES,
};
