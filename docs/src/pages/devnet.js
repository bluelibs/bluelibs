import React from "react";
import classnames from "classnames";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";
import { SubscribeToNewsletter } from "../components/SubscribeToNewsletter";
import { Feature } from "../components/Feature";
import { IoMdHand, IoIosCode, IoMdPeople } from "react-icons/io";

const features = [
  {
    title: <>Project Consulting</>,
    icon: <IoMdHand />,
    description: (
      <>
        Talk with the creator of BlueLibs (Theodor) and scheudule a meeting
        directly with him. Send us an email at{" "}
        <a href="mailto:theo@bluelibs.com">theo@bluelibs.com</a>. If you are
        looking for a full team, you can{" "}
        <a href="https://forms.gle/UP7sZeVtQxicr6iPA" target="_blank">
          send us a request here
        </a>
        .
      </>
    ),
  },
  {
    title: <>Apply as a Developer</>,
    icon: <IoIosCode />,
    description: (
      <>
        Are you a passionate developer that loves web development? Feel free to
        apply to our network using this{" "}
        <a href="https://forms.gle/fL8wp8bgk6QmfotS9" target="_blank">
          quick form
        </a>
        . You are going to join our exclusive club and receive offers and work
        with like-minded people.
      </>
    ),
  },
  {
    title: <>Build your Team.</>,
    icon: <IoMdPeople />,
    description: (
      <>
        Work with us to find the perfect team for your project. We have
        resources for: Backend, Frontend, Management &amp; Audit, QA, Designers
        fit for <strong>your project</strong>.{" "}
        <a href="https://forms.gle/UP7sZeVtQxicr6iPA" target="_blank">
          Apply here
        </a>{" "}
        for a request and we will match you with the perfect team.
      </>
    ),
  },
];

function DevNet() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      title={`DevNet`}
      description="BlueLibs developer network. Join now or ask for resources!"
    >
      <header className={classnames("hero hero--primary", styles.heroBanner)}>
        <div className="container">
          <h1>Developer Network</h1>
          <p className="hero__subtitle">
            find the <strong>human</strong> resources to build your apps
            <br />
          </p>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <SubscribeToNewsletter />
    </Layout>
  );
}

export default DevNet;
