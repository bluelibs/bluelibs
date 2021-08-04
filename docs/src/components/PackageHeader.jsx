import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

export function PackageHeader({
  packageName,
  containsTypeDefs = false,
  version,
}) {
  return (
    <div className="package-header-container">
      {/* {containsTypeDefs && (
        <a href={`/type-docs/${packageName}/`} target="_blank" className="link">
          Type Docs
        </a>
      )} */}
      <a
        href={`https://github.com/bluelibs/${packageName}`}
        target="_blank"
        className="link"
      >
        Source Code
      </a>
      <span className="link version" title="The package's version">
        v{version}
      </span>
    </div>
  );
}
