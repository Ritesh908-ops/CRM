import React, { useState } from 'react';
import { Plus, Trash2, Printer, FileText } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export const InvoiceGeneratorView: React.FC = () => {
  const [invoiceNo, setInvoiceNo] = useState('INV-1001');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  
  const [billToName, setBillToName] = useState('');
  const [billToAddress, setBillToAddress] = useState('');
  const [billToEmail, setBillToEmail] = useState('');
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Consulting Services', quantity: 1, rate: 5000 },
  ]);
  
  const [taxRate, setTaxRate] = useState(18); // default 18% GST for India
  const [notes, setNotes] = useState('Thank you for your business!');

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, rate: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-container flex flex-col gap-5 h-full">
      {/* ── Form Section (Hidden when printing) ── */}
      <div className="invoice-editor no-print card" style={{ padding: '24px' }}>
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText size={20} className="part" />
            Invoice Generator
          </h2>
          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="fg">
            <label>Invoice Number</label>
            <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="INV-001" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="fg">
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="fg">
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="fg mb-6 p-4 rounded-xl" style={{ background: 'rgba(242,242,247,0.6)', border: '0.5px solid rgba(60,60,67,0.12)' }}>
          <h3 className="text-sm font-bold mb-3 text-gray-500 uppercase tracking-tight">Bill To</h3>
          <div className="grid grid-cols-1 gap-4">
            <input type="text" value={billToName} onChange={e => setBillToName(e.target.value)} placeholder="Company / Client Name" />
            <input type="email" value={billToEmail} onChange={e => setBillToEmail(e.target.value)} placeholder="Email Address" />
            <textarea value={billToAddress} onChange={e => setBillToAddress(e.target.value)} placeholder="Billing Address" rows={2} />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold mb-3 text-gray-500 uppercase tracking-tight">Line Items</h3>
          
          <div className="flex flex-col gap-3 mb-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={item.description} 
                  onChange={e => handleItemChange(item.id, 'description', e.target.value)} 
                  placeholder="Item description" 
                  className="flex-1"
                />
                <input 
                  type="number" 
                  value={item.quantity} 
                  onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} 
                  placeholder="Qty" 
                  style={{ width: '80px' }}
                />
                <input 
                  type="number" 
                  value={item.rate} 
                  onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))} 
                  placeholder="Rate" 
                  style={{ width: '120px' }}
                />
                <div style={{ width: '100px', fontWeight: 600, textAlign: 'right' }}>
                  ₹{(item.quantity * item.rate).toLocaleString()}
                </div>
                <button 
                  onClick={() => handleRemoveItem(item.id)} 
                  className="btn btn-ghost" 
                  style={{ padding: '8px', color: '#FF3B30', background: 'rgba(255,59,48,0.12)' }}
                  disabled={items.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <button onClick={handleAddItem} className="btn btn-ghost btn-sm">
            <Plus size={16} /> Add Item
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="fg">
            <label>Notes / Terms</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Thank you for your business." />
          </div>
          <div className="flex flex-col gap-3 justify-end items-end p-4 rounded-xl" style={{ background: 'rgba(242,242,247,0.6)', border: '0.5px solid rgba(60,60,67,0.12)' }}>
            <div className="flex justify-between w-full max-w-[250px]">
              <span className="font-semibold text-gray-500">Subtotal:</span>
              <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between w-full max-w-[250px] items-center">
              <span className="font-semibold text-gray-500">Tax (%):</span>
              <input 
                type="number" 
                value={taxRate} 
                onChange={e => setTaxRate(Number(e.target.value))} 
                style={{ width: '60px', padding: '4px 8px', textAlign: 'right' }} 
              />
            </div>
            <div className="flex justify-between w-full max-w-[250px]">
              <span className="font-semibold text-gray-500">Tax Amount:</span>
              <span className="font-semibold">₹{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between w-full max-w-[250px] pt-3 mt-1" style={{ borderTop: '0.5px solid rgba(60,60,67,0.2)' }}>
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-lg text-indigo-600">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Print Document Preview (Visible on print, styled for A4) ── */}
      <div className="print-only-preview print-document bg-white" style={{ display: 'none' }}>
        <div className="print-header flex justify-between items-start mb-8 pb-6" style={{ borderBottom: '2px solid #F2F2F7' }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#007AFF', letterSpacing: '-0.5px' }}>Khataview</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(60,60,67,0.6)' }}>Corporate Dataset & Smart Deduplication Hub</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold" style={{ color: '#000' }}>INVOICE</h2>
            <p className="font-semibold mt-1"># {invoiceNo || 'INV-XXXX'}</p>
            <p className="text-sm text-gray-500 mt-1">Date: {date || '-'}</p>
            {dueDate && <p className="text-sm text-gray-500">Due: {dueDate}</p>}
          </div>
        </div>

        <div className="print-bill-to mb-10">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Billed To</h3>
          <p className="font-bold text-lg">{billToName || 'Client Name'}</p>
          {billToAddress && <p className="whitespace-pre-wrap mt-1" style={{ color: '#3C3C43' }}>{billToAddress}</p>}
          {billToEmail && <p className="mt-1" style={{ color: '#3C3C43' }}>{billToEmail}</p>}
        </div>

        <table className="w-full mb-10" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F2F2F7' }}>
              <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ borderBottom: '1px solid #D1D1D6' }}>Description</th>
              <th className="py-3 px-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ borderBottom: '1px solid #D1D1D6' }}>Qty</th>
              <th className="py-3 px-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ borderBottom: '1px solid #D1D1D6' }}>Rate</th>
              <th className="py-3 px-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ borderBottom: '1px solid #D1D1D6' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #E5E5EA' }}>
                <td className="py-4 px-4 font-medium" style={{ color: '#1C1C1E' }}>{item.description || '-'}</td>
                <td className="py-4 px-4 text-right" style={{ color: '#3C3C43' }}>{item.quantity}</td>
                <td className="py-4 px-4 text-right" style={{ color: '#3C3C43' }}>₹{item.rate.toLocaleString()}</td>
                <td className="py-4 px-4 text-right font-semibold" style={{ color: '#1C1C1E' }}>₹{(item.quantity * item.rate).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-12">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="font-semibold text-gray-500">Subtotal</span>
              <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-semibold text-gray-500">Tax ({taxRate}%)</span>
              <span className="font-semibold">₹{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-3 mt-2" style={{ borderTop: '2px solid #000' }}>
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg" style={{ color: '#007AFF' }}>₹{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {notes && (
          <div className="print-notes pt-8" style={{ borderTop: '1px solid #E5E5EA' }}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Notes</h3>
            <p className="whitespace-pre-wrap text-sm" style={{ color: '#3C3C43' }}>{notes}</p>
          </div>
        )}
        
        <div className="mt-16 text-center text-xs text-gray-400">
          Generated locally by Khataview CRM • No data saved to server
        </div>
      </div>
    </div>
  );
};
