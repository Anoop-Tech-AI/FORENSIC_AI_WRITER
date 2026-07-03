const nodemailer = require('nodemailer');

// Create a persistent transporter for better performance
let transporter = null;

// Initialize transporter with proper configuration
const initializeTransporter = () => {
    if (transporter) {
        return transporter;
    }

    // Remove spaces from App Password (Google shows it with spaces but SMTP needs it without)
    const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    const emailUser = (process.env.EMAIL_USER || '').trim();

    if (!emailUser || !emailPass) {
        throw new Error('EMAIL_USER or EMAIL_PASS is missing in environment variables.');
    }

    console.log('Initializing email transporter for user:', emailUser);

    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        tls: {
            rejectUnauthorized: false, // Avoid TLS certificate errors in development
        },
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000, // Rate limiting: 1 message per second
        rateLimit: 5, // Maximum 5 messages per rateDelta
    });

    return transporter;
};

// Send OTP email with comprehensive error handling
const sendOTPEmail = async (email, otp) => {
    console.log('Attempting to send OTP email to:', email);

    try {
        // Initialize transporter
        const emailTransporter = initializeTransporter();

        // Verify connection
        await emailTransporter.verify();
        console.log('Email transporter connection verified');

        const mailOptions = {
            from: `"Forensic Writer Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Verification Code - Forensic Writer',
            text: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.\n\n© 2026 Forensic Writer - Internal Use Only`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forensic Writer Verification</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; }
        .otp-code { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-number { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
        .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
        .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Forensic Writer</h1>
            <p>Secure Verification System</p>
        </div>
        <div class="content">
            <h2>Email Verification Required</h2>
            <p>Hello,</p>
            <p>You're receiving this email because someone (hopefully you) tried to register an account with Forensic Writer. To complete your registration, please use the verification code below:</p>
            
            <div class="otp-code">
                <div class="otp-number">${otp}</div>
                <p><strong>This code expires in 10 minutes</strong></p>
            </div>
            
            <div class="security-notice">
                <strong>🛡️ Security Notice:</strong><br>
                • Never share this code with anyone<br>
                • We will never ask for your password via email<br>
                • This code can only be used once
            </div>
            
            <p>If you did not request this verification code, please ignore this email. Your account remains secure.</p>
            
            <p>Need help? Contact our security team at support@forensic-writer.com</p>
        </div>
        <div class="footer">
            <p>© 2026 Forensic Writer - Internal Use Only</p>
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
            `,
        };

        // Send email
        const result = await emailTransporter.sendMail(mailOptions);
        console.log('OTP email sent successfully:', result.messageId);
        
        return {
            success: true,
            messageId: result.messageId,
            response: result.response
        };

    } catch (error) {
        console.error('Failed to send OTP email:', error.message);
        
        // Handle specific error types
        if (error.code === 'EAUTH') {
            throw new Error('Email authentication failed. Check EMAIL_USER and EMAIL_PASS.');
        }
        
        if (error.code === 'ECONNECTION') {
            throw new Error('Failed to connect to email server. Please try again later.');
        }
        
        if (error.code === 'EMESSAGE') {
            throw new Error('Message rejected by email server.');
        }
        
        // Generic error
        throw new Error(`Email sending failed: ${error.message}`);
    }
};

// Test email configuration
const testEmailConfig = async () => {
    try {
        const transporter = initializeTransporter();
        await transporter.verify();
        console.log('✅ Email configuration is valid');
        return true;
    } catch (error) {
        console.error('❌ Email configuration test failed:', error.message);
        return false;
    }
};

// Send welcome email (optional feature)
const sendWelcomeEmail = async (email, username) => {
    try {
        const transporter = initializeTransporter();
        
        const mailOptions = {
            from: `"Forensic Writer Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to Forensic Writer! 🎉',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                <h2 style="color: #2563eb;">Welcome to Forensic Writer, ${username}!</h2>
                <p>Your account has been successfully verified and is ready to use.</p>
                <p>You can now log in and start using the forensic analysis platform.</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Next Steps:</h3>
                    <ul>
                        <li>Log in to your account</li>
                        <li>Complete your profile setup</li>
                        <li>Explore the dashboard features</li>
                    </ul>
                </div>
                <p>Thank you for choosing Forensic Writer!</p>
            </div>
            `,
        };
        
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent to:', email);
    } catch (error) {
        console.error('Failed to send welcome email:', error.message);
        // Don't throw error for welcome email
    }
};

module.exports = { 
    sendOTPEmail, 
    testEmailConfig,
    sendWelcomeEmail 
};
