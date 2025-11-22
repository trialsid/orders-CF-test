import React from 'react';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type PageSectionProps = {
  id?: string;
  title?: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  headingLevel?: HeadingLevel;
  className?: string;
  contentClassName?: string;
  introClassName?: string;
  spacing?: 'none' | 'compact' | 'relaxed';
  paddingBottom?: number; // Added paddingBottom prop
};

function PageSection({
  id,
  title,
  description,
  eyebrow,
  actions,
  children,
  headingLevel = 1,
  className,
  contentClassName,
  introClassName,
  spacing = 'relaxed',
  paddingBottom, // Destructure paddingBottom
}: PageSectionProps): JSX.Element {
  const SectionHeading = `h${headingLevel}` as keyof JSX.IntrinsicElements;
  const spacingClass =
    spacing === 'none'
      ? ''
      : spacing === 'compact'
      ? 'space-y-6 md:space-y-8'
      : 'space-y-8 md:space-y-10';

  return (
    <section id={id} className={`section ${className ?? ''}`}>
      <div
        className={`page-shell ${spacingClass} ${contentClassName ?? ''}`}
        style={paddingBottom ? { paddingBottom: `${paddingBottom}px` } : undefined} // Apply inline style
      >
        {(title || description || actions || eyebrow) && (
          <header className={`section__intro ${introClassName ?? ''}`}>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                {eyebrow}
              </p>
            )}
            {title ? (
              <SectionHeading className="font-display text-2xl font-semibold text-emerald-900 dark:text-brand-100 sm:text-3xl">
                {title}
              </SectionHeading>
            ) : null}
            {description ? (
              <p className="max-w-prose text-sm text-slate-600 dark:text-slate-300">
                {description}
              </p>
            ) : null}
            {actions ? <div className="mt-4 flex flex-wrap justify-center gap-3">{actions}</div> : null}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export default PageSection;
