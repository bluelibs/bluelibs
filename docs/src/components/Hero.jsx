import React from "react";
import classnames from "classnames";

export function Hero({ title, cta, children }) {
  return (
    <main className="hero-container">
      <h1>{title}</h1>
      {children}
    </main>
  );
}
