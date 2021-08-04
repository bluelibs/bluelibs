---
id: x-framework-introduction
title: Introduction
---

X-way is using BlueLibs's goodies to provide an opinionated application development "way" of doing things. By enforcing database (MongoDB), API layer (GraphQL), Folder Structures & Naming Conventions, so it opens the path to fast prototyping.

Everything starts by installing the command line generator:

```bash
npm install -g --save @bluelibs/x
```

Now simply run: `x` and create your first project by using `x:project`

The project itself does't do anything, you'll be needing microservices, so once a project is created you will create your microservice by using `x:microservice`

From then on you will use the documentation to generate things such as:

- Collections & Models
- CRUDs with GraphQL
- Queries, Mutations, Inputs with GraphQL and TypeScript and Valdiation
- Events, Exceptions, Listeners
- Data Fixtures

...and others!

Feel free to read about the tools offered by `X-Bundle` then you can dive into using the generator and quickly create your app.
