export function PasswordResetEmailTemplate({
  username,
  resetLink,
}: {
  username: string
  resetLink: string
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
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
        .warning {
          background-color: #fff8e1;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          border-left: 4px solid #ffc107;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">NailFeed</div>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hi ${username},</p>
          <p>We received a request to reset your password for your NailFeed account. Click the button below to reset your password:</p>
          
          <a href="${resetLink}" class="button">Reset Password</a>
          
          <div class="warning">
            <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
          </div>
          
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          
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
