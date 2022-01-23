## Tweet My Articles

This is an open source tool made to automatically tweet famous DEV posts to author's twitter account.

## Motivation

I am a technical blogger on DEV. My posts have been getting a lot of traction on the platform, and to me its a news worth sharing with the world. So I started tweeting milestones like 1000 views and all.

At start it was good but, then one day Daily.dev tagged me in a tweet

<iframe
  src="https://twitter.com/sun_anshuman/status/1483503834291126272"
  style="width:100%; height:300px;"
></iframe>

And it got me thinking that "if they can automate it, so can I". And that's how my friends, I started bootstrapping this project.

---

## How do I use this project?

### Step 1

Fork this project

### Step 2

Create an account on

- DEV
- Vercel
- Twitter Developer
- Atlas
- Rebrandly

### Step 3

Get and setup the following credentials from each platform

##### DEV

```
DEV_USERNAME=<xxxxxxxxxxxxxxxxxx>
DEV_API_URL=<xxxxxxxxxxxxxxxxxx>
DEV_API_KEY=<xxxxxxxxxxxxxxxxxx>
```

You can get the `API_KEY` from Settings > Account > DEV Community API Keys

> This needs to be specified in Vercel Environment variables

##### Vercel

Sign up using your GitHub to allow Continuous Deployment.

##### Twitter

Sign up for Twitter developer program.

> Please read all instructions there to make sure you get an API access to tweet on behalf of your account.

Create a New project > Create New App > Allow Oauth1.0 with Read & Write Access.

Then get the following

```

CONSUMER_KEY=<xxxxxxxxxxxxxxxxxx>
CONSUMER_KEY_SECRET=<xxxxxxxxxxxxxxxxxx>
TWITTER_ACCESS_TOKEN=<xxxxxxxxxxxxxxxxxx>
TWITTER_ACCESS_TOKEN_SECRET=<xxxxxxxxxxxxxxxxxx>

```

> This needs to be specified in Vercel Environment variables

##### Atlas

Sign up on Atlas, create a new cluster, click on Connect > Connect using Application

> The DB_NAME should be same as specified in the Connection URI

```
DB_NAME=<xxxxxxxxxxxxxxxxxx>
ATLAS_URI_PROD=<xxxxxxxxxxxxxxxxxx>
```

> This needs to be specified in Vercel Environment variables

#### Rebrandly

Sign up and register your custom domain there. Then get an API KEY.

```
SHORTNER_API_KEY=<xxxxxxxxxxxxxxxxxx>
SHORTNER_DOMAIN=<xxxxxxxxxxxxxxxxxx>
```

> This needs to be specified in Vercel Environment variables

#### Secure API key

Generate a long enough random string to use as API_KEY for your own service.

```
API_KEY=<xxxxxxxxxxxxxxxxxx>

```

This needs to be specified at

1. Vercel Environment variables
2. GitHub Environment variables (to be used by actions)

#### Step 4

Copy the same credentials in a `.env.local` file for development purposes. A sample `.env.development` file is present in repo for help.

#### Step 5

1. Run `yarn` in the repo
2. Run `yarn dev` to run local server
3. Push to remote GitHub to automatically deploy to Vercel.

---

## Technical Problem statement

We want to send a tweet when article X on DEV crosses a pre-defined milestone.

## Breakdown

- Run a cron job using GitHub actions
- Fetch all published articles of the Author from DEV
  - Post exists in database
    - true:
      - Check if a new milestone is achieved
      - yes:
        - Create and post a tweet on Twitter
        - Update database entry with new milestone
      - no:
        - do nothing
    - false:
      - create a shortUrl using Rebrandly
      - create a new database entry for the article

## Technical Stack

This project is a hobby project, for non-profit. All the tools used here are free and openly available.

1. NextJS: this project is bootstrapped using NextJS.
2. GitHub: is used for source code management and running the cron jobs using GitHub actions.
3. Vercel: as the platform. We use their "Serverless and Edge functions".
4. MongoDB: is used to persist milestone information for each article.
5. Atlas: is used as Database provider.
6. Rebrandly: as a link shortener service

## FAQs

1. Why do we need a link shortener?

   The default url provided by DEV are sometimes too long for twitter to load preview and without preview the post doesn't look all that good. So I used a shortener to solve this issue. Rebrandly provides free custom domain usage up to 500 links which is good enough for our use case.
