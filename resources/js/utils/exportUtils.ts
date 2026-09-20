// Export utilities for admin reports

export interface ExportData {
    movingProducts: any[];
    nonMovingProducts: any[];
    filters: {
        category: string;
        days: number | string;
        start_date?: string;
        end_date?: string;
    };
}

// CSV Export Function
export const exportToCSV = (data: ExportData, reportType: 'moving' | 'nonMoving' | 'both') => {
    let csvContent = '';
    let filename = '';

    if (reportType === 'moving' || reportType === 'both') {
        // Moving Products CSV
        csvContent += 'MOVING PRODUCTS REPORT\n';
        csvContent += `Generated: ${new Date().toLocaleString()}\n`;
        csvContent += `Filter: ${data.filters.category === 'all' ? 'All Categories' : data.filters.category} | `;
        csvContent += `Period: ${getPeriodDescription(data.filters)}\n\n`;
        
        csvContent += 'Product Name,Category,Price,Total Sold,Total Revenue,Order Count,Last Sale Date\n';
        
        data.movingProducts.forEach(product => {
            csvContent += `"${product.product_name}","${product.category_name}",${product.price},${product.total_sold},${product.total_revenue},${product.order_count},"${product.last_sale_date}"\n`;
        });
        
        csvContent += '\n\n';
    }

    if (reportType === 'nonMoving' || reportType === 'both') {
        // Non-Moving Products CSV
        csvContent += 'NON-MOVING PRODUCTS REPORT\n';
        csvContent += `Generated: ${new Date().toLocaleString()}\n`;
        csvContent += `Filter: ${data.filters.category === 'all' ? 'All Categories' : data.filters.category} | `;
        csvContent += `Period: ${getPeriodDescription(data.filters)}\n\n`;
        
        csvContent += 'Product Name,Category,Price,Current Quantity,Min Stock Level,Total Sold,Product Added Date\n';
        
        data.nonMovingProducts.forEach(product => {
            csvContent += `"${product.product_name}","${product.category_name}",${product.price},${product.current_quantity},${product.min_stock_level},${product.total_sold},"${product.product_added_date}"\n`;
        });
    }

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const category = data.filters.category === 'all' ? 'all' : data.filters.category;
    const period = getPeriodDescription(data.filters).replace(/[^a-zA-Z0-9]/g, '_');
    
    if (reportType === 'moving') {
        filename = `moving_products_${category}_${period}_${date}.csv`;
    } else if (reportType === 'nonMoving') {
        filename = `non_moving_products_${category}_${period}_${date}.csv`;
    } else {
        filename = `products_report_${category}_${period}_${date}.csv`;
    }

    // Download CSV
    downloadCSV(csvContent, filename);
};

// PDF Export Function (using browser print)
export const exportToPDF = (data: ExportData, reportType: 'moving' | 'nonMoving' | 'both') => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups for this website to use PDF export');
        return;
    }

    const htmlContent = generatePDFHTML(data, reportType);
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };
};

// Helper function to download CSV
const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Helper function to get period description
const getPeriodDescription = (filters: ExportData['filters']): string => {
    if (filters.days === 'custom' && filters.start_date && filters.end_date) {
        return `${filters.start_date} to ${filters.end_date}`;
    }
    
    const days = Number(filters.days);
    if (days === 1) return 'Last 1 Day';
    if (days === 2) return 'Last 2 Days';
    if (days === 7) return 'Last 7 Days';
    if (days === 14) return 'Last 14 Days';
    if (days === 30) return 'Last 30 Days';
    if (days === 90) return 'Last 90 Days';
    
    return `Last ${days} Days`;
};

// Generate HTML for PDF printing
const generatePDFHTML = (data: ExportData, reportType: 'moving' | 'nonMoving' | 'both'): string => {
    const date = new Date().toLocaleString();
    const category = data.filters.category === 'all' ? 'All Categories' : data.filters.category;
    const period = getPeriodDescription(data.filters);
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Products Report - Mejeck Ice Plant</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #333;
                line-height: 1.4;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            .header h1 { 
                margin: 0; 
                color: #333; 
                font-size: 24px;
            }
            .header p { 
                margin: 5px 0; 
                color: #666;
                font-size: 14px;
            }
            .section { 
                margin-bottom: 30px; 
                page-break-inside: avoid;
            }
            .section h2 { 
                color: #333; 
                border-bottom: 1px solid #ccc;
                padding-bottom: 10px;
                margin-bottom: 15px;
                font-size: 18px;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px;
            }
            th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
                font-size: 12px;
            }
            th { 
                background-color: #f5f5f5; 
                font-weight: bold;
            }
            .summary { 
                background-color: #f9f9f9; 
                padding: 15px; 
                border-radius: 5px; 
                margin-bottom: 20px;
            }
            .summary-item {
                display: inline-block;
                margin-right: 30px;
                margin-bottom: 10px;
            }
            .summary-label {
                font-weight: bold;
                color: #666;
            }
            .summary-value {
                color: #333;
                font-size: 16px;
            }
            @media print {
                body { margin: 10px; }
                .section { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Mejeck Ice Plant - Products Report</h1>
            <p><strong>Generated:</strong> ${date}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Period:</strong> ${period}</p>
        </div>
    `;

    if (reportType === 'moving' || reportType === 'both') {
        const totalRevenue = data.movingProducts.reduce((sum, p) => sum + Number(p.total_revenue), 0);
        const totalSold = data.movingProducts.reduce((sum, p) => sum + Number(p.total_sold), 0);
        
        html += `
        <div class="section">
            <h2>Moving Products Report</h2>
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-label">Total Products:</div>
                    <div class="summary-value">${data.movingProducts.length}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Revenue:</div>
                    <div class="summary-value">₱${totalRevenue.toFixed(2)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Units Sold:</div>
                    <div class="summary-value">${totalSold}</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Total Sold</th>
                        <th>Total Revenue</th>
                        <th>Order Count</th>
                        <th>Last Sale Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.movingProducts.forEach(product => {
            html += `
                <tr>
                    <td>${product.product_name}</td>
                    <td>${product.category_name}</td>
                    <td>₱${product.price}</td>
                    <td>${product.total_sold}</td>
                    <td>₱${product.total_revenue}</td>
                    <td>${product.order_count}</td>
                    <td>${product.last_sale_date}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        </div>
        `;
    }

    if (reportType === 'nonMoving' || reportType === 'both') {
        const totalStockValue = data.nonMovingProducts.reduce((sum, p) => sum + (p.price * p.current_quantity), 0);
        const totalStock = data.nonMovingProducts.reduce((sum, p) => sum + Number(p.current_quantity), 0);
        
        html += `
        <div class="section">
            <h2>Non-Moving Products Report</h2>
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-label">Total Products:</div>
                    <div class="summary-value">${data.nonMovingProducts.length}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Stock Value:</div>
                    <div class="summary-value">₱${totalStockValue.toFixed(2)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Total Units in Stock:</div>
                    <div class="summary-value">${totalStock}</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Current Quantity</th>
                        <th>Min Stock Level</th>
                        <th>Total Sold</th>
                        <th>Product Added Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        data.nonMovingProducts.forEach(product => {
            html += `
                <tr>
                    <td>${product.product_name}</td>
                    <td>${product.category_name}</td>
                    <td>₱${product.price}</td>
                    <td>${product.current_quantity}</td>
                    <td>${product.min_stock_level}</td>
                    <td>${product.total_sold}</td>
                    <td>${product.product_added_date}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        </div>
        `;
    }

    html += `
    </body>
    </html>
    `;

    return html;
};
