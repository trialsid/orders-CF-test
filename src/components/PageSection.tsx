import React from 'react';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type PageSectionProps = {
  id?: string;
  // Content
  title?: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  
  // Semantics
  headingLevel?: HeadingLevel;
  
  // Visuals
  className?: string;
  contentClassName?: string;
  introClassName?: string;
  spacing?: 'none' | 'compact' | 'relaxed';
  paddingBottom?: number;
  
  // New Layout Options
  layout?: 'center' | 'start' | 'split';
  variant?: 'transparent' | 'card' | 'muted';
};

function PageSection({
  id,
  title,
  description,
  eyebrow,
  actions,
  children,
  headingLevel = 1,
  className = '',
  contentClassName = '',
  introClassName = '',
  spacing = 'relaxed',
  paddingBottom,
  layout = 'center',
  variant = 'transparent',
}: PageSectionProps): JSX.Element {
  const SectionHeading = `h${headingLevel}` as keyof JSX.IntrinsicElements;

  // 1. Spacing Logic
  const spacingClass =
    spacing === 'none'
      ? ''
      : spacing === 'compact'
      ? 'space-y-6 md:space-y-8'
      : 'space-y-8 md:space-y-10';

  // 2. Variant Logic (Backgrounds/Borders)
  const variantClass = 
    variant === 'card' 
      ? 'bg-white rounded-3xl border border-emerald-100/80 shadow-sm p-6 sm:p-8 lg:p-10 dark:bg-slate-900/60 dark:border-emerald-900/50' 
      : variant === 'muted'
      ? 'bg-slate-50/80 border-y border-emerald-100/50 dark:bg-slate-900/30 dark:border-emerald-900/30'
      : ''; // transparent

  // 3. Header Layout Logic
  let headerLayoutClass = 'flex flex-col gap-4'; // Base
  let textAlignClass = 'text-center';
  let actionsClass = 'mt-4 flex flex-wrap justify-center gap-3';
  let introWidthClass = 'mx-auto max-w-4xl';

  if (layout === 'split') {
    // Desktop: Row with space-between. Mobile: Stacked.
    headerLayoutClass = 'flex flex-col gap-6 md:flex-row md:items-end md:justify-between';
    textAlignClass = 'text-left';
    actionsClass = 'flex flex-wrap gap-3 mt-4 md:mt-0'; // No margin top on desktop if it's side-by-side
    introWidthClass = 'w-full';
  } else if (layout === 'start') {
    textAlignClass = 'text-left';
    actionsClass = 'mt-4 flex flex-wrap justify-start gap-3';
    introWidthClass = 'max-w-4xl mr-auto';
  }

  const hasHeader = title || description || actions || eyebrow;

  return (
    <section 
      id={id} 
      className={`section ${variant === 'transparent' ? '' : 'py-8'} ${className}`}
    >
      <div
        className="page-shell"
        style={paddingBottom ? { paddingBottom: `${paddingBottom}px` } : undefined}
      >
        {/* Render Variant Container if needed, or just a fragment wrapper */}
        <div className={`${variantClass} ${spacingClass} ${contentClassName}`}>
          {hasHeader && (
            <header className={`${headerLayoutClass} ${introClassName} ${introWidthClass} mb-6 sm:mb-10`}>
              
              {/* Text Group */}
              <div className={`flex flex-col gap-2 ${textAlignClass} ${layout === 'split' ? 'flex-1' : ''}`}>
                {eyebrow && (
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {eyebrow}
                  </p>
                )}
                {title && (
                  <SectionHeading className="font-display text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl tracking-tight">
                    {title}
                  </SectionHeading>
                )}
                {description && (
                  <div className={`max-w-prose text-sm leading-relaxed text-slate-600 dark:text-slate-400 ${layout === 'center' ? 'mx-auto' : ''}`}>
                    {description}
                  </div>
                )}
              </div>

              {/* Actions Group */}
              {actions && (
                <div className={actionsClass}>
                  {actions}
                </div>
              )}
            </header>
          )}
          
          {children}
        </div>
      </div>
    </section>
  );
}

export default PageSection;