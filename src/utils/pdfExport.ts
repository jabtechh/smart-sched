// PDF Export utility using a lightweight approach
export interface PDFExportData {
  title: string;
  date: string;
  sections: PDFSection[];
  logo?: string; // Optional logo as data URL or image path
}

export interface PDFSection {
  heading: string;
  content: string | string[][];
  isHTML?: boolean;
}

export const exportToPDF = (data: PDFExportData) => {
  // Create a simple HTML document for PDF export
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${data.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; color: #333; }
          
          .header {
            background: linear-gradient(135deg, #065f46 0%, #047857 100%);
            color: white;
            padding: 30px 20px;
            margin-bottom: 30px;
            border-bottom: 4px solid #10b981;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          
          .header-logo {
            width: 60px;
            height: 60px;
            background: white;
            border-radius: 8px;
            padding: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .header-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 4px;
          }
          
          .header-text h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
          }
          
          .header-text p {
            margin: 5px 0 0 0;
            font-size: 13px;
            color: #d1fae5;
          }
          
          .header-right {
            text-align: right;
            font-size: 12px;
            color: #a7f3d0;
          }
          
          .content {
            margin: 0 20px 20px 20px;
          }
          
          h1 { color: #1f2937; margin-bottom: 10px; font-size: 22px; }
          .date { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section h2 { color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f3f4f6; padding: 10px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold; }
          td { padding: 10px; border: 1px solid #e5e7eb; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .stat-card { display: inline-block; margin-right: 20px; margin-bottom: 10px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .stat-label { color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <div class="header-logo">
              ${data.logo 
                ? `<img src="${data.logo}" style="width: 100%; height: 100%; border-radius: 8px; object-fit: contain;" alt="PTC Logo">`
                : `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2310b981'/%3E%3Ctext x='50' y='60' font-size='40' font-weight='bold' fill='white' text-anchor='middle'%3EPTC%3C/text%3E%3C/svg%3E" style="width: 100%; height: 100%; border-radius: 8px;" alt="PTC Logo">`
              }
            </div>
            <div class="header-text">
              <h1>SmartSched</h1>
              <p>PATEROS TECHNOLOGICAL COLLEGE</p>
            </div>
          </div>
          <div class="header-right">
            <div>Report Generated</div>
            <div style="font-weight: bold; margin-top: 4px;">${data.date}</div>
          </div>
        </div>
        
        <div class="content">
          <h1>${data.title}</h1>
          <div class="date">Generated on ${data.date}</div>
          ${data.sections.map(section => `
            <div class="section">
              <h2>${section.heading}</h2>
              ${
              section.isHTML
                ? section.content
                : Array.isArray(section.content)
                ? `
                  <table>
                    <thead>
                      <tr>${section.content[0].map(cell => `<th>${cell}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                      ${section.content.slice(1).map(row => `
                        <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
                      `).join('')}
                    </tbody>
                  </table>
                `
                : `<p>${section.content}</p>`
            }
          </div>
        `).join('')}
        </div>
      </body>
    </html>
  `;

  // Create and trigger download
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
  element.setAttribute('download', `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
