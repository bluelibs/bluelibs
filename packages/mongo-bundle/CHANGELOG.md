# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 1.9.0 (2026-08-05)


### Bug Fixes

* align eslint configs and resolve lint errors across infra packages ([1b6ac55](https://github.com/bluelibs/bluelibs/commit/1b6ac55ec2d72bc1245d959cd9db4215b5b09e91))
* **deps:** mongo-bundle dependency ([19c999e](https://github.com/bluelibs/bluelibs/commit/19c999e3c7727d76f8491b3143fad94109093c12))
* mongo-bundle: removed unnecessary abortTransaction call ([9f95a20](https://github.com/bluelibs/bluelibs/commit/9f95a206d4bc5f95b739b36a2c58e7c5e0fcda92))
* **mongo-bundle:** allow nested models for filtering without throwing errors ([42da28e](https://github.com/bluelibs/bluelibs/commit/42da28ea2d81147d573b2b2f620ee3043a0a3a72))
* **mongo-bundle:** docs and type cleanups ([14f5fd5](https://github.com/bluelibs/bluelibs/commit/14f5fd5d35ee53200a59b02e2c9a61caf116f0c3))
* **mongo-bundle:** ejson compatibility ([fefb007](https://github.com/bluelibs/bluelibs/commit/fefb00741572c3758cb06005946beb9cdaac029e))
* **mongo-bundle:** errors and others for the mongo upgrade ([0721052](https://github.com/bluelibs/bluelibs/commit/072105230b7aa7df081035cc9ea6c96abc0c0bd7))
* **mongo-bundle:** fixed mongodb, while preparing for upgrade to 5 ([f3c3346](https://github.com/bluelibs/bluelibs/commit/f3c334650eb35d161fed1f9f48c50d0c40051b15))
* **mongo-bundle:** locking mongo version ([263f619](https://github.com/bluelibs/bluelibs/commit/263f619083ff2d48f1ff2df02ab6dc973c0c5139))
* **mongo-bundle:** migration runners and tests ([994be62](https://github.com/bluelibs/bluelibs/commit/994be627000f7a82da62c1a78c761757d1a578fc))
* **mongo-bundle:** tests ([530f034](https://github.com/bluelibs/bluelibs/commit/530f034fd6f187f70a22e92e3b49d83975ba664b))
* **mongo-bundle:** tests failing issue with types ([c6891de](https://github.com/bluelibs/bluelibs/commit/c6891de64254f6212147569d955b51513cd9362a))
* **mongo-bundle:** tests now pass ([6f0c2ad](https://github.com/bluelibs/bluelibs/commit/6f0c2adf0e42414b48c1060bed13a65f8121deab))
* **mongo-bundle:** typescript issues ([19bd7e0](https://github.com/bluelibs/bluelibs/commit/19bd7e073bba26908146d1ae5ce308c12e0825d9))
* **mongo-bundle:** update filters on nested relations ([69e910b](https://github.com/bluelibs/bluelibs/commit/69e910ba82b255a6abb81bc1f522ef861c53df5e))
* mongo-tests passing and others ([4156100](https://github.com/bluelibs/bluelibs/commit/41561001548960017e28416634d8f92491c2b546))
* **mongodb:** fixed mongodb to 4.2.2 until deep nested field type issue gets resolved ([1de3a95](https://github.com/bluelibs/bluelibs/commit/1de3a955f345bc88df52c1831c438b2208f25154))
* **mongo:** test for validate ([7447848](https://github.com/bluelibs/bluelibs/commit/7447848eb4c8f517629423c595c4d89494ac0b84))
* **mongo:** v1.3.1 - validate to properly use sessions ([7a0eb77](https://github.com/bluelibs/bluelibs/commit/7a0eb77b233b6a57e31a3fd7739efba8f1384819))
* omission of validate due to requirements of cluster ([788cead](https://github.com/bluelibs/bluelibs/commit/788ceade17260bf4a5f4d6572cc4f9b778815ab3))
* tests now run in band ([064564a](https://github.com/bluelibs/bluelibs/commit/064564a3d33e23be3ff7e8202390980d835f73b0))
* timestampable issue with upsert ([f3c3f3a](https://github.com/bluelibs/bluelibs/commit/f3c3f3ab390c22e676aba5057995df9d1b54c106))
* **various:** updated deps and others ([be34b85](https://github.com/bluelibs/bluelibs/commit/be34b85fee6c61ee5d8057febce1c582edfe314d))


### Features

* Achieve 10/10 quality score with comprehensive updates ([90227c7](https://github.com/bluelibs/bluelibs/commit/90227c756283debb4fe3d8cfdc9877254eb62665))
* add index creation on isDeleted field for softdeletable behavior ([9332b2d](https://github.com/bluelibs/bluelibs/commit/9332b2d4b907366ca19d9b04e73e2d2e470c5afc))
* **behaviors:** allow to skip updatedAt/By at insert + overriding timestamps ([b5719b0](https://github.com/bluelibs/bluelibs/commit/b5719b056230873c8385278bb3441dd2627721b4))
* comprehensive security upgrade and dependency hardening ([a192736](https://github.com/bluelibs/bluelibs/commit/a192736ed8918e18a2682954be7fb45061c3ec9f))
* **mongo-bundle:** added deeper support for transactions and sessions ([b295def](https://github.com/bluelibs/bluelibs/commit/b295defdc40ce26ed60c82714a4e1a9c17eccb63))
* **mongo-bundle:** added deepSync direct option ([66a35c7](https://github.com/bluelibs/bluelibs/commit/66a35c744493d9df5ba948e6e6d40ac843a0d079))
* **mongo-bundle:** added deepSync tests for insertion ([08ee9c8](https://github.com/bluelibs/bluelibs/commit/08ee9c89f9aaa575b8e5c02feafb578f5fb67447))
* **mongo-bundle:** docs and minor release ([1ac26ef](https://github.com/bluelibs/bluelibs/commit/1ac26efcfef6ec68ae3bbdbfc2271dca8774710d))
* **mongo-bundle:** i18n fixes and documentation ([dee8f79](https://github.com/bluelibs/bluelibs/commit/dee8f79464ba762437055ab1bd676d57d731e632))
* **mongo-bundle:** keepInitialUpdateAsNull last fixes ([940326b](https://github.com/bluelibs/bluelibs/commit/940326b08c5714a0eb9b85ae6966da7ad1b874bf))
* **mongo-bundle:** propper event naming ([83eb23f](https://github.com/bluelibs/bluelibs/commit/83eb23f79ea6beeb26d9a6b0ac3dc20f9c0d09b0))
* **mongo-bundle:** translations ([2645dac](https://github.com/bluelibs/bluelibs/commit/2645dac95fae879eafa37c5e17443fda114c8b96))
* **mongo-bundle:** update to latest mongo ([bb5f26b](https://github.com/bluelibs/bluelibs/commit/bb5f26bb09f5d0a8fba1bd0f2f8a1686a5000b8a))
* **mongo-bundle:** update to mongo 4+, deep sync, link operators, smart default setting solution ([41896b4](https://github.com/bluelibs/bluelibs/commit/41896b4f3f004afc778089a5ce2ca32d502a312d))
* **nova:** v1.7.0 - cleaned up all dependencies, allowing us to support all mongo versions, at the expense of JIT compiling ([449277b](https://github.com/bluelibs/bluelibs/commit/449277b166f8a04f22d0f83b64431dfb4e1b08c7))
* **trans:** commit ([77dfa59](https://github.com/bluelibs/bluelibs/commit/77dfa59de72f07effbd6f9332bb2183414c11996))
