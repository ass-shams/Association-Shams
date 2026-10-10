import heroImage from '@/assets/competitions-images/hero-image.png';

/** Hero for the dedicated competitions page — eyebrow, headline, description, actions and image. */
export default function CompetitionsHero() {
  return (
    <section className="section section--default section--pad-default" aria-labelledby="competitions-hero-title">
      <div className="container">
        <div className="competitions-hero">
          <div className="page-hero">
            <p className="page-hero__eyebrow">المسابقات</p>
            <h1 id="competitions-hero-title" className="page-hero__title competitions-hero__title">
              نكتشف المواهب، ونصنع لحظات التميز
            </h1>
            <p className="page-hero__lead competitions-hero__desc">
              اكتشف مختلف المسابقات التي تنظمها جمعية شمس، والتي تمنح المواهب فرصة للتعبير عن
              قدراتها، وإبراز إبداعها، والمشاركة في تجارب مميزة.
            </p>
            <div className="page-hero__actions">
              <a className="btn btn--primary btn--lg btn--join" href="/membership">
                انخرط معنا
              </a>
              <a className="btn btn--outline btn--lg" href="#competitions-list-title">
                تصفح المسابقات
              </a>
            </div>
          </div>

          <div className="competitions-hero__media">
            <img
              src={heroImage}
              alt="صورة توضيحية لمسابقات جمعية شمس"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
