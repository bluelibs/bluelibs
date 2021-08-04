import React from "react";
import classnames from "classnames";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import { SubscribeToNewsletter } from "../components/SubscribeToNewsletter";
import { IoIosApps, IoIosFlash, IoIosFlower } from "react-icons/io";
import { Feature } from "../components/Feature";
import { TextHighlight } from "../components/TextHighlight";
import { ComparisonFrameworks } from "../components/ComparisonFrameworks";

const features = [
  {
    title: <>Technology Stack</>,
    icon: <IoIosApps />,
    // imageUrl: "img/undraw_docusaurus_mountain.svg",
    description: (
      <>
        We are harnessing the power of <strong>TypeScript</strong> in{" "}
        <strong>Node</strong> and <strong>React</strong>. We have included cool
        stuff like: Dependency Injection, Async Event Management, Built-in
        Authentication Support and Modular Design.
      </>
    ),
  },
  {
    title: <>The X-Framework</>,
    icon: <IoIosFlash />,
    // imageUrl: "img/undraw_docusaurus_react.svg",
    description: (
      <>
        BlueLibs works with any database or API model, however, we go fast by
        deciding on a stack.{" "}
        <span style={{ display: "inline-block" }}>X-Framework</span> is built on
        top of BlueLibs allowing you to work with <strong>GraphQL</strong> and{" "}
        <strong>MongoDB</strong>. You benefit of authentication, real time data,
        cli generation tools and much more.
      </>
    ),
  },
  {
    title: <>Philosophy</>,
    icon: <IoIosFlower />,
    // imageUrl: "img/undraw_docusaurus_react.svg",
    description: (
      <>
        We want to enable developers to move <strong>fast</strong> without
        reinventing the wheel. Our goal is to create an elegant fullstack
        framework that lets you rapidly develop your products with no
        compromises.
      </>
    ),
  },
];

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      title={`Home`}
      description="BlueLibs is a framework with rapid development in mind without the sacrifice of quality."
    >
      <header className={classnames("homepage hero", styles.heroBanner)}>
        <div className="container">
          <embed src="/img/logo.svg" height="100px" alt="BlueLibs Logo" />
          <p className="hero__subtitle">
            fast like a prototype, scalable like enterprise
            <br />
          </p>
          <div className={styles.buttons}>
            <Link
              className="button button--lg button--primary"
              to={useBaseUrl("docs/")}
            >
              Start
            </Link>
          </div>
          <div className="backed-by-cult">
            this project is backed by{" "}
            <a href="https://www.cultofcoders.com" target="_blank">
              Cult of Coders
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
      <div className="just-go">
        <h1>Start fast with X-Framework</h1>
        use the generator
        <div className="start-code">
          npm i -g @bluelibs/x
          <br />x
        </div>
        <br />
        or simply clone it
        <br />
        <div className="start-code">
          git clone https://github.com/bluelibs/x-boilerplate
        </div>
      </div>
      <ComparisonFrameworks />
      {/* <main className="explained-container">
        <h1>So, what can it do?</h1>
        <Tabs
          defaultValue="frontend"
          values={[
            { label: "Frontend", value: "frontend" },
            { label: "Mobile", value: "mobile" },
            { label: "Backend", value: "backend" },
          ]}
        >
          <TabItem value="frontend">
            
          </TabItem>
          <TabItem value="entrepreneurs">
            Whether you are starting a company or looking to digitalise yours,
            it's gonna be a challenge, we guarantee. You will be battling with
            sharks and the best weapon at your disposal is delivering fast or
            your competition is going to take the cake.{" "}
            <TextHighlight>Don't let them.</TextHighlight>
            <br />
            <br />
            BlueLibs is a framework{" "}
            <TextHighlight>designed to deliver fast</TextHighlight>, it is
            designed to aid you or your team by providing standards,
            conventions, the basic things already built, so you can{" "}
            <TextHighlight strong>focus on your business</TextHighlight>.
            <br />
            <br />
            Besides the framework we also have a strong{" "}
            <a href={useBaseUrl("devnet/")}>Developer Network</a> (coined
            DevNet) that can help you scale the team in snap.{" "}
            <a href={useBaseUrl("devnet/")}>Find out more here.</a>
            <br />
            <br />
            Did we mention it's fast? Don't belive us. Talk with your CTO or
            hire one from our DevNet, and whatever you do, be sure to{" "}
            <a href="http://eepurl.com/hcoxCj" target="_blank">
              subscribe to our newsletter
            </a>
            .
          </TabItem>
          <TabItem value="pms">
            The success of a project manager is measured by two key metrics:
            <TextHighlight strong>delivery and team satisfaction</TextHighlight>
            . To master both it is an art that may take decades. BlueLibs is going
            to be your friend because it helps your most critical KPIs.
            <br />
            <br />
            Being <TextHighlight>designed for fast delivery</TextHighlight>,
            your sprints will be finished in time and containing a
            well-structured and organised documentation and set of conventions,
            your developer will be more than happy to work on it, improving on
            the satisfaction metric.
            <br />
            <br />
            Do yourself a favor, and recommend BlueLibs to whoever makes decisions
            regarding technology and be sure to{" "}
            <a href="http://eepurl.com/hcoxCj" target="_blank">
              subscribe to our newsletter
            </a>
            . You know it's{" "}
            <TextHighlight>important to stay informed</TextHighlight>.
          </TabItem>
        </Tabs>
      </main> */}
      <SubscribeToNewsletter />
    </Layout>
  );
}

export default Home;
