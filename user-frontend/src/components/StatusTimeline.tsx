'use client';

import React from 'react';
import { CheckCircle2, Clock, Key, ShieldCheck, CreditCard, Gamepad2 } from 'lucide-react';

interface StatusTimelineProps {
  currentStep: number; // 1 to 4
  status: string; // PENDING | CONFIRMED | CANCELLED | REJECTED
  paymentStatus: string; // PENDING | PAID | FREE | REFUNDED
}

export default function StatusTimeline({ currentStep, status, paymentStatus }: StatusTimelineProps) {
  const steps = [
    {
      number: 1,
      title: 'JOINED MATCH',
      desc: 'Character UID Registered',
      icon: Gamepad2,
    },
    {
      number: 2,
      title: 'PAYMENT PROOF',
      desc: paymentStatus === 'FREE' ? 'Free Tournament' : 'UTR & Receipt Submitted',
      icon: CreditCard,
    },
    {
      number: 3,
      title: 'ADMIN VERIFICATION',
      desc: status === 'CONFIRMED' ? 'Slot Approved & Confirmed' : 'Verification Pending',
      icon: ShieldCheck,
    },
    {
      number: 4,
      title: 'WAITING ROOM',
      desc: 'Room ID & Password Unlocked',
      icon: Key,
    },
  ];

  return (
    <div className="bg-[#0D1117]/80 border border-white/10 rounded-3xl p-8 mb-8 relative backdrop-blur-xl shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-xl font-display font-bold uppercase tracking-tight text-[#FAFAFA] flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#DFE104] stroke-[2]" />
            <span>REGISTRATION APPROVAL TIMELINE</span>
          </h3>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">Track your approval status from payment submission to lobby launch.</p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-1 text-xs font-bold uppercase bg-[#DFE104] text-black rounded-full shadow-md">
            STAGE {currentStep} OF 4
          </span>
        </div>
      </div>

      {/* Progress Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep >= step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div
              key={step.number}
              className={`p-5 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-[#DFE104]/10 border-[#DFE104] text-[#FAFAFA] shadow-lg shadow-[#DFE104]/10'
                  : isCompleted
                  ? 'bg-white/5 border-white/15 text-[#FAFAFA]'
                  : 'bg-black/30 border-white/5 opacity-50 text-[#94A3B8]'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isCompleted
                      ? 'bg-[#FAFAFA] text-black'
                      : isCurrent
                      ? 'bg-[#DFE104] text-black font-extrabold animate-pulse'
                      : 'bg-white/10 text-[#94A3B8]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5 stroke-[2]" /> : <Icon className="h-4 w-4 stroke-[2]" />}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? 'text-[#FAFAFA]' : isCurrent ? 'text-[#DFE104]' : 'text-[#94A3B8]'}`}>
                  STEP {step.number}
                </span>
              </div>

              <h4 className="text-sm font-bold uppercase tracking-tight text-[#FAFAFA]">{step.title}</h4>
              <p className="text-xs text-[#94A3B8] mt-1 font-medium">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}


