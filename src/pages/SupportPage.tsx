import React from 'react';
import ContactSection from '../components/ContactSection';
import { useTranslations } from '../i18n/i18n';
import PageSection from '../components/PageSection';

function SupportPage(): JSX.Element {
  const { t } = useTranslations();

  return (
    <>
      <PageSection
        title={t('support.title')}
        description={t('support.description')}
        introClassName="text-left sm:text-center"
        spacing="none"
      >
        {null}
      </PageSection>
      <ContactSection />
    </>
  );
}

export default SupportPage;
