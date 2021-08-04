import React from "react";
import classnames from "classnames";

export function Feature({ icon, title, description }) {
  return (
    <div className={classnames("col col--4", "feature-element")}>
      <div className="feature-header">
        {icon && <div className="text--center icon">{icon}</div>}
        <h3>{title}</h3>
      </div>
      <div className="feature-description">
        <p>{description}</p>
      </div>
    </div>
  );
}
