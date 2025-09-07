import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from 'react-bootstrap';
import toast from 'react-hot-toast';

const SimplePrintTest = () => {
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onBeforeGetContent: () => {
      console.log('Before print content');
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log('After print');
      toast.success('Print completed');
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
      toast.error('Print failed');
    }
  });

  return (
    <div className="p-4">
      <h3>Simple Print Test</h3>
      <Button onClick={handlePrint} className="mb-3">
        Test Print
      </Button>
      
      <div ref={printRef} style={{ padding: '20px', border: '1px solid #ccc' }}>
        <h1>Test Print Content</h1>
        <p>This is a simple test to verify that react-to-print is working correctly.</p>
        <p>Current time: {new Date().toLocaleString()}</p>
        <div>
          <h3>Sample Data:</h3>
          <ul>
            <li>Receipt Number: TEST001</li>
            <li>Amount: ₹500.00</li>
            <li>Date: {new Date().toLocaleDateString()}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimplePrintTest;