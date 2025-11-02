import React from 'react';
import ContactSection from '../components/ContactSection';

function SupportPage(): JSX.Element {
  return (
    <>
      <section className="section">
        <div className="page-shell section__intro">
          <h1>Support</h1>
          <p>Reach our fulfilment team anytime for slot updates, substitutions, or help with your account.</p>
        </div>
      </section>
      <ContactSection />
    </>
  );
}

export default SupportPage;
