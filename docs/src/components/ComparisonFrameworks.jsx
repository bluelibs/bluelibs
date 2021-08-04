import React from "react";
import classnames from "classnames";
import {
  IoIosCheckmarkCircleOutline,
  IoIosCloseCircleOutline,
} from "react-icons/io";

const frameworks = ["BlueLibs", "NestJS", "Meteor", "KeystoneJS", "Loopback"];

const featureSet = {
  "Full Stack": ["BlueLibs"],
  "Live Data": ["BlueLibs", "Meteor"],
  "Dependency Injection": ["BlueLibs", "NestJS"],
  TypeSafety: ["BlueLibs", "NestJS"],
  "GraphQL Support": ["BlueLibs", "NestJS", "KeystoneJS"],
  "Async Event Management": ["BlueLibs"],
  "Built-in Authentication": ["BlueLibs", "Meteor"],
  "MongoDB Support": ["BlueLibs", "Meteor"],
};

export function ComparisonFrameworks({ icon, title, description }) {
  return (
    <div className="comparison-with-others">
      <h1>How does it compare?</h1>
      <table>
        <thead>
          <tr>
            <td></td>
            <td>BlueLibs</td>
            <td>NestJS</td>
            <td>Meteor</td>
            <td>KeystoneJS</td>
            <td>LoopBack</td>
          </tr>
        </thead>
        <tbody>
          {Object.keys(featureSet).map((featureKey) => {
            return (
              <tr>
                <td>{featureKey}</td>
                {frameworks.map((framework) => {
                  const hasFeature = featureSet[featureKey].includes(framework);
                  return (
                    <td
                      className={classnames({
                        "feature-yes": hasFeature,
                        "feature-no": !hasFeature,
                      })}
                    >
                      {hasFeature ? <Yes /> : <No />}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Yes() {
  return <IoIosCheckmarkCircleOutline />;
}

function No() {
  return <IoIosCloseCircleOutline />;
}
