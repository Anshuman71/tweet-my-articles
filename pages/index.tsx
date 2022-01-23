import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Tweet My articles</title>
        <meta
          name="description"
          content="A project to tweet your popular articles from DEV. Built by Anshuman"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/icon-96x96.png"
        />
      </Head>
      <p>This project automatically retweets my popular articles.</p>
      <p>
        This is only a REST API. Available on{" "}
        <a href="https://github.com/Anshuman71/tweet-my-articles">Github</a>
      </p>
      <p>You can also fork it and use for your own DEV account.</p>
      <p>This project is a clone-and-host-on-your-own (i made that up, lol)</p>
      <p>How to setup on your own?</p>
      <ul>
        <li>Clone the repo.</li>
        <li>Add your credentials to environment variables on Vercel.</li>
        <li>Deploy it on Vercel.</li>
        <li>Write awesome articles and wait.</li>
      </ul>
      <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAnshuman71%2Ftweet-my-articles&project-name=tweet-my-articles">
        <img src="https://vercel.com/button" alt="Deploy with Vercel" />
      </a>
    </div>
  );
};

export default Home;
