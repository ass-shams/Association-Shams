import Breadcrumb from '@/components/Breadcrumb';
import ContactForm from '@/components/contact/ContactForm';
import WhatsAppCTA from '@/components/contact/WhatsAppCTA';

/**
 * Contact page — deliberately simple: a compact header and one centered contact
 * form. Contact information is intentionally not shown here anymore.
 *
 * The submission handler calls `src/data/contactService.ts`, which is where a
 * real backend is wired in later.
 */
export default function ContactPage() {
  return (
    <>
      <section className="section section--default section--pad-tight contact-header">
        <div className="container">
          <Breadcrumb
            items={[{ label: 'الرئيسية', to: '/' }, { label: 'اتصل بنا' }]}
          />

          <div className="contact-header__intro">
            <h1 className="contact-header__title">اتصل بنا</h1>
            <p className="contact-header__lead">
              يسعدنا تواصلكم معنا. للاستفسارات أو الاقتراحات أو لمزيد من المعلومات، يمكنكم
              التواصل معنا عبر النموذج.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--muted contact-main">
        <div className="container">
          <WhatsAppCTA />

          <div className="contact-form-wrap">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
