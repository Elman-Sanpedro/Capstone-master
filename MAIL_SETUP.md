# Mail Configuration for Password Reset

## Overview
The forgot password feature requires email configuration to send password reset links to users. By default, Laravel is configured to log emails instead of sending them.

## Current Status
- ✅ User email updated: `harrismanabat0` → `harrismanabat3@gmail.com`
- ✅ Mail configuration updated to use SMTP by default
- ⚠️ .env file needs to be configured with actual SMTP credentials

## Setup Instructions

### Option 1: Gmail SMTP (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Update your .env file** with these settings:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=harrismanabat3@gmail.com
MAIL_PASSWORD=your-16-character-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@mejeckiceplant.com
MAIL_FROM_NAME="Mejeck IcePlant"
```

4. **Clear config cache**:
```bash
php artisan config:clear
php artisan cache:clear
```

### Option 2: Use Log Driver (Development Only)

If you want to test without sending real emails, use the log driver:

```env
MAIL_MAILER=log
```

Emails will be logged to `storage/logs/laravel.log` instead of being sent.

### Option 3: Other SMTP Providers

You can use any SMTP provider (SendGrid, Mailgun, Amazon SES, etc.):

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@mejeckiceplant.com
MAIL_FROM_NAME="Mejeck IcePlant"
```

## Testing the Forgot Password Feature

1. Go to `/forgot-password`
2. Enter username: `harrismanabat0` or email: `harrismanabat3@gmail.com`
3. Click "Send Reset Link"
4. Check your email (or log file if using log driver)
5. Click the reset link in the email
6. Enter your new password
7. Login with your new password

## Troubleshooting

### Emails not being sent:
- Check that MAIL_MAILER is set to `smtp` in .env
- Verify SMTP credentials are correct
- Check if your email provider requires app passwords
- Review `storage/logs/laravel.log` for errors

### Reset link not working:
- Ensure the APP_URL in .env matches your actual application URL
- Check that the token in the email matches the database
- Verify the reset link hasn't expired (tokens expire after 1 hour by default)

### Connection errors:
- Verify firewall allows SMTP connections
- Check if port 587 (TLS) or 465 (SSL) is blocked
- Try different encryption settings (tls, ssl, or null)

## Security Notes

- Never commit your .env file to version control
- Use app-specific passwords for Gmail, not your main password
- Consider using environment-specific mail configurations
- Rotate email passwords regularly
- Use a dedicated "noreply" email address for system emails
