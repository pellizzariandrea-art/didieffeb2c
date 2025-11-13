// Email template wrapper with logo and company info

import { CompanyInfo } from '@/types/settings';

export interface EmailWrapperOptions {
  logo?: {
    base64: string;
    type: string;
  } | null;
  company: CompanyInfo;
  content: string;
  preheader?: string;
}

/**
 * Wrap email content with branded header and footer
 */
export function wrapEmailContent(options: EmailWrapperOptions): string {
  const { logo, company, content, preheader } = options;

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  ${preheader ? `<meta name="description" content="${preheader}">` : ''}
  <title>${company.name}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f4f4f4;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #ffffff;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 3px solid #16a34a;
    }
    .header img {
      max-width: 200px;
      height: auto;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    .content p {
      margin: 0 0 15px 0;
    }
    .content a {
      color: #16a34a;
      text-decoration: none;
    }
    .content a:hover {
      text-decoration: underline;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      margin: 20px 0;
      background-color: #16a34a;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .button:hover {
      background-color: #15803d;
      text-decoration: none !important;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 30px 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
      border-top: 1px solid #e5e5e5;
    }
    .footer p {
      margin: 5px 0;
    }
    .footer a {
      color: #16a34a;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px !important;
      }
      .header {
        padding: 20px 15px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with Logo -->
    <div class="header">
      ${logo ? `
        <img src="${logo.base64}" alt="${company.name}" />
      ` : `
        <h1 style="margin: 0; font-size: 28px; color: #16a34a;">${company.name}</h1>
      `}
    </div>

    <!-- Main Content -->
    <div class="content">
      ${content}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>${company.name}</strong></p>
      ${company.address ? `<p>${company.address}, ${company.postalCode} ${company.city} (${company.province})</p>` : ''}
      <p>
        ${company.phone ? `Tel: ${company.phone}` : ''}
        ${company.phone && company.email ? ' | ' : ''}
        ${company.email ? `<a href="mailto:${company.email}">${company.email}</a>` : ''}
      </p>
      ${company.website ? `<p><a href="${company.website}">${company.website}</a></p>` : ''}
      ${company.vatNumber ? `<p>P.IVA: ${company.vatNumber}</p>` : ''}
      <p style="margin-top: 15px; font-size: 11px; color: #999999;">
        Questa è un'email automatica, si prega di non rispondere a questo indirizzo.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
