import React from 'react';
import { PhoneCall } from 'lucide-react';
import { useTranslations } from '../i18n/i18n';

function FloatingCall(): JSX.Element {
  const { t } = useTranslations();

  return (
    <a
      className="floating-call hidden md:inline-flex"
      href="tel:+919876543210"
      aria-label={t('floatingCall.aria')}
    >
      <PhoneCall className="h-4 w-4" />
      {t('floatingCall.label')}
    </a>
  );
}

export default FloatingCall;
