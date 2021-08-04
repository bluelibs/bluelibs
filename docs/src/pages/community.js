import React from "react";
import classnames from "classnames";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";
import { SubscribeToNewsletter } from "../components/SubscribeToNewsletter";
import { Feature } from "../components/Feature";
import {
  IoIosBulb,
  IoIosGitBranch,
  IoIosFlower,
  IoLogoReddit,
} from "react-icons/io";

const features = [
  {
    title: <>Questions and Ideas</>,
    icon: <IoIosBulb />,
    description: (
      <>
        Every framework should be open to be shaped by the community. We chose{" "}
        <a href="https://www.reddit.com/r/BlueLibs" target="_blank">
          Reddit <IoLogoReddit />
        </a>{" "}
        as the perfect platform for us to challenge and decide on ideas.
      </>
    ),
  },
  {
    title: <>Open-source is for the soul</>,
    icon: <IoIosFlower />,
    description: (
      <>
        Join us in our adventure, contribute to open-source, evolve as a human
        being and coder and skyrocket your career. Most companies appreciate
        involvement to open-source,{" "}
        <a href="https://www.reddit.com/r/BlueLibs">join our community</a> and
        get involved. Let your GitHub account speak for itself.
      </>
    ),
  },
  {
    title: <>Community Bundles</>,
    icon: <IoIosGitBranch />,
    description: (
      <>
        We want to be able to respond to any question: "There's a bundle for
        that". So whatever idea you may have feel free to work on it and{" "}
        <a href="mailto:contact@bluelibs.com">let us know by email</a>, if it's
        worth we'll feature it.
      </>
    ),
  },
];

function Community() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout title={`Community`} description="BlueLibs community.">
      <header
        className={classnames(
          "hero hero--primary",
          styles.heroBanner,
          styles.communityBanner
        )}
      >
        <div className="container">
          <h1>Community</h1>
          {/* <embed src="/img/logo-orange.svg" height="100px" alt="BlueLibs Logo" /> */}
          <p className="hero__subtitle">
            one rule — we are <strong>excellent</strong> to each together.
            <br />
          </p>
          <div>
            <a
              className={classnames(
                "button button--outline button--lg",
                styles.getStarted
              )}
              href="https://www.reddit.com/r/BlueLibs/"
              target="_blank"
            >
              Join Us
            </a>
          </div>
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

export default Community;
