# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 1.6.0 (2026-08-05)

### Features

- comprehensive security upgrade and dependency hardening ([a192736](https://github.com/bluelibs/bluelibs/commit/a192736ed8918e18a2682954be7fb45061c3ec9f))
- **logger-bundle:** enhanced console ([022b921](https://github.com/bluelibs/bluelibs/commit/022b9215d04443a5b7199609adbd423880284bcb))
- Add an inclusive console severity threshold through `new LoggerBundle({ level: LogLevel.ERROR })`.
- Add `LogLevel.DEBUG`, the default threshold, preserving output for every severity.
- Keep all log events available to custom listeners regardless of console settings.
- Fix console listener initialization and support rendering debug messages.
- Update development compiler and Node types so the package builds with current dependency resolutions.
