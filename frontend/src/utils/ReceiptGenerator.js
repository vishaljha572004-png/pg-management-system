import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

export const generateReceipt = (paymentDetails, pgName = "PG Management System") => {
  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(pgName, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Official Payment Receipt", 105, 30, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(14, 35, 196, 35);
    
    // Receipt Info
    doc.setFontSize(10);
    const receiptNo = paymentDetails.receipt_number || `REC-${paymentDetails.type.toUpperCase()}-${paymentDetails.id}-${new Date().getTime().toString().slice(-4)}`;
    doc.text(`Receipt No: ${receiptNo}`, 14, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 52);
    
    // Payment Details box
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 60, 182, 45, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text("Transaction Details", 18, 67);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Student Name: ${paymentDetails.student_name || 'N/A'}`, 18, 75);
    doc.text(`Room Number: ${paymentDetails.room_number || 'N/A'}`, 100, 75);
    doc.text(`Mobile Number: ${paymentDetails.phone || 'N/A'}`, 18, 82);
    
    doc.text(`Payment Type: ${paymentDetails.type === 'rent' ? 'Monthly Rent' : 'Electricity Bill'}`, 18, 89);
    doc.text(`Billing Month: ${paymentDetails.billing_month}`, 100, 89);
    
    doc.text(`Transaction ID (UTR): ${paymentDetails.transaction_id || 'N/A'}`, 18, 96);
    doc.text(`Payment Status: PAID`, 100, 96);
    
    // Amount Table
    doc.autoTable({
      startY: 110,
      head: [['Description', 'Amount']],
      body: [
        [`${paymentDetails.type === 'rent' ? 'Rent' : 'Electricity'} for ${paymentDetails.billing_month}`, `Rs. ${paymentDetails.amount}`],
      ],
      foot: [['Total Paid', `Rs. ${paymentDetails.amount}`]],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 30;
    
    doc.setFont('helvetica', 'bold');
    doc.text("Authorized Signatory", 150, finalY);
    doc.line(140, finalY - 5, 190, finalY - 5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("This is a computer-generated receipt and does not require a physical signature.", 105, finalY + 20, { align: 'center' });
    
    doc.save(`${receiptNo}.pdf`);
    toast.success('Receipt downloaded successfully');
  } catch (error) {
    console.error('Error generating receipt', error);
    toast.error('Failed to generate receipt');
  }
};
