import React from "react";

export default function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="page-header">
      {eyebrow && <span className="page-header__eyebrow">{eyebrow}</span>}
      <h1 className="page-header__title text-gradient">{title}</h1>
      {description && <p className="page-header__desc">{description}</p>}
    </header>
  );
}
