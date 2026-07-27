'use client';

import React, { useState } from 'react';
import { X, QrCode, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentTitle: string;
  entryFee: number;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  tournamentId,
  tournamentTitle,
  entryFee,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [utr, setUtr] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!utr || utr.trim().length < 8) {
      setError('Please enter a valid 12-digit UTR / UPI Transaction Reference ID.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('tournamentId', tournamentId);
    formData.append('amount', entryFee.toString());
    formData.append('utr', utr.trim());
    if (file) {
      formData.append('screenshot', file);
    }

    try {
      await api.post('/payments/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Payment submitted successfully! Admin will verify your UTR proof.');
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=esports@upi%26pn=ApexEsports%26am=${entryFee}%26cu=INR`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0D1117] border border-white/15 rounded-3xl w-full max-w-lg p-8 relative max-h-[90vh] overflow-y-auto text-[#FAFAFA] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#DFE104] hover:text-black transition-colors"
        >
          <X className="h-5 w-5 stroke-[2]" />
        </button>

        <div className="flex items-center space-x-4 mb-6 border-b border-white/10 pb-4">
          <div className="h-12 w-12 bg-[#DFE104] text-black rounded-2xl flex items-center justify-center font-bold shadow-md shadow-[#DFE104]/20">
            <QrCode className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-2xl font-display font-bold uppercase tracking-tight text-[#FAFAFA]">UPI PAYMENT VERIFICATION</h3>
            <p className="text-xs text-[#DFE104] font-bold uppercase">{tournamentTitle}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-[#DFE104]/40 bg-[#DFE104]/10 flex items-center gap-3 text-[#DFE104] text-xs font-bold uppercase tracking-wide">
            <AlertCircle className="h-5 w-5 shrink-0 stroke-[2]" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl border border-[#DFE104] bg-[#DFE104] text-black flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
            <CheckCircle className="h-5 w-5 shrink-0 stroke-[2]" />
            <span>{success}</span>
          </div>
        )}

        {/* QR Code & Amount Card */}
        <div className="p-6 border border-white/10 rounded-2xl bg-white/5 flex flex-col items-center text-center mb-6">
          <span className="text-xs uppercase tracking-wider font-bold text-[#94A3B8] mb-2">SCAN OFFICIAL UPI QR CODE</span>
          <div className="p-3 bg-white rounded-xl my-2 shadow-lg">
            <img src={qrCodeUrl} alt="UPI QR Code" className="h-44 w-44 rounded-lg" />
          </div>
          <div className="flex items-center space-x-2 mt-3 text-xs font-bold uppercase">
            <span className="text-[#94A3B8]">UPI ID:</span>
            <span className="text-[#DFE104] bg-white/5 border border-white/10 px-3 py-1 rounded-full">esports@upi</span>
          </div>
          <div className="mt-3 px-6 py-2.5 bg-[#DFE104] text-black text-sm font-bold uppercase tracking-wider rounded-xl shadow-md">
            AMOUNT DUE: ₹{entryFee}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
              12-DIGIT UTR / TRANSACTION REFERENCE ID
            </label>
            <input
              type="text"
              required
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="E.G. 419280192041"
              className="w-full bg-white/5 border border-white/15 rounded-xl py-3 px-4 text-sm font-bold text-[#FAFAFA] focus:outline-none focus:border-[#DFE104] placeholder-[#94A3B8]/50 uppercase transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
              UPLOAD PAYMENT SCREENSHOT PROOF
            </label>
            <div className="relative border border-white/15 rounded-2xl bg-white/5 p-6 text-center hover:border-[#DFE104] transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {previewUrl ? (
                <div className="flex items-center justify-center space-x-4">
                  <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-white/20" />
                  <span className="text-xs font-bold text-[#DFE104] uppercase">SCREENSHOT ATTACHED ✓</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-xs font-bold uppercase text-[#94A3B8]">
                  <Upload className="h-6 w-6 stroke-[2] mb-2 text-[#DFE104]" />
                  <span>CLICK OR DRAG PAYMENT RECEIPT SCREENSHOT HERE</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full kt-btn-primary py-4 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin stroke-[2]" />
            ) : (
              <span>SUBMIT PAYMENT PROOF FOR VERIFICATION</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}



