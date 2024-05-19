const EMAIL_DOMAIN = 'reviewchacha.com'

const EMAIL_TEMPLATES = {
  email_verification : {
    name: 'email verification',
    description: 'email sent during signup for email verification',
    variables: ["username", "verifyEmailRedirectUrl"]
  },
  forgot_password : {},
  interaction_with_your_post : {},
}

module.exports = {
  EMAIL_DOMAIN,
  EMAIL_TEMPLATES,
};
