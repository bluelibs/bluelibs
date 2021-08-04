---
id: x-framework-deployment
title: Deployment
slug: /deployment
---

## Deployment

When we structure our modern apps we typically have 2 microservices, one is the `api` which is responsible of communicating with the database and provide you with custom logic, the other is the client which is typically a `web` application that communicates with the `api`. These are independently deployable.

There are many ways to deploy nowadays, but our focus here is to offer the simplest possible way of deploying in a solid, highly scalable fashion. The solutions we are providing are 100% free and require you no money to deploy and play with your apps, but at the same time you have the infrastructure to scale a lot.

## Accounts

### Heroku

1. Go to https://www.heroku.com and create an account.
2. Install the `cli` tool: `npm i -g heroku`. And then run `heroku login`
3. You might need some other dependencies so all works flawlessly: `npm i -g @heroku/buildpack-registry true-myth valid-url`

### Atlas

You need a solid database for MongoDB. Databases are usually a pain to maintain and scale, try to avoid managing your own unless you have to.

1. Go to https://www.mongodb.com/cloud/atlas/register and create an account.
2. Create a `free-tier cluster`, create an admin username and ensure your security is set to "Allow all IP Addresses"
3. Please select a very secure password. At least 12 chars.

## Setting Up

We use need `heroku-buildpack-monorepo` which allows an environment variable `APP_BASE` to control this.

### API

Note: the order of the buildpacks matter, `heroku-buildpack-monorepo` needs to be first.

```bash
# Just create some unique ids, and select the region "eu" or "us"
heroku create api-test --region eu
heroku buildpacks:add -a api-test https://github.com/lstoll/heroku-buildpack-monorepo -i 1
heroku buildpacks:add -a api-test heroku/nodejs

# Do not rely on .env or commit it. Use heroku's own environment config variables
heroku config:set -a api-test APP_BASE="microservices/api"
heroku config:set -a api-test APP_URL="https://web-test.herokuapp.com"
heroku config:set -a api-test ROOT_URL="https://api-test.herokuapp.com"

# Get this from MongoDB Atlas. Create a "Free Tier Cluster" and go to "Connect" and specify in security: Allow all IPs. The URL looks like:
heroku config:set -a api-test MONGO_URL="mongodb+srv://bluelibs:XXXXXX@bluelibs-test.3ixcw.mongodb.net/x-boilerplate?retryWrites=true&w=majority"
```

```bash
git remote add heroku-api https://git.heroku.com/api-test.git
git push heroku-api master # or main, whichever branch you use
```

### CLIENT

Netlify is also a good option, but for the sake of having everything done in a consistent manner, this is how it would work with Heroku.

```
heroku create web-test --region eu
heroku buildpacks:add -a web-test https://github.com/lstoll/heroku-buildpack-monorepo -i 1
heroku buildpacks:add -a web-test heroku/nodejs
```

```bash
heroku config:set -a web-test APP_BASE="microservices/ui"
heroku config:set -a web-test API_URL="https://api-test.herokuapp.com/graphql"
```

```
git remote add heroku-web https://git.heroku.com/web-test.git
git push heroku-web master
```

## Logs

To view the logs if something fails or the server's output:

```bash
heroku logs --app api-test
heroku logs --app api-test --tail # Follows the logs as they appear, useful when debugging server-side logging
```

## Conclusion

Nowadays it's free and easy to deploy your app in safe, scalable manner. We love simplicity. The full working sample can be found here: https://github.com/bluelibs/x-boilerplate
