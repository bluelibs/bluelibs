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
  IoMdHand,
  IoIosApps,
  IoIosCode,
  IoIosLock,
  IoIosListBox,
} from "react-icons/io";

const features = [
  {
    title: <>The Stack</>,
    icon: <IoIosApps />,
    description: (
      <>
        Because we are using X-Framework to accelerate development the stack is
        GraphQL, React, MongoDB. Everything is type-safe thanks to TypeScript,
        and the result is a modern, scalable solution for your application.
      </>
    ),
  },
  {
    title: <>Relations Built-in</>,
    icon: <IoIosCode />,
    description: (
      <>
        Besides the normal fields: strings, dates, numbers, lists, we also do
        smart relationship detection for items which reflect data-ranges. Your
        application will be fully linked from start. Supporting single and
        multiple type of relationships
      </>
    ),
  },
  {
    title: <>Authentication & Data Fixtures</>,
    icon: <IoIosLock />,
    description: (
      <>
        We extract and link data directly from your Excel so you can start using
        your API right after generation. We also do this for your Users sheet
        and create the users with their propper roles, ready for you to just
        code.
      </>
    ),
  },
];

function Excel2App() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      title={`Excel To Application`}
      description="Excel to Application Converter"
    >
      <div className="excel2app">
        <header className={classnames("hero hero--primary", styles.heroBanner)}>
          <div className="container">
            <h1>
              <IoIosListBox />
            </h1>
            <h1>Excel 2 Application Solution</h1>
            <br />
            <p className="hero__subtitle">
              Transform your Excel CMS into an Application CMS,
              <br /> that is ready to scale and be modified to your specs.
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
          <section className="demo demo-dark">
            <h1>Watch the demo</h1>
            <p>
              <iframe
                width="560"
                height="315"
                src="https://www.youtube-nocookie.com/embed/B0HowNUcDVg"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </p>
          </section>
          <section className="demo">
            <h1>Want your application generated?</h1>

            <p>
              Currently, we do this manually, to find out more, reach out to
              theo[@]bluelibs.com
            </p>
          </section>
        </main>
      </div>
      <SubscribeToNewsletter />
    </Layout>
  );
}

export default Excel2App;
