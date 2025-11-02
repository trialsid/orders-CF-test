import React from 'react';
import { PhoneCall } from 'lucide-react';

function FloatingCall(): JSX.Element {
  return (
    <a className="floating-call" href="tel:+919876543210" aria-label="Call Order.Ieeja">
      <PhoneCall className="h-4 w-4" />
      Call Order.Ieeja
    </a>
  );
}

export default FloatingCall;
