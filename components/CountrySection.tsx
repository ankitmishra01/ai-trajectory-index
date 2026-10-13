import type { ReactNode } from "react";

export default function CountrySection({ id, number, title, description, children }: { id: string; number: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={id} className="country-primary-section" aria-labelledby={`${id}-title`}>
      <header className="country-section-heading">
        <span>{number}</span>
        <div><h2 id={`${id}-title`}>{title}</h2><p>{description}</p></div>
      </header>
      <div className="country-section-content">{children}</div>
    </section>
  );
}
