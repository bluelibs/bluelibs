# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 1.10.0 (2026-08-05)


### Bug Fixes

* added hint option in aggregate for collection nodes, taken from options ([d5e2a00](https://github.com/bluelibs/bluelibs/commit/d5e2a009a009675b255bd79a00292cf9a37790cf))
* align eslint configs and resolve lint errors across infra packages ([1b6ac55](https://github.com/bluelibs/bluelibs/commit/1b6ac55ec2d72bc1245d959cd9db4215b5b09e91))
* build-time tests fail ([b198809](https://github.com/bluelibs/bluelibs/commit/b198809893e5a19a7a0eef2c88f8587cf8e20305))
* **nova:** [#351](https://github.com/bluelibs/bluelibs/issues/351) avoiding expansion of fieldNodes that are already parents ([6d54c7c](https://github.com/bluelibs/bluelibs/commit/6d54c7c17e6093cfe302e7d0989b794d549bfee1))
* **nova:** checking consistency differently for direct many links to ensure a fail-safe solution ([0073d0f](https://github.com/bluelibs/bluelibs/commit/0073d0f3a6ed857ebecc07e619a7ecc0c1a22260))
* **nova:** export Linker ([2d409b8](https://github.com/bluelibs/bluelibs/commit/2d409b812561ae2196d01392cce1c7fe4ca8393a))
* **nova:** filter-out subfields with _ids that usually lead to infinite recursion and either way they are not supported ([06a893f](https://github.com/bluelibs/bluelibs/commit/06a893fd1a07808bf46d1a7547945746bfb548a0))
* **nova:** leftovers ([cd276d8](https://github.com/bluelibs/bluelibs/commit/cd276d88cecd95184e18e86ae305cfc378a2cfbe))
* **nova:** prepare for mongodb 4+ upgrade ([102c522](https://github.com/bluelibs/bluelibs/commit/102c5225c01356932e2670b786c823a709ac774b))
* **nova:** propper patch to addLinks ([d710202](https://github.com/bluelibs/bluelibs/commit/d7102020e3b8f1dea2fa967bbeb5bbb080856c18))
* **nova:** random tests because geopoint index was not initialised ([da7ccfd](https://github.com/bluelibs/bluelibs/commit/da7ccfd5125a4d028ab9168c0e367a0eccb303dc))
* **nova:** remove $ special key from reducer dependecy type ([1cfe106](https://github.com/bluelibs/bluelibs/commit/1cfe10668f32cb3948c8dc12d1d260c99db637bf))
* **nova:** retrieve nested foreign fields ([004e418](https://github.com/bluelibs/bluelibs/commit/004e418ba4af4e13d0cbceb870a146cddf4fdd99))
* **nova:** session under links ([42c1f22](https://github.com/bluelibs/bluelibs/commit/42c1f22f03a54ea93af8289203496bf59cd284a0))
* **nova:** support for typescript 4.5 ([5322b6a](https://github.com/bluelibs/bluelibs/commit/5322b6a66c6a8ee59a78aa0caf7b2aac9df97063))
* **nova:** tests and pack updates ([7fe27b5](https://github.com/bluelibs/bluelibs/commit/7fe27b557794d9511cf9d1415fd138086883037f))
* **nova:** typesafety for decorate() ([81f0ac7](https://github.com/bluelibs/bluelibs/commit/81f0ac793a5d97cec82f63f6be4b84c1016cffe7))
* **nova:** typesafety for links ([fdee4a7](https://github.com/bluelibs/bluelibs/commit/fdee4a7bc48d061e0ebc289c7bd91237821b01fd))
* **nova:** weird infinite loop for reducer dependencies ([2d0424f](https://github.com/bluelibs/bluelibs/commit/2d0424f901565ff7c7613e513b0f7dad9bd73c19))
* **various:** updated deps and others ([be34b85](https://github.com/bluelibs/bluelibs/commit/be34b85fee6c61ee5d8057febce1c582edfe314d))


### Features

* decorate() ([6f4417e](https://github.com/bluelibs/bluelibs/commit/6f4417e3c1c27fedefbc2399ff4f0f6bc50ca50c))
* **nova:** Add foreignField when defining relations ([0442613](https://github.com/bluelibs/bluelibs/commit/0442613ac5748850ac12fffb6e0fccb6a9174999))
* **nova:** added  as special variable inside a body ([b1a1a7c](https://github.com/bluelibs/bluelibs/commit/b1a1a7c453a2bd2a4b12ca8b67d56547713eff4f))
* **nova:** added foreign field to quicklinker ([f3f7903](https://github.com/bluelibs/bluelibs/commit/f3f790376f6618f92075fd5f4a7a2c50eaa60b40))
* **nova:** added session variable ([c9a3dad](https://github.com/bluelibs/bluelibs/commit/c9a3dad735c7cd10a090b9b145e7f5ed304b2e8a))
* **nova:** adding feature of securing a body graph ([50bbd42](https://github.com/bluelibs/bluelibs/commit/50bbd42a046821576204500fbdce39625f2c65b0))
* **nova:** allowed self-referencing expanders to expand the dataset ([162b920](https://github.com/bluelibs/bluelibs/commit/162b9206d6fab7a9030fd33084417c0eab4b1960))
* **nova:** docs for ([66c873e](https://github.com/bluelibs/bluelibs/commit/66c873e00f61ddbeb833f63b71c1dad0d0d08152))
* **nova:** v1.7.0 - cleaned up all dependencies, allowing us to support all mongo versions, at the expense of JIT compiling ([449277b](https://github.com/bluelibs/bluelibs/commit/449277b166f8a04f22d0f83b64431dfb4e1b08c7))
