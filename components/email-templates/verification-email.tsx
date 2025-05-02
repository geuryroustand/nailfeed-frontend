export function VerificationEmailTemplate({
  username,
  verificationCode,
  verificationLink,
}: {
  username: string
  verificationCode: string
  verificationLink: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #ec4899;
        }
        .content {
          padding: 30px 20px;
        }
        .verification-code {
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 4px;
          text-align: center;
          margin: 30px 0;
          color: #333;
        }
        .button {
          display: block;
          width: 200px;
          margin: 30px auto;
          padding: 12px 20px;
          background: linear-gradient(to right, #ec4899, #8b5cf6);
          color: white;
          text-decoration: none;
          text-align: center;
          border-radius: 50px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #888;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">NailFeed</div>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Hi ${username},</p>
          <p>Thanks for signing up for NailFeed! Please verify your email address to complete your registration.</p>
          
          <p>Your verification code is:</p>
          <div class="verification-code">${verificationCode}</div>
          
          <p>Enter this code on the verification page, or click the button below to verify directly:</p>
          
          <a href="${verificationLink}" class="button">Verify Email</a>
          
          <p>If you didn't create an account with NailFeed, you can safely ignore this email.</p>
          
          <p>Best,<br>The NailFeed Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2023 NailFeed. All rights reserved.</p>
          <p>123 Nail Art Street, Beauty City, BC 12345</p>
        </div>
      </div>
    </body>
    </html>
  `
}
