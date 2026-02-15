# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Disclose Publicly
Please do not create a public GitHub issue for security vulnerabilities.

### 2. Report Privately
Send details to: **security@kapilla-logistics.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Timeline
- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: Best effort

### 4. Disclosure Policy
- We will acknowledge your report within 48 hours
- We will provide regular updates on our progress
- We will notify you when the vulnerability is fixed
- We will publicly disclose the vulnerability after a fix is released
- We will credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### For Developers
- Never commit sensitive data (API keys, passwords, etc.)
- Use environment variables for configuration
- Keep dependencies up to date
- Follow secure coding practices
- Run security audits regularly: `npm audit`

### For Deployments
- Use HTTPS in production
- Enable rate limiting
- Implement proper authentication
- Use secure session management
- Enable CORS properly
- Keep database credentials secure
- Use prepared statements for SQL queries
- Implement proper input validation
- Enable security headers
- Regular security audits

### For Users
- Use strong passwords
- Enable two-factor authentication (when available)
- Keep your account information up to date
- Report suspicious activity immediately
- Log out from shared devices

## Known Security Features

- ✅ Password hashing with bcrypt
- ✅ Rate limiting on authentication endpoints
- ✅ CSRF protection
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection
- ✅ Audit logging
- ✅ Session management

## Security Updates

Subscribe to security advisories:
- Watch this repository for security updates
- Check our changelog for security patches
- Follow our security mailing list

## Bug Bounty Program

We currently do not have a bug bounty program, but we greatly appreciate responsible disclosure and will acknowledge contributors in our security advisories.

## Contact

For security concerns: **security@kapilla-logistics.com**

For general questions: **support@kapilla-logistics.com**

---

Thank you for helping keep Kapilla Logistics secure! 🔒
