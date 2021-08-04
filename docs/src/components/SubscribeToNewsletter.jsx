import React from "react";
import classnames from "classnames";

export function SubscribeToNewsletter() {
  return (
    <main className="newsletter-container">
      <h1>We're moving fast, want to keep up?</h1>
      <a
        className={classnames(
          "button button--primary button--lg signup-button"
        )}
        href="http://eepurl.com/hcoxCj"
        target="_blank"
      >
        Subscribe to our newsletter
      </a>

      <p className="no-spam">(only the essential updates)</p>
    </main>
  );
}
