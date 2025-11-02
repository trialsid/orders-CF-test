import React from 'react';
import ContactSection from '../components/ContactSection';
import { useTranslations } from '../i18n/i18n';

function SupportPage(): JSX.Element {
  const { t } = useTranslations();

  return (
    <>
      <section className="section">
        <div className="page-shell section__intro">
          <h1>{t('support.title')}</h1>
          <p>{t('support.description')}</p>
        </div>
      </section>
      <ContactSection />
    </>
  );
}

export default SupportPage;
