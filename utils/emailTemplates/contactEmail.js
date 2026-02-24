exports.contactEmail = `<!DOCTYPE html>
    <html>
<head>
    <meta charset="UTF-8">
    <title>New Contact Form Submission</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #02aba8;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 4px 4px 0 0;
        }
        .content {
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 4px 4px;
        }
        .detail-row {
            margin-bottom: 15px;
        }
        .detail-label {
            font-weight: bold;
            color: #555;
            display: block;
            margin-bottom: 5px;
        }
        .footer {
            margin-top: 30px;
            font-size: 0.9em;
            color: #777;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>New Portfolio Contact</h1>
    </div>
    
    <div class="content">
        <div class="detail-row">
            <span class="detail-label">From:</span>
            {{name}} &lt;{{email}}&gt;
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Subject:</span>
            {{subject}}
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Inquiry Type:</span>
            {{inquiryType}}
        </div>
        
        <div class="detail-row">
            <span class="detail-label">Message:</span>
            <div style="white-space: pre-line; margin-top: 10px;">{{message}}</div>
        </div>
    </div>
    
    <div class="footer">
        <p>This message was sent from your portfolio contact form at {{timestamp}}</p>
        <p>IP Address: {{ipAddress}}</p>
    </div>
</body>
</html>`
